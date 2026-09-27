import { Router } from "express";

import { requireAuth } from "@/lib/auth";
import { asyncHandler, validateBody } from "@/middleware";

import {
  getMe,
  postChangePassword,
  postLogin,
  postLogout,
  postSetupAdmin,
} from "./auth.controller";
import { requireSetupKey } from "./auth.utils";
import {
  changePasswordSchema,
  loginSchema,
  setupAdminSchema,
} from "./auth.validator";

export const authRouter = Router();

authRouter.post(
  "/setup-admin",
  requireSetupKey,
  validateBody(setupAdminSchema),
  asyncHandler(postSetupAdmin),
);

authRouter.post("/login", validateBody(loginSchema), asyncHandler(postLogin));

// Both reachable while mustChangePassword is true — everything else blocks
// until the password is changed (see requireAuth's default).
authRouter.get("/me", requireAuth({ allowPasswordChange: true }), getMe);

authRouter.post(
  "/change-password",
  requireAuth({ allowPasswordChange: true }),
  validateBody(changePasswordSchema),
  asyncHandler(postChangePassword),
);

authRouter.post("/logout", asyncHandler(postLogout));
