import type { z } from "zod";

import type { setupAdminSchema } from "./auth.validator";

export type SetupAdminInput = z.infer<typeof setupAdminSchema>;

/** What the endpoint returns. Built explicitly, field by field, so a future
 * change to the User model can never accidentally leak the password hash. */
export interface SetupAdminResult {
  id: number;
  email: string;
  name: string;
  type: string;
}
