import type { DbClient } from "../types";
import type {
  CreateEntityInput,
  Entity,
  UpdateEntityInput,
} from "./entity.types";

export function findByProject(
  client: DbClient,
  projectId: number,
  options: { includeDeleted: boolean },
): Promise<Entity[]> {
  return client.entity.findMany({
    where: options.includeDeleted
      ? { projectId }
      : { projectId, deletedAt: null },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
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
