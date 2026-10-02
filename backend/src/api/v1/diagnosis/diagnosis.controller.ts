import type { Request, Response } from "express";

import { diagnosis } from "@/lib";

export function getDiagnosis(_req: Request, res: Response): void {
  res.set("Cache-Control", "no-store");
  res.json({ success: true, data: diagnosis.snapshot() });
}
