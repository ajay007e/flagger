import { Router } from "express";

import { healthRouter } from "@/api/health";

export const router = Router();

router.use("/health", healthRouter);
