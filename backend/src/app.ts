import cors from "cors";
import express from "express";

import { env } from "@/config";
import { AppError, ERROR_CODES, requestId, sessionMiddleware } from "@/lib";
import { errorHandler, notFound } from "@/middleware";
import { router } from "@/router";

export const app = express();

// Required for `cookie.secure` and rate limiting (later) to work correctly behind a
// reverse proxy / load balancer in production.
if (env.isProduction) {
  app.set("trust proxy", 1);
}

// First: every request (including ones CORS or the session middleware reject)
// gets a request id, so it can still be traced in logs and audit rows.
app.use(requestId);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: same-origin requests, curl, server-to-server calls.
      if (!origin || env.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError(ERROR_CODES.UNAUTHENTICATED, "Origin not allowed"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(sessionMiddleware);

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
