import type { UserAccess } from "@/repositories/user-access";

import type { UserAccessAssignment } from "./user-access.types";

export function groupByAssignment(rows: UserAccess[]): UserAccessAssignment[] {
  const groups = new Map<string, UserAccessAssignment>();

  for (const row of rows) {
    let group = groups.get(row.assignmentId);

    if (!group) {
      group = {
        assignmentId: row.assignmentId,
        roleId: row.roleId,
        projectId: row.projectId,
        entityIds: [],
        environmentIds: [],
      };
      groups.set(row.assignmentId, group);
    }

    if (row.entityId !== null && !group.entityIds.includes(row.entityId)) {
      group.entityIds.push(row.entityId);
    }

    if (
      row.environmentId !== null &&
      !group.environmentIds.includes(row.environmentId)
    ) {
      group.environmentIds.push(row.environmentId);
    }
  }

  return [...groups.values()];
}
