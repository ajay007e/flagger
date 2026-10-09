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
