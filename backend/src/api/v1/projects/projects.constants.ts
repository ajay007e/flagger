export const PROJECT_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PROJECT_KEY_MAX_LENGTH = 50;
export const PROJECT_NAME_MAX_LENGTH = 100;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500;

export const PROJECT_RESOURCE_TYPE = "project";

export const PROJECT_ACTIONS = {
  CREATED: "project.created",
  UPDATED: "project.updated",
  DELETED: "project.deleted",
  RESTORED: "project.restored",
} as const;
