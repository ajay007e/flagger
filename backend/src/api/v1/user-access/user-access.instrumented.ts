import { instrument } from "@/lib/logger";

import * as service from "./user-access.service";

export const userAccessService = instrument("user-access", service);
