import { prisma } from "@/config/db";
import { resolveScope, toIdFilter, type AccessUser } from "@/lib/authorization";
import { environmentRepository } from "@/repositories/environment";
import { projectRepository } from "@/repositories/project";

import type { AvailableAccess } from "./access.types";

export async function getAvailableAccess(
  user: AccessUser,
): Promise<AvailableAccess> {
  const [projectScope, environmentScope] = await Promise.all([
    resolveScope(user, "flag:read", "projectId"),
    resolveScope(user, "flag:read", "environmentId"),
  ]);

  const [projects, environments] = await Promise.all([
    projectRepository.findVisible(prisma, toIdFilter(projectScope)),
    environmentRepository.findAll(prisma, {
      includeDeleted: false,
      ids: toIdFilter(environmentScope),
    }),
  ]);

  return {
    projects: projects.map(({ id, key, name }) => ({ id, key, name })),
    environments: environments.map(({ id, key, name }) => ({ id, key, name })),
  };
}
