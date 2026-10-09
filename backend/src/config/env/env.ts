import "dotenv/config";

import { z } from "zod";

import { LOG_SCOPES } from "./log-scopes";

const PLACEHOLDER_PREFIX = "change-me";

const secret = z.string().min(32);
const milliseconds = z.coerce.number().int().positive();

const origin = z
  .url({ protocol: /^https?$/ })
  .refine((value) => new URL(value).origin === value, {
    message: "must have no path or trailing slash",
  });

const csv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.url({ protocol: /^mysql$/ }),
    REDIS_URL: z.url({ protocol: /^rediss?$/ }),
    SESSION_SECRET: secret,
    SETUP_API_KEY: secret,
    ALLOWED_ORIGINS: z.string().transform(csv).pipe(z.array(origin).min(1)),
    AUDIT_SPOOL_PATH: z.string().min(1).default("var/audit-spool.jsonl"),
    LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
      .optional(),
    LOG_SCOPES: z
      .string()
      .transform(csv)
      .pipe(z.array(z.enum(LOG_SCOPES)))
      .optional(),
    LOG_SYNC: z.stringbool().default(true),
    LOG_SLOW_QUERY_WARN_MS: milliseconds.default(500),
    LOG_SLOW_QUERY_ERROR_MS: milliseconds.default(2000),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.LOG_SLOW_QUERY_ERROR_MS <= values.LOG_SLOW_QUERY_WARN_MS) {
      ctx.addIssue({
        code: "custom",
        path: ["LOG_SLOW_QUERY_ERROR_MS"],
        message: "must be greater than LOG_SLOW_QUERY_WARN_MS",
      });
    }

    if (values.NODE_ENV !== "production") return;

    for (const key of ["SESSION_SECRET", "SETUP_API_KEY"] as const) {
      if (values[key].startsWith(PLACEHOLDER_PREFIX)) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "must be changed from the example placeholder in production",
        });
      }
    }
  });

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(
      `Invalid environment configuration:\n${z.prettifyError(result.error)}\n\nFix backend/.env (see backend/.env.example) and restart.`,
    );
    process.exit(1);
  }

  const values = result.data;
  const isProduction = values.NODE_ENV === "production";

  return Object.freeze({
    nodeEnv: values.NODE_ENV,
    isProduction,
    port: values.PORT,
    databaseUrl: values.DATABASE_URL,
    redisUrl: values.REDIS_URL,
    sessionSecret: values.SESSION_SECRET,
    setupApiKey: values.SETUP_API_KEY,
    allowedOrigins: values.ALLOWED_ORIGINS,
    auditSpoolPath: values.AUDIT_SPOOL_PATH,
    logLevel: values.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
    logScopes: values.LOG_SCOPES ?? [],
    logSync: values.LOG_SYNC,
    slowQueryWarnMs: values.LOG_SLOW_QUERY_WARN_MS,
    slowQueryErrorMs: values.LOG_SLOW_QUERY_ERROR_MS,
    trustProxyHops: values.TRUST_PROXY_HOPS ?? (isProduction ? 1 : 0),
  });
}

export const env = loadEnv();
