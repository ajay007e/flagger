export const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;

export const DEFAULT_PORT = 4000;

export const SECRET_MIN_LENGTH = 32;

/** Example values in .env.example start with this and are rejected in production. */
export const PLACEHOLDER_PREFIX = "change-me";

/** Applied by the seed script only when the key does not exist yet. */
export const DEFAULT_SYSTEM_SETTINGS = [{ key: "name", value: "Flagger" }];
export const DEFAULT_ENVIRONMENTS = [
  { key: "dev", name: "Development", sortOrder: 0 },
  { key: "staging", name: "Staging", sortOrder: 1 },
  { key: "production", name: "Production", sortOrder: 2 },
];

export const DEFAULT_ROLES = [
  {
    key: "viewer",
    name: "Viewer",
    description: "Can view flags.",
    permissions: ["flag:read"],
  },
  {
    key: "editor",
    name: "Editor",
    description: "Can create, propose changes to, and delete flags.",
    permissions: ["flag:create", "flag:update", "flag:delete"],
  },
  {
    key: "approver",
    name: "Approver",
    description: "Can approve proposed flag changes.",
    permissions: ["flag:approve"],
  },
  {
    key: "auditor",
    name: "Auditor",
    description: "Can read the audit log.",
    permissions: ["audit:read"],
  },
] as const;

export const LOG_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
  "silent",
] as const;

export const LOG_SCOPES = [
  "http",
  "auth",
  "session",
  "db",
  "redis",
  "diagnosis",
  "audit",
  "process",
  "health",
  "environments",
  "projects",
  "entities",
  "users",
] as const;

export const DEFAULT_SLOW_QUERY_WARN_MS = 500;
export const DEFAULT_SLOW_QUERY_ERROR_MS = 2000;
