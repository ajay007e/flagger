import { Router } from "express";

import { requireAuth } from "@/lib/auth";
import { asyncHandler, validateBody } from "@/middleware";

import { requireSetupKey } from "./auth.utils";
import { setupAdminSchema } from "./auth.validator";
import { postSetupAdmin, getMe } from "./auth.controller";

export const authRouter = Router();

authRouter.post(
  "/setup-admin",
  requireSetupKey,
  validateBody(setupAdminSchema),
  asyncHandler(postSetupAdmin),
);

authRouter.get("/me", requireAuth, getMe);
