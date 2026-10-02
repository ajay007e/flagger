export const ENTITY_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ENTITY_KEY_MAX_LENGTH = 50;
export const ENTITY_NAME_MAX_LENGTH = 100;
export const ENTITY_DESCRIPTION_MAX_LENGTH = 500;

export const ENTITY_RESOURCE_TYPE = "entity";

export const ENTITY_ACTIONS = {
  CREATED: "entity.created",
  UPDATED: "entity.updated",
  DELETED: "entity.deleted",
  RESTORED: "entity.restored",
} as const;
