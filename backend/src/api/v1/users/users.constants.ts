export const USER_ACTIONS = {
  CREATED: "user.created",
} as const;

export const TEMP_PASSWORD_BYTES = 12;
export const USER_EMAIL_MAX_LENGTH = 255;
export const USER_NAME_MAX_LENGTH = 255;
export const USER_TYPES = ["admin", "user"] as const;

export const USER_STATUSES = ["active", "disabled", "deleted"] as const;
export const USER_SEARCH_MAX_LENGTH = 100;
