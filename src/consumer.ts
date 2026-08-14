import PostalMime from "postal-mime";
import type { BaseEnv } from "./types";
import { inspectMail } from "./mail-security";

function extractCode(subject: string, text: string): string | null {
  const match = `${subject}\n${text}`.match(/(?:^|\D)(\d{4,8})(?:\D|$)/);
  return match?.[1] ?? null;
}

export default {
  async queue(batch: MessageBatch<{ messageId: string; rawKey: string; envelopeFrom?: string }>, env: BaseEnv): Promise<void> {
    for (const queued of batch.messages) {
      try {
        if (!env.MAIL_BUCKET) throw new Error("r2_binding_missing");
        const raw = await env.MAIL_BUCKET.get(queued.body.rawKey);
        if (!raw) throw new Error("raw_message_missing");
        const email = await PostalMime.parse(await raw.arrayBuffer());
        const parsedKey = `parsed/${queued.body.messageId}.json`;
        const body = {
          text: email.text ?? "",
          html: email.html ?? "",
        };
        await env.MAIL_BUCKET.put(parsedKey, JSON.stringify(body), {
          httpMetadata: { contentType: "application/json" },
        });
        const sender = email.from?.address ?? email.from?.name ?? null;
        const subject = email.subject ?? "(no subject)";
        const security = inspectMail(email, queued.body.envelopeFrom ?? email.returnPath ?? "");
        await env.DB.prepare(
          "UPDATE messages SET sender = ?, subject = ?, verification_code = ?, parsed_object_key = ?, status = 'ready', parsed_at = ?, risk_score = ?, risk_level = ?, security_report = ? WHERE id = ?",
        ).bind(sender, subject, extractCode(subject, body.text), parsedKey, Math.floor(Date.now() / 1000), security.riskScore, security.riskLevel, JSON.stringify(security), queued.body.messageId).run();
        queued.ack();
      } catch (error) {
        console.error("email_parse_error", queued.body.messageId, error);
        queued.retry();
      }
    }
  },
};
