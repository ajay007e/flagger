import { z } from "zod";

// Deliberately loose, mirrors the backend's own login schema (backend/src/api/v1/auth/auth.validator.ts):
// a login attempt just needs "something was submitted", not password strength rules.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
