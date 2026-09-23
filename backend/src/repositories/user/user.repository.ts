import type { DbClient } from "../types";
import type { CreateUserInput, User } from "./user.types";

/**
 * The only place that reads or writes the `users` table. Callers (auth.service,
 * users.service, ...) never call `prisma.user.*` directly, so this table has
 * exactly one place to add soft-delete filtering, scoping, or auditing rules to
 * later.
 */

export function findByEmail(
  client: DbClient,
  email: string,
): Promise<User | null> {
  return client.user.findFirst({
    where: { email, deletedAt: null },
  });
}

/** True if at least one active, non-deleted admin exists. Used to gate first-admin setup. */
export async function hasActiveAdmin(client: DbClient): Promise<boolean> {
  const admin = await client.user.findFirst({
    where: { type: "admin", isActive: true, deletedAt: null },
    select: { id: true },
  });

  return admin !== null;
}

export function create(
  client: DbClient,
  input: CreateUserInput,
): Promise<User> {
  return client.user.create({
    data: {
      email: input.email,
      name: input.name,
      password: input.password,
      type: input.type,
      isActive: input.isActive,
      mustChangePassword: input.mustChangePassword,
      updatedBy: input.updatedBy,
    },
  });
}
