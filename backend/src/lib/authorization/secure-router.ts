import { Router, type RequestHandler, type RouterOptions } from "express";

import { requireAuth } from "@/lib/auth";

import { authorize } from "./middleware";
import type { AccessRule } from "./types";

type Register = (
  path: string,
  access: AccessRule,
  ...handlers: RequestHandler[]
) => void;

export function secureRouter(options?: RouterOptions) {
  const router = Router(options);

  router.use(requireAuth());

  const register =
    (method: "get" | "post" | "put" | "patch" | "delete"): Register =>
    (path, access, ...handlers) => {
      router[method](path, authorize(access), ...handlers);
    };

  return {
    router,
    get: register("get"),
    post: register("post"),
    put: register("put"),
    patch: register("patch"),
    delete: register("delete"),
  };
}
