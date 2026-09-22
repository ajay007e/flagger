import cors from "cors";
import express from "express";

import { errorHandler, notFound } from "@/middleware";
import { router } from "@/router";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
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

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);
