import { instrument } from "@/lib/logger";

import * as service from "./access.service";

export const accessService = instrument("access", service);
