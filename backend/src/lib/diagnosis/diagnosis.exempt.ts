import { GUARD_EXEMPT_PATHS } from "./diagnosis.constants";

export function isDiagnosisExempt(path: string): boolean {
  const p = path.replace(/\/+$/, "");
  return GUARD_EXEMPT_PATHS.some((e) => p === e || p.startsWith(`${e}/`));
}
