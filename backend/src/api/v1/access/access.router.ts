import { scoped, secureRouter } from "@/lib/authorization";
import { asyncHandler } from "@/middleware";

import { getAvailableAccess } from "./access.controller";

const secure = secureRouter();

export const accessRouter = secure.router;

secure.get("/available", scoped, asyncHandler(getAvailableAccess));
