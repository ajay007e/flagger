export const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;

export const DEFAULT_PORT = 4000;

export const SECRET_MIN_LENGTH = 32;

/** Example values in .env.example start with this and are rejected in production. */
export const PLACEHOLDER_PREFIX = "change-me";

/** Applied by the seed script only when the key does not exist yet. */
export const DEFAULT_SYSTEM_SETTINGS = [{ key: "name", value: "Flagger" }];
