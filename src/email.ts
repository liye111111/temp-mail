import type { EmailEnv, InboxRow } from "./types";
import PostalMime from "postal-mime";

function extractCode(subject: string, text: string): string | null {
  const match = `${subject}\n${text}`.match(/(?:^|\D)(\d{4,8})(?:\D|$)/);
  return match?.[1] ?? null;
}

function truncateUtf8(value: string, maxBytes: number): string {
  if (new TextEncoder().encode(value).byteLength <= maxBytes) return value;
  let low = 0;
  let high = value.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (new TextEncoder().encode(value.slice(0, middle)).byteLength <= maxBytes) low = middle;
    else high = middle - 1;
  }
  return value.slice(0, low);
}

export default {
  async email(message: ForwardableEmailMessage, env: EmailEnv): Promise<void> {
    const recipient = message.to.toLowerCase();
    const inbox = await env.DB.prepare(
      "SELECT id, address, expires_at FROM inboxes WHERE address = ? AND expires_at > ?",
    ).bind(recipient, Math.floor(Date.now() / 1000)).first<InboxRow>();
    if (!inbox) {
      message.setReject("Unknown or expired temporary inbox");
      return;
    }

    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM messages WHERE inbox_id = ?")
      .bind(inbox.id).first<{ count: number }>();
    if ((count?.count ?? 0) >= Number(env.MAX_MESSAGES_PER_INBOX)) {
      message.setReject("Temporary inbox is full");
      return;
    }

    if (message.rawSize > Number(env.MAX_MESSAGE_SIZE_BYTES)) {
      message.setReject("Message exceeds size limit");
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const rateBucket = `accepted:${Math.floor(now / 3600)}`;
    const rate = await env.DB.prepare(
      "INSERT INTO mail_rate_limits (bucket, count, updated_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at RETURNING count",
    ).bind(rateBucket, now).first<{ count: number }>();
    if ((rate?.count ?? 1) > Number(env.MAX_ACCEPTED_MESSAGES_PER_HOUR)) {
      message.setReject("Temporary mail service is at capacity");
      return;
    }

    const messageId = crypto.randomUUID();

    if (env.USE_R2 !== "true") {
      const email = await PostalMime.parse(await new Response(message.raw).arrayBuffer());
      const subject = email.subject ?? "(no subject)";
      const maxBodyBytes = Number(env.MAX_D1_BODY_BYTES);
      const text = truncateUtf8(email.text ?? "", maxBodyBytes);
      const html = truncateUtf8(email.html ?? "", maxBodyBytes);
      const sender = email.from?.address ?? email.from?.name ?? null;
      await env.DB.prepare(
        "INSERT INTO messages (id, inbox_id, envelope_from, envelope_to, sender, subject, verification_code, raw_object_key, size_bytes, status, received_at, parsed_at, text_body, html_body) VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, 'ready', ?, ?, ?, ?)",
      ).bind(
        messageId, inbox.id, message.from, recipient, sender, subject, extractCode(subject, text),
        message.rawSize, now, now, text, html,
      ).run();
      return;
    }

    if (!env.MAIL_BUCKET || !env.EMAIL_QUEUE) throw new Error("R2 mode bindings are missing");
    const rawKey = `raw/${inbox.id}/${messageId}.eml`;
    // Email Routing exposes an unknown-length stream, while R2 requires a body
    // with a known length. The size guard above caps this buffer at 2 MiB.
    const rawBytes = await new Response(message.raw).arrayBuffer();
    await env.MAIL_BUCKET.put(rawKey, rawBytes, {
      customMetadata: { inboxId: inbox.id, messageId },
      httpMetadata: { contentType: "message/rfc822" },
    });
    const object = await env.MAIL_BUCKET.head(rawKey);
    if ((object?.size ?? 0) > Number(env.MAX_MESSAGE_SIZE_BYTES)) {
      await env.MAIL_BUCKET.delete(rawKey);
      message.setReject("Message exceeds size limit");
      return;
    }

    await env.DB.prepare(
      "INSERT INTO messages (id, inbox_id, envelope_from, envelope_to, raw_object_key, size_bytes, status, received_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)",
    ).bind(messageId, inbox.id, message.from, recipient, rawKey, object?.size ?? null, Math.floor(Date.now() / 1000)).run();
    await env.EMAIL_QUEUE.send({ messageId, rawKey });
  },
};
