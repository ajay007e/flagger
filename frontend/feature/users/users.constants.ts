export const USER_TYPES = ["admin", "user"] as const;
export const USER_STATUSES = ["active", "disabled", "deleted"] as const;

export const USER_TYPE_LABELS = { admin: "Admin", user: "User" } as const;
export const USER_STATUS_LABELS = {
  active: "Active",
  disabled: "Disabled",
  deleted: "Deleted",
} as const;

export const USER_EMAIL_MAX_LENGTH = 255;
export const USER_NAME_MAX_LENGTH = 255;
export const USER_SEARCH_MAX_LENGTH = 100;

export const USERS_PAGE_SIZE = 20;
export const USERS_SEARCH_DEBOUNCE_MS = 300;
