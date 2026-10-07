import type { DbClient } from "../types";
import type {
  CreateEntityInput,
  Entity,
  UpdateEntityInput,
} from "./entity.types";

export async function findPageByProject(
  client: DbClient,
  projectId: number,
  options: {
    includeDeleted: boolean;
    ids?: number[];
    skip: number;
    take: number;
  },
): Promise<{ items: Entity[]; total: number }> {
  const where = {
    projectId,
    ...(options.includeDeleted ? {} : { deletedAt: null }),
    ...(options.ids ? { id: { in: options.ids } } : {}),
  };

  const [items, total] = await Promise.all([
    client.entity.findMany({
      where,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: options.skip,
      take: options.take,
    }),
    client.entity.count({ where }),
  ]);

  return { items, total };
}

export function findActiveById(
  client: DbClient,
  projectId: number,
  id: number,
): Promise<Entity | null> {
  return client.entity.findFirst({ where: { id, projectId, deletedAt: null } });
}

export function findAnyById(
  client: DbClient,
  projectId: number,
  id: number,
): Promise<Entity | null> {
  return client.entity.findFirst({ where: { id, projectId } });
}

export function findByKey(
  client: DbClient,
  projectId: number,
  key: string,
): Promise<Entity | null> {
  return client.entity.findUnique({
    where: { projectId_key: { projectId, key } },
  });
}

export function create(
  client: DbClient,
  input: CreateEntityInput,
): Promise<Entity> {
  return client.entity.create({
    data: {
      projectId: input.projectId,
      key: input.key,
      name: input.name,
      description: input.description,
      updatedBy: input.updatedBy,
    },
  });
}

export function update(
  client: DbClient,
  id: number,
  input: UpdateEntityInput,
): Promise<Entity> {
  return client.entity.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      updatedBy: input.updatedBy,
    },
  });
}

export function softDelete(
  client: DbClient,
  id: number,
  updatedBy: number,
): Promise<Entity> {
  return client.entity.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy },
  });
}

export function restore(
  client: DbClient,
  id: number,
  updatedBy: number,
): Promise<Entity> {
  return client.entity.update({
    where: { id },
    data: { deletedAt: null, updatedBy },
  });
}
