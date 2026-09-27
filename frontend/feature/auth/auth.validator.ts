import { z } from "zod";

// Deliberately loose, mirrors the backend's own login schema (backend/src/api/v1/auth/auth.validator.ts):
// a login attempt just needs "something was submitted", not password strength rules.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Mirrors the backend's changePasswordSchema (min length + must differ from current).
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Must be at least 8 characters"),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Must be different from your current password",
    path: ["newPassword"],
  });
