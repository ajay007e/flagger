import type { RequestHandler } from "express";

import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger, recordRoute } from "@/lib/logger";

import { hasPermission } from "./access";
import type { AccessRule } from "./types";

const log = getLogger("authorization");

export function authorize(rule: AccessRule | undefined): RequestHandler {
  if (!rule) {
    return (req, res, next) => {
      recordRoute(req, res);
      log.warn(
        "authorization.undeclared",
        "Request denied because the route declares no access rule",
      );
      next(new AppError(ERROR_CODES.FORBIDDEN));
    };
  }

  if (rule.kind === "admin") {
    return (req, res, next) => {
      recordRoute(req, res);
      requireAdmin(req, res, next);
    };
  }

  return async (req, res, next) => {
    try {
      recordRoute(req, res);

      const allowed = await hasPermission(
        getCurrentUser(res),
        rule.permission,
        rule.target?.(req) ?? {},
      );

      if (!allowed) {
        log.info(
          "authorization.denied",
          "Request denied because no assignment grants the permission",
          { data: { permission: rule.permission } },
        );
        throw new AppError(ERROR_CODES.FORBIDDEN);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
