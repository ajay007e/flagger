import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  OUTCOMES,
  writeAuditLog,
  type RequestMeta,
} from "@/lib/audit";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { getLogger } from "@/lib/logger";
import { UserListItem, userRepository, type User } from "@/repositories/user";

import { USER_ACTIONS } from "./users.constants";
import type {
  CreateUserInput,
  CreateUserResult,
  ListUsersQuery,
  ResetPasswordResult,
  UpdateUserInput,
  UserSnapshot,
} from "./users.types";
import {
  getSkipTake,
  toPaginatedData,
  type PaginatedData,
} from "@/lib/pagination";
import { assertNotLastAdmin, generateTemporaryPassword } from "./users.utils";

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
  const { temporaryPassword, hash: password } =
    await generateTemporaryPassword();

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

export async function listUsers(
  query: ListUsersQuery,
): Promise<PaginatedData<UserListItem>> {
  const { items, total } = await userRepository.findPage(prisma, {
    search: query.search,
    type: query.type,
    status: query.status,
    ...getSkipTake(query),
  });

  return toPaginatedData(items, total, query);
}

export function updateUser(
  id: number,
  input: UpdateUserInput,
  actorId: number,
  request: RequestMeta,
): Promise<UserSnapshot> {
  return prisma.$transaction(async (tx) => {
    if (input.type === "user") await assertNotLastAdmin(tx, id);

    const before = await userRepository.findById(tx, id);

    if (!before) {
      log.info(
        "users.lookup.missing",
        "User update refused because no active or disabled user matches",
        { data: { userId: id } },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found");
    }

    const changed =
      (input.name !== undefined && input.name !== before.name) ||
      (input.type !== undefined && input.type !== before.type);

    if (!changed) return toSnapshot(before);

    const user = await userRepository.update(tx, id, {
      name: input.name,
      type: input.type,
      updatedBy: actorId,
    });

    const after = toSnapshot(user);

    await writeAuditLog(tx, {
      actorType: ACTOR_TYPES.USER,
      actorId,
      action: USER_ACTIONS.UPDATED,
      resourceType: "user",
      resourceId: String(user.id),
      outcome: OUTCOMES.SUCCESS,
      before: toSnapshot(before),
      after,
      request,
    });

    return after;
  });
}

function setActive(
  id: number,
  isActive: boolean,
  actorId: number,
  request: RequestMeta,
): Promise<UserSnapshot> {
  return prisma.$transaction(async (tx) => {
    if (!isActive) await assertNotLastAdmin(tx, id);

    const before = await userRepository.findById(tx, id);

    if (!before) {
      log.info(
        "users.lookup.missing",
        "User status change refused because no active or disabled user matches",
        { data: { userId: id } },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found");
    }

    if (before.isActive === isActive) return toSnapshot(before);

    const user = await userRepository.update(tx, id, {
      isActive,
      sessionVersion: isActive ? undefined : before.sessionVersion + 1,
      updatedBy: actorId,
    });

    const after = toSnapshot(user);

    await writeAuditLog(tx, {
      actorType: ACTOR_TYPES.USER,
      actorId,
      action: isActive ? USER_ACTIONS.ENABLED : USER_ACTIONS.DISABLED,
      resourceType: "user",
      resourceId: String(user.id),
      outcome: OUTCOMES.SUCCESS,
      before: toSnapshot(before),
      after,
      request,
    });

    return after;
  });
}

export function disableUser(
  id: number,
  actorId: number,
  request: RequestMeta,
): Promise<UserSnapshot> {
  return setActive(id, false, actorId, request);
}

export function enableUser(
  id: number,
  actorId: number,
  request: RequestMeta,
): Promise<UserSnapshot> {
  return setActive(id, true, actorId, request);
}

export async function resetPassword(
  id: number,
  actorId: number,
  request: RequestMeta,
): Promise<ResetPasswordResult> {
  const { temporaryPassword, hash } = await generateTemporaryPassword();

  return prisma.$transaction(async (tx) => {
    const before = await userRepository.findById(tx, id);

    if (!before) {
      log.info(
        "users.lookup.missing",
        "Password reset refused because no active or disabled user matches",
        { data: { userId: id } },
      );
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found");
    }

    const user = await userRepository.update(tx, id, {
      password: hash,
      mustChangePassword: true,
      sessionVersion: before.sessionVersion + 1,
      updatedBy: actorId,
    });

    await writeAuditLog(tx, {
      actorType: ACTOR_TYPES.USER,
      actorId,
      action: USER_ACTIONS.PASSWORD_RESET,
      resourceType: "user",
      resourceId: String(user.id),
      outcome: OUTCOMES.SUCCESS,
      request,
    });

    return { ...toSnapshot(user), temporaryPassword };
  });
}
