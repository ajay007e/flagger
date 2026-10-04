import { instrument } from "@/lib/logger";

import * as service from "./projects.service";

export const projectsService = instrument("projects", service);
