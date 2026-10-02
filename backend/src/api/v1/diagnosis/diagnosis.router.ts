import { Router } from "express";

import { getDiagnosis } from "./diagnosis.controller";

export const diagnosisRouter = Router();

diagnosisRouter.get("/", getDiagnosis);
