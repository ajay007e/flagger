import { diagnosis } from "./diagnosis.service";

/** Wrap every non-diagnosis job. Skips (no queueing, no retry storm) while DOWN. */
export function guardedJob<T>(
  fn: () => Promise<T>,
): () => Promise<T | undefined> {
  return async () => (diagnosis.isUp() ? fn() : undefined);
}
