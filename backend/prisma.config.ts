import "dotenv/config";

import { defineConfig } from "prisma/config";

// Read by the Prisma CLI only (generate, migrate, seed). The app itself gets its
// validated configuration from src/config. Plain process.env is used here so
// `prisma generate` still works on a fresh clone before .env exists.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/db/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
