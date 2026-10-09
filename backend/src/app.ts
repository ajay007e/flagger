import express from "express";

import { env } from "@/config";
import {
  corsMiddleware,
  diagnosisGuard,
  errorHandler,
  notFound,
  requestId,
  sessionUnlessExempt,
} from "@/middleware";
import { router } from "@/router";

export const app = express();

if (env.trustProxyHops > 0) {
  app.set("trust proxy", env.trustProxyHops);
}

app.use(requestId);
//app.use(requestLogger);
app.use(corsMiddleware);
app.use(diagnosisGuard);
app.use(express.json());
app.use(sessionUnlessExempt);

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);
