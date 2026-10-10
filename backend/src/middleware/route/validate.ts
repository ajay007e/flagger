import type { NextFunction, RequestHandler } from "express";
import type { ZodType } from "zod";

import { AppError, ERROR_CODES } from "@/lib";
import { getLogger, recordRoute } from "@/lib/logger";

type Issue = { path: PropertyKey[]; code: string; message: string };

type Source = "body" | "params" | "query";

const log = getLogger("http");

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

function fieldNames(issues: ReadonlyArray<Issue>, source: Source): string[] {
  return [
    ...new Set(
      issues.map((issue) => issue.path.map(String).join(".") || source),
    ),
  ];
}

function fail(
  next: NextFunction,
  source: Source,
  issues: ReadonlyArray<Issue>,
): void {
  const rejectedFields = fieldNames(issues, source);

  log.warn(
    "request.validation.failed",
    `Request ${source} failed validation on ${rejectedFields.length} field(s)`,
    { data: { source, rejectedFields, issueCount: issues.length } },
  );

  next(new AppError(ERROR_CODES.VALIDATION_ERROR, formatIssues(issues)));
}

export function validateBody(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    recordRoute(req, res);

    const result = schema.safeParse(req.body);

    if (!result.success) return fail(next, "body", result.error.issues);

    req.body = result.data;
    next();
  };
}

export function validateParams(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    recordRoute(req, res);

    const result = schema.safeParse(req.params);

    if (!result.success) return fail(next, "params", result.error.issues);

    next();
  };
}

export function validateQuery(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    recordRoute(req, res);

    const result = schema.safeParse(req.query);

    if (!result.success) return fail(next, "query", result.error.issues);

    req.query = result.data as typeof req.query;
    next();
  };
}
