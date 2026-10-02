import { Router } from "express";

import { authRouter } from "./auth";
import { healthRouter } from "./health";
import { environmentsRouter } from "./environments";

export const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/environments", environmentsRouter);
