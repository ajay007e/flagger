import { instrument } from "@/lib/logger";

import * as service from "./entities.service";

export const entitiesService = instrument("entities", service);
