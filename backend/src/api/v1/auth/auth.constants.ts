/** Header carrying the setup key required to create the first admin. */
export const SETUP_API_KEY_HEADER = "x-setup-key";

/** bcrypt work factor. ~250ms per hash on typical hardware; adjust if that changes. */
export const BCRYPT_COST = 12;

/** bcrypt silently truncates at 72 bytes, so longer passwords are rejected up front
 * instead of quietly hashing only part of them. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export const AUTH_ACTIONS = {
  SETUP_ADMIN: "auth.setup_admin",
} as const;
