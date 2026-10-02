import { Router } from "express";

import { authRouter } from "./auth";
import { healthRouter } from "./health";
import { environmentsRouter } from "./environments";
import { projectsRouter } from "./projects";

export const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/environments", environmentsRouter);
v1Router.use("/projects", projectsRouter);
