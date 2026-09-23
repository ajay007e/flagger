import { Router } from "express";

import { healthRouter } from "./health";

export const v1Router = Router();

v1Router.use("/health", healthRouter);
