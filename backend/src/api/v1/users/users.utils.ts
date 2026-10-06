import type { AuditClient } from "@/lib/audit";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger } from "@/lib/logger";
import { userRepository } from "@/repositories/user";

const log = getLogger("users");

export async function assertNotLastAdmin(
  tx: AuditClient,
  userId: number,
): Promise<void> {
  const adminIds = await userRepository.lockActiveAdminIds(tx);

  if (adminIds.length === 1 && adminIds[0] === userId) {
    log.warn(
      "users.last_admin.refused",
      "Change refused because the user is the last active admin",
      { data: { userId, activeAdmins: adminIds.length } },
    );
    throw new AppError(ERROR_CODES.LAST_ADMIN);
  }
}
