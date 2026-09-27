import bcrypt from "bcrypt";

import { prisma } from "@/config/db";
import {
  ACTOR_TYPES,
  OUTCOMES,
  writeAuditLog,
  type RequestMeta,
} from "@/lib/audit";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { userRepository, type User } from "@/repositories/user";

import {
  AUTH_ACTIONS,
  BCRYPT_COST,
  INVALID_CREDENTIALS_MESSAGE,
} from "./auth.constants";
import type {
  ChangePasswordInput,
  ChangePasswordResult,
  LoginInput,
  LoginResult,
  SetupAdminInput,
  SetupAdminResult,
} from "./auth.types";

// Computed once at startup (a real bcrypt hash, not a hardcoded literal) so a
// login attempt for an email that doesn't exist still pays the same bcrypt.compare
// cost as one that does, and response time can't be used to enumerate accounts.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "dummy-password-for-timing-parity",
  BCRYPT_COST,
);

function toSetupAdminResult(user: User): SetupAdminResult {
  return { id: user.id, email: user.email, name: user.name, type: user.type };
}

function toLoginResult(user: User): LoginResult {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    type: user.type,
    mustChangePassword: user.mustChangePassword,
    sessionVersion: user.sessionVersion,
  };
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

    const result = toSetupAdminResult(user);

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

/**
 * Verifies email and password. Wrong email, wrong password, and a disabled or
 * deleted account all reject with the exact same error, so nothing about the
 * response (message, status, or timing) reveals which case occurred.
 */
export async function login(
  input: LoginInput,
  request: RequestMeta,
): Promise<LoginResult> {
  const user = await userRepository.findByEmail(prisma, input.email);

  // Always compare against *some* hash — the user's real one if they exist,
  // otherwise the dummy — so this line runs the same bcrypt work either way.
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.password ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !user.isActive || !passwordMatches) {
    await writeAuditLog(prisma, {
      actorType: ACTOR_TYPES.SYSTEM,
      action: AUTH_ACTIONS.LOGIN_FAILED,
      resourceType: "user",
      resourceId: user ? String(user.id) : null,
      outcome: OUTCOMES.FAILURE,
      // The attempted email, never the password. If a real user was found,
      // resourceId above already identifies them, so this is only useful for
      // the "no matching account" case.
      metadata: user ? undefined : { attemptedEmail: input.email },
      request,
    });

    throw new AppError(
      ERROR_CODES.UNAUTHENTICATED,
      INVALID_CREDENTIALS_MESSAGE,
    );
  }

  const result = toLoginResult(user);

  await writeAuditLog(prisma, {
    actorType: ACTOR_TYPES.USER,
    actorId: user.id,
    action: AUTH_ACTIONS.LOGIN,
    resourceType: "user",
    resourceId: String(user.id),
    outcome: OUTCOMES.SUCCESS,
    request,
  });

  return result;
}

/**
 * Changes the caller's own password: verifies the current one, rejects a new
 * one that resolves to the same hash (the schema already rejects an identical
 * string; this catches it authoritatively), stores the new hash, clears
 * mustChangePassword, and bumps sessionVersion. The bumped version logs this
 * user out on every *other* device on their next request; the controller is
 * responsible for re-establishing the session on *this* device with the new
 * version, using the sessionVersion returned here.
 */
export async function changePassword(
  userId: number,
  input: ChangePasswordInput,
  request: RequestMeta,
): Promise<ChangePasswordResult> {
  const user = await userRepository.findById(prisma, userId);

  if (!user) {
    // Their session was valid a moment ago (requireAuth already checked), but
    // the row is gone now — treat it the same as any other invalid session.
    throw new AppError(ERROR_CODES.SESSION_EXPIRED);
  }

  const currentPasswordMatches = await bcrypt.compare(
    input.currentPassword,
    user.password,
  );

  if (!currentPasswordMatches) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "Current password is incorrect",
    );
  }

  const newPasswordMatchesCurrent = await bcrypt.compare(
    input.newPassword,
    user.password,
  );

  if (newPasswordMatchesCurrent) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "New password must be different from your current password",
    );
  }

  const password = await bcrypt.hash(input.newPassword, BCRYPT_COST);
  const sessionVersion = user.sessionVersion + 1;

  await userRepository.update(prisma, user.id, {
    password,
    mustChangePassword: false,
    sessionVersion,
    updatedBy: user.id,
  });

  await writeAuditLog(prisma, {
    actorType: ACTOR_TYPES.USER,
    actorId: user.id,
    action: AUTH_ACTIONS.PASSWORD_CHANGED,
    resourceType: "user",
    resourceId: String(user.id),
    outcome: OUTCOMES.SUCCESS,
    request,
  });

  return { sessionVersion };
}
