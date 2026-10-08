import { adminOnly, scoped, secureRouter } from "@/lib/authorization";
import { asyncHandler } from "@/middleware";

import { getAvailableAccess, getRoles } from "./access.controller";

const secure = secureRouter();

export const accessRouter = secure.router;

secure.get("/available", scoped, asyncHandler(getAvailableAccess));
secure.get("/roles", adminOnly, asyncHandler(getRoles));
