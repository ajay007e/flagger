import { randomBytes } from "node:crypto";

import bcrypt from "bcrypt";

import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  OUTCOMES,
  writeAuditLog,
  type RequestMeta,
} from "@/lib/audit";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger } from "@/lib/logger";
import { userRepository, type User } from "@/repositories/user";

import { BCRYPT_COST } from "../auth/auth.constants";
import { TEMP_PASSWORD_BYTES, USER_ACTIONS } from "./users.constants";
import type {
  CreateUserInput,
  CreateUserResult,
  UserSnapshot,
} from "./users.types";

const log = getLogger("users");

function toSnapshot(user: User): UserSnapshot {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    type: user.type,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function createUser(
  input: CreateUserInput,
  actorId: number,
  request: RequestMeta,
): Promise<CreateUserResult> {
  const temporaryPassword =
    randomBytes(TEMP_PASSWORD_BYTES).toString("base64url");
  const password = await bcrypt.hash(temporaryPassword, BCRYPT_COST);

  return prisma.$transaction(async (tx) => {
    const existing = await userRepository.findByEmailIncludingDeleted(
      tx,
      input.email,
    );

    if (existing) {
      log.warn(
        "users.create.rejected",
        "User creation refused because the email is already in use",
        {
          data: {
            reason: "email_taken",
            existingDeleted: existing.deletedAt !== null,
          },
        },
      );
      throw new AppError(ERROR_CODES.CONFLICT, "Email already in use");
    }

    const user = await userRepository.create(tx, {
      email: input.email,
      name: input.name,
      password,
      type: input.type,
      isActive: true,
      mustChangePassword: true,
      updatedBy: actorId,
    });

    const snapshot = toSnapshot(user);

    await writeAuditLog(tx, {
      actorType: ACTOR_TYPES.USER,
      actorId,
      action: USER_ACTIONS.CREATED,
      resourceType: "user",
      resourceId: String(user.id),
      outcome: OUTCOMES.SUCCESS,
      after: snapshot,
      request,
    });

    return { ...snapshot, temporaryPassword };
  });
}
