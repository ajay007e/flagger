import { instrument } from "@/lib/logger";

import * as service from "./environments.service";

export const environmentsService = instrument("environments", service);
