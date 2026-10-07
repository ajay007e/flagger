import { prisma } from "@/config/db";
import type { Permission } from "@/lib/permissions";
import { userAccessRepository } from "@/repositories/user-access";

import { isAllowed } from "./resolver";
import type { AccessTarget } from "./types";

export async function hasPermission(
  user: { id: number; type: string },
  permission: Permission,
  target: AccessTarget = {},
): Promise<boolean> {
  if (user.type === "admin") return true;

  const grants = await userAccessRepository.findActiveGrantsByUserId(
    prisma,
    user.id,
  );

  return isAllowed(grants, permission, target);
}
