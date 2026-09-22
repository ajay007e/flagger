/**
 * The full session record kept in Redis is only ever these two fields.
 * Everything else (roles, permissions, profile data) is loaded fresh from
 * the database on each request instead of being cached here.
 */
export interface SessionData {
  userId: number;
  /** Compared against the user's current session_version; a mismatch logs the session out. */
  sessionVersion: number;
}
