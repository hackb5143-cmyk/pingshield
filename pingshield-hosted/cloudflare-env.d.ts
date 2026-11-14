declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    DEMO_OWNER_PASSCODE?: string;
    OWNER_SESSION_SECRET?: string;
    REPORT_HASH_SECRET?: string;
    JAMBONZ_API_BASE?: string;
    JAMBONZ_ACCOUNT_SID?: string;
    JAMBONZ_API_KEY?: string;
    MASKED_CALL_NUMBER?: string;
    OWNER_PHONE_NUMBER?: string;
    EMAIL_PROVIDER?: string;
    OWNER_NOTIFICATION_EMAIL?: string;
    FORM_SUBMIT_FORM_ID?: string;
  }
}
