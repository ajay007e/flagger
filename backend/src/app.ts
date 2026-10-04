import cors from "cors";
import express from "express";

import { env } from "@/config";
import {
  AppError,
  diagnosisGuard,
  ERROR_CODES,
  isDiagnosisExempt,
  requestId,
  sessionMiddleware,
} from "@/lib";
import { errorHandler, notFound, requestLogger } from "@/middleware";
import { router } from "@/router";

export const app = express();

if (env.trustProxyHops > 0) {
  app.set("trust proxy", env.trustProxyHops);
}

// First: every request (including ones CORS or the session middleware reject)
// gets a request id, so it can still be traced in logs and audit rows.
app.use(requestId);
app.use(requestLogger);

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

// After cors (so the browser can read the 503), before json/session (so a
// Redis outage returns 503, not a session error).
app.use(diagnosisGuard);

app.use(express.json());

// Health and diagnosis are public and must work with Redis down, so they skip
// the session store (a request carrying a cookie would otherwise hit Redis).
app.use((req, res, next) =>
  isDiagnosisExempt(req.path) ? next() : sessionMiddleware(req, res, next),
);

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
