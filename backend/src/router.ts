import { Router } from "express";

import { v1Router } from "@/api/v1";

export const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      name: "Flagger API",
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/v1", v1Router);
