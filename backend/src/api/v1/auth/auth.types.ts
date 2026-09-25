import type { z } from "zod";

import type { loginSchema, setupAdminSchema } from "./auth.validator";

export type SetupAdminInput = z.infer<typeof setupAdminSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** What the setup-admin endpoint returns. Built explicitly, field by field, so
 * a future change to the User model can never accidentally leak the password
 * hash. */
export interface SetupAdminResult {
  id: number;
  email: string;
  name: string;
  type: string;
}

/**
 * What login resolves internally. sessionVersion is used by the controller to
 * populate the session and is never included in the HTTP response — see
 * LoginResponse.
 */
export interface LoginResult {
  id: number;
  email: string;
  name: string;
  type: string;
  mustChangePassword: boolean;
  sessionVersion: number;
}

/** The subset of LoginResult actually sent back to the client. */
export type LoginResponse = Omit<LoginResult, "sessionVersion">;
