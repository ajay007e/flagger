import "dotenv/config";

import { z } from "zod";

import {
  DEFAULT_PORT,
  NODE_ENVIRONMENTS,
  PLACEHOLDER_PREFIX,
  SECRET_MIN_LENGTH,
} from "../constants";

const urlWithProtocol = (protocols: readonly string[]) =>
  z.string().refine(
    (value) => {
      try {
        return protocols.includes(new URL(value).protocol.slice(0, -1));
      } catch {
        return false;
      }
    },
    {
      message: `must be a URL starting with ${protocols
        .map((protocol) => `${protocol}://`)
        .join(" or ")}`,
    },
  );

const secret = z
  .string()
  .min(SECRET_MIN_LENGTH, `must be at least ${SECRET_MIN_LENGTH} characters`);

const isValidOrigin = (value: string): boolean => {
  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === value
    );
  } catch {
    return false;
  }
};

// "http://localhost:3000,https://app.example.com" -> ["http://localhost:3000", ...]
const originList = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .refine((origins) => origins.length > 0, {
    message: "must contain at least one origin",
  })
  .refine((origins) => origins.every(isValidOrigin), {
    message:
      "each origin must be http(s)://host[:port] with no path or trailing slash",
  });

const envSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENVIRONMENTS).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT),
    DATABASE_URL: urlWithProtocol(["mysql"]),
    REDIS_URL: urlWithProtocol(["redis", "rediss"]),
    SESSION_SECRET: secret,
    SETUP_API_KEY: secret,
    ALLOWED_ORIGINS: originList,
  })
  .superRefine((values, ctx) => {
    if (values.NODE_ENV !== "production") {
      return;
    }

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

type Issue = { path: PropertyKey[]; code: string; message: string };

// Only variable names and messages are printed, never their values.
function formatIssues(issues: ReadonlyArray<Issue>): string {
  const lines = issues.map((issue) => {
    const name = issue.path.map(String).join(".") || "(root)";
    const message =
      issue.code === "invalid_type"
        ? "is missing or has the wrong type"
        : issue.message;

    return `  - ${name}: ${message}`;
  });

  return [
    "Invalid environment configuration:",
    ...lines,
    "",
    "Fix the values in backend/.env (see backend/.env.example) and restart.",
  ].join("\n");
}

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(formatIssues(result.error.issues));
    process.exit(1);
  }

  const values = result.data;

  return Object.freeze({
    nodeEnv: values.NODE_ENV,
    isProduction: values.NODE_ENV === "production",
    port: values.PORT,
    databaseUrl: values.DATABASE_URL,
    redisUrl: values.REDIS_URL,
    sessionSecret: values.SESSION_SECRET,
    setupApiKey: values.SETUP_API_KEY,
    allowedOrigins: values.ALLOWED_ORIGINS,
  });
}

export const env = loadEnv();
