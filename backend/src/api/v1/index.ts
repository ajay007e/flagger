import { Router } from "express";

import { authRouter } from "./auth";
import { healthRouter } from "./health";
import { environmentsRouter } from "./environments";
import { projectsRouter } from "./projects";
import { diagnosisRouter } from "./diagnosis";
import { userAccessRouter } from "./user-access";

export const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/environments", environmentsRouter);
v1Router.use("/projects", projectsRouter);
v1Router.use("/diagnosis", diagnosisRouter);
v1Router.use("/users/:userId/access", userAccessRouter);
