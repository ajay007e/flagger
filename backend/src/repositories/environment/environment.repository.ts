import type { DbClient } from "../types";
import type {
  CreateEnvironmentInput,
  Environment,
  UpdateEnvironmentInput,
} from "./environment.types";

const ORDER = [{ sortOrder: "asc" }, { id: "asc" }] as const;

export function findAll(
  client: DbClient,
  options: { includeDeleted: boolean },
): Promise<Environment[]> {
  return client.environment.findMany({
    where: options.includeDeleted ? {} : { deletedAt: null },
    orderBy: [...ORDER],
  });
}

export function findActiveById(
  client: DbClient,
  id: number,
): Promise<Environment | null> {
  return client.environment.findFirst({ where: { id, deletedAt: null } });
}

export function findAnyById(
  client: DbClient,
  id: number,
): Promise<Environment | null> {
  return client.environment.findUnique({ where: { id } });
}

export function findByKey(
  client: DbClient,
  key: string,
): Promise<Environment | null> {
  return client.environment.findUnique({ where: { key } });
}

export async function getMaxSortOrder(client: DbClient): Promise<number> {
  const result = await client.environment.aggregate({
    where: { deletedAt: null },
    _max: { sortOrder: true },
  });

  return result._max.sortOrder ?? -1;
}

export function create(
  client: DbClient,
  input: CreateEnvironmentInput,
): Promise<Environment> {
  return client.environment.create({
    data: {
      key: input.key,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
      updatedBy: input.updatedBy,
    },
  });
}

export function update(
  client: DbClient,
  id: number,
  input: UpdateEnvironmentInput,
): Promise<Environment> {
  return client.environment.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      updatedBy: input.updatedBy,
    },
  });
}

export function setSortOrder(
  client: DbClient,
  id: number,
  sortOrder: number,
  updatedBy: number,
): Promise<Environment> {
  return client.environment.update({
    where: { id },
    data: { sortOrder, updatedBy },
  });
}

export function softDelete(
  client: DbClient,
  id: number,
  updatedBy: number,
): Promise<Environment> {
  return client.environment.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy },
  });
}

export function restore(
  client: DbClient,
  id: number,
  updatedBy: number,
): Promise<Environment> {
  return client.environment.update({
    where: { id },
    data: { deletedAt: null, updatedBy },
  });
}
