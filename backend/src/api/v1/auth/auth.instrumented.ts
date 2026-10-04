import { instrument } from "@/lib/logger";

import * as service from "./auth.service";

export const authService = instrument("auth", service);
