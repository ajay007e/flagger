import bcrypt from "bcrypt";

import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  OUTCOMES,
  writeAuditLog,
  type RequestMeta,
} from "@/lib/audit";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { userRepository } from "@/repositories/user";

import { AUTH_ACTIONS, BCRYPT_COST } from "./auth.constants";
import type { SetupAdminInput, SetupAdminResult } from "./auth.types";

function toResult(user: {
  id: number;
  email: string;
  name: string;
  type: string;
}): SetupAdminResult {
  return { id: user.id, email: user.email, name: user.name, type: user.type };
}

/**
 * Creates the first admin. Only reachable while no active admin exists (the
 * router also requires the setup key, see auth.utils.ts). The existence check
 * and the insert run in one transaction, so two simultaneous calls cannot both
 * succeed.
 */
export async function setupAdmin(
  input: SetupAdminInput,
  request: RequestMeta,
): Promise<SetupAdminResult> {
  return prisma.$transaction(async (tx) => {
    if (await userRepository.hasActiveAdmin(tx)) {
      // Same response as an unknown route: the endpoint gives no sign that an
      // admin already exists.
      throw new AppError(ERROR_CODES.NOT_FOUND);
    }

    const existing = await userRepository.findByEmail(tx, input.email);

    if (existing) {
      throw new AppError(ERROR_CODES.CONFLICT, "Email already in use");
    }

    const password = await bcrypt.hash(input.password, BCRYPT_COST);

    const user = await userRepository.create(tx, {
      email: input.email,
      name: input.name,
      password,
      type: "admin",
      isActive: true,
      mustChangePassword: false,
      updatedBy: null,
    });

    const result = toResult(user);

    await writeAuditLog(tx, {
      actorType: ACTOR_TYPES.SYSTEM,
      action: AUTH_ACTIONS.SETUP_ADMIN,
      resourceType: "user",
      resourceId: String(user.id),
      outcome: OUTCOMES.SUCCESS,
      after: result,
      request,
    });

    return result;
  });
}
