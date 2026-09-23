import { Router } from "express";

import { requireAuth } from "@/lib/auth";
import { asyncHandler, validateBody } from "@/middleware";

import { getMe, postLogin, postSetupAdmin } from "./auth.controller";
import { requireSetupKey } from "./auth.utils";
import { loginSchema, setupAdminSchema } from "./auth.validator";

export const authRouter = Router();

authRouter.post(
  "/setup-admin",
  requireSetupKey,
  validateBody(setupAdminSchema),
  asyncHandler(postSetupAdmin),
);

authRouter.get("/me", requireAuth, getMe);
authRouter.post("/login", validateBody(loginSchema), asyncHandler(postLogin));
