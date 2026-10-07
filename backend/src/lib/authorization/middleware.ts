import type { RequestHandler } from "express";

import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger, recordRoute } from "@/lib/logger";

import { canSee, decide } from "./access";
import type { AccessRule } from "./types";

const log = getLogger("authorization");

function hidden(): AppError {
  log.info(
    "authorization.hidden",
    "Request answered as not found because the resource is not visible to the user",
  );
  return new AppError(ERROR_CODES.NOT_FOUND);
}

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
    const { visibility } = rule;

    return async (req, res, next) => {
      try {
        recordRoute(req, res);

        const user = getCurrentUser(res);

        if (user.type !== "admin" && visibility) {
          const visible =
            visibility === "hidden"
              ? false
              : await canSee(user, visibility(req));

          if (!visible) throw hidden();
        }

        requireAdmin(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  if (rule.kind === "scoped") {
    return (req, res, next) => {
      recordRoute(req, res);
      next();
    };
  }

  return async (req, res, next) => {
    try {
      recordRoute(req, res);

      const decision = await decide(
        getCurrentUser(res),
        rule.permission,
        rule.target?.(req) ?? {},
      );

      if (decision === "hidden") throw hidden();

      if (decision === "forbidden") {
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
