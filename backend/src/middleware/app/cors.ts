import cors from "cors";

import { env } from "@/config";
import { AppError, ERROR_CODES } from "@/lib";

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || env.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new AppError(ERROR_CODES.UNAUTHENTICATED, "Origin not allowed"));
  },
  credentials: true,
});
