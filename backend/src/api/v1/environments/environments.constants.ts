export const ENVIRONMENT_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ENVIRONMENT_KEY_MAX_LENGTH = 50;
export const ENVIRONMENT_NAME_MAX_LENGTH = 100;
export const ENVIRONMENT_DESCRIPTION_MAX_LENGTH = 500;

export const ENVIRONMENT_RESOURCE_TYPE = "environment";

export const ENVIRONMENT_ACTIONS = {
  CREATED: "environment.created",
  UPDATED: "environment.updated",
  DELETED: "environment.deleted",
  RESTORED: "environment.restored",
} as const;
