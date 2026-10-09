import type { RequestHandler } from "express";

import { isDiagnosisExempt, sessionMiddleware } from "@/lib";

export const sessionUnlessExempt: RequestHandler = (req, res, next) =>
  isDiagnosisExempt(req.path) ? next() : sessionMiddleware(req, res, next);
