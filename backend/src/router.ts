import { Router } from "express";

import { v1Router } from "@/api/v1";

export const router = Router();

router.use("/v1", v1Router);
