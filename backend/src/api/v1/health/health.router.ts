import { Router } from "express";

import { asyncHandler } from "@/middleware";

import { getHealth } from "./health.controller";

export const healthRouter = Router();

healthRouter.get("/", asyncHandler(getHealth));
