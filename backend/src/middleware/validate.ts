import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { AppError, ERROR_CODES } from "@/errors";

type Issue = { path: PropertyKey[]; code: string; message: string };

// "email: Invalid email; password: must be at least 8 characters"
function formatIssues(issues: ReadonlyArray<Issue>): string {
  return issues
    .map((issue) => {
      const field = issue.path.map(String).join(".") || "body";
      const message =
        issue.code === "invalid_type"
          ? "is required or has the wrong type"
          : issue.message;

      return `${field}: ${message}`;
    })
    .join("; ");
}

/**
 * Validates req.body against a zod schema. On success req.body is replaced with the
 * parsed value, on failure the request ends with VALIDATION_ERROR.
 */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          formatIssues(result.error.issues),
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}
