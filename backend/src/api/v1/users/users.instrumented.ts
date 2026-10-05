import { instrument } from "@/lib/logger";

import * as service from "./users.service";

export const usersService = instrument("users", service);
