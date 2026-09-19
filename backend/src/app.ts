import cors from "cors";
import express from "express";

import { router } from "@/router";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "Flagger API",
    status: "ok",
    uptime: process.uptime(),
  });
});

app.use("/api", router);
