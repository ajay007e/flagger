import { Router } from "express";

import { asyncHandler, validateBody } from "@/middleware";

import { requireSetupKey } from "./auth.utils";
import { setupAdminSchema } from "./auth.validator";
import { postSetupAdmin } from "./auth.controller";

export const authRouter = Router();

authRouter.post(
  "/setup-admin",
  requireSetupKey,
  validateBody(setupAdminSchema),
  asyncHandler(postSetupAdmin),
);
