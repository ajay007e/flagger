import type { DbClient } from "../types";
import type { Prisma } from "@/generated/prisma/client";
import type {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserListFilters,
  UserListItem,
  UserStatus,
} from "./user.types";

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

export function findById(client: DbClient, id: number): Promise<User | null> {
  return client.user.findFirst({
    where: { id, deletedAt: null },
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

export function update(
  client: DbClient,
  id: number,
  input: UpdateUserInput,
): Promise<User> {
  return client.user.update({
    where: { id },
    data: {
      email: input.email,
      name: input.name,
      password: input.password,
      type: input.type,
      isActive: input.isActive,
      mustChangePassword: input.mustChangePassword,
      sessionVersion: input.sessionVersion,
      updatedBy: input.updatedBy,
    },
  });
}

export async function lockById(client: DbClient, id: number): Promise<void> {
  await client.$queryRaw`SELECT id FROM users WHERE id = ${id} FOR UPDATE`;
}

export function findByEmailIncludingDeleted(
  client: DbClient,
  email: string,
): Promise<User | null> {
  return client.user.findFirst({ where: { email } });
}

const LIST_SELECT = {
  id: true,
  email: true,
  name: true,
  type: true,
  isActive: true,
  mustChangePassword: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

const LIST_ORDER = [{ createdAt: "desc" }, { id: "desc" }] as const;

const STATUS_WHERE = {
  active: { isActive: true, deletedAt: null },
  disabled: { isActive: false, deletedAt: null },
  deleted: { deletedAt: { not: null } },
} satisfies Record<UserStatus, Prisma.UserWhereInput>;

function buildListWhere(filters: UserListFilters): Prisma.UserWhereInput {
  return {
    ...(filters.status ? STATUS_WHERE[filters.status] : { deletedAt: null }),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.search
      ? {
          OR: [
            { email: { contains: filters.search } },
            { name: { contains: filters.search } },
          ],
        }
      : {}),
  };
}

export async function findPage(
  client: DbClient,
  filters: UserListFilters,
): Promise<{ items: UserListItem[]; total: number }> {
  const where = buildListWhere(filters);

  const [items, total] = await Promise.all([
    client.user.findMany({
      where,
      select: LIST_SELECT,
      orderBy: [...LIST_ORDER],
      skip: filters.skip,
      take: filters.take,
    }),
    client.user.count({ where }),
  ]);

  return { items, total };
}
