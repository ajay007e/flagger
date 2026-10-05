import type { DbClient } from "../types";
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "./project.types";

export function findAll(
  client: DbClient,
  options: { includeDeleted: boolean },
): Promise<Project[]> {
  return client.project.findMany({
    where: options.includeDeleted ? {} : { deletedAt: null },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export async function findPage(
  client: DbClient,
  options: { includeDeleted: boolean; skip: number; take: number },
): Promise<{ items: Project[]; total: number }> {
  const where = options.includeDeleted ? {} : { deletedAt: null };

  const [items, total] = await Promise.all([
    client.project.findMany({
      where,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: options.skip,
      take: options.take,
    }),
    client.project.count({ where }),
  ]);

  return { items, total };
}

export function findActiveById(
  client: DbClient,
  id: number,
): Promise<Project | null> {
  return client.project.findFirst({ where: { id, deletedAt: null } });
}

export function findAnyById(
  client: DbClient,
  id: number,
): Promise<Project | null> {
  return client.project.findUnique({ where: { id } });
}

export function findByKey(
  client: DbClient,
  key: string,
): Promise<Project | null> {
  return client.project.findUnique({ where: { key } });
}

export function create(
  client: DbClient,
  input: CreateProjectInput,
): Promise<Project> {
  return client.project.create({
    data: {
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
  input: UpdateProjectInput,
): Promise<Project> {
  return client.project.update({
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
): Promise<Project> {
  return client.project.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy },
  });
}

export function restore(
  client: DbClient,
  id: number,
  updatedBy: number,
): Promise<Project> {
  return client.project.update({
    where: { id },
    data: { deletedAt: null, updatedBy },
  });
}
