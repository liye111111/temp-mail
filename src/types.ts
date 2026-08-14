export interface BaseEnv {
  DB: D1Database;
  MAIL_BUCKET?: R2Bucket;
  APP_BASE_URL: string;
  INBOX_DOMAIN: string;
  INBOX_TTL_SECONDS: string;
  MAX_MESSAGES_PER_INBOX: string;
  MAX_MESSAGE_SIZE_BYTES: string;
  SESSION_HMAC_SECRET: string;
  ADDRESS_HASH_SECRET: string;
  USE_R2: string;
  MAX_D1_BODY_BYTES: string;
  MAX_ACCEPTED_MESSAGES_PER_HOUR: string;
  DELETE_EXPIRED_D1_DATA: string;
  ADMIN_ENABLED: string;
  ADMIN_HOSTNAME: string;
  ADMIN_ACCESS_TEAM_DOMAIN: string;
  ADMIN_ACCESS_AUD: string;
  ADMIN_ALLOWED_EMAILS: string;
}

export interface EmailEnv extends BaseEnv {
  EMAIL_QUEUE?: Queue<{ messageId: string; rawKey: string }>;
}

export interface WebEnv {
  ASSETS: Fetcher;
  CANONICAL_HOSTNAME: string;
}

export interface InboxRow {
  id: string;
  address: string;
  expires_at: number;
}

export interface MessageRow {
  id: string;
  sender: string | null;
  envelope_from: string | null;
  subject: string | null;
  verification_code: string | null;
  status: string;
  received_at: number;
  parsed_object_key: string | null;
  text_body: string | null;
  html_body: string | null;
}
