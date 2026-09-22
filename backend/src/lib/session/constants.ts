/** Prefix for every session key in Redis, so `KEYS`, `SCAN`, and friends stay scoped to Flagger. */
export const SESSION_KEY_PREFIX = "flagger:sess:";

/** How long an inactive session is kept, in seconds. Reset on every request. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Name of the session cookie. Deliberately not the default "connect.sid". */
export const SESSION_COOKIE_NAME = "flagger.sid";
