import { getErrorMessage } from "@/shared/lib";

import { userAccessService } from "./user-access.service";
import type {
  AccessAssignment,
  AccessCardErrors,
  AccessChange,
  AccessDraft,
  AccessInput,
  AccessOption,
  RoleOption,
  UpdateAccessInput,
  ValidAccessCard,
} from "./user-access.types";
import { accessCardSchema } from "./user-access.validator";

let draftCounter = 0;

export function createDraft(overrides: Partial<AccessDraft> = {}): AccessDraft {
  draftCounter += 1;

  return {
    key: `new-${draftCounter}`,
    assignmentId: null,
    roleId: null,
    projectId: null,
    entityIds: [],
    environmentIds: [],
    ...overrides,
  };
}

export function toDraft(assignment: AccessAssignment): AccessDraft {
  return {
    key: assignment.assignmentId,
    assignmentId: assignment.assignmentId,
    roleId: assignment.roleId,
    projectId: assignment.projectId,
    entityIds: assignment.entityIds,
    environmentIds: assignment.environmentIds,
  };
}

export function validateCard(
  card: AccessDraft,
): { input: AccessInput } | { errors: AccessCardErrors } {
  const result = accessCardSchema.safeParse(card);

  if (result.success) {
    return { input: result.data };
  }

  const errors: AccessCardErrors = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0];

    if (
      field === "roleId" ||
      field === "projectId" ||
      field === "entityIds" ||
      field === "environmentIds"
    ) {
      errors[field] ??= issue.message;
    }
  }

  return { errors };
}

export function validateCards(cards: AccessDraft[]): {
  valid: boolean;
  errors: Record<string, AccessCardErrors>;
  items: ValidAccessCard[];
} {
  const errors: Record<string, AccessCardErrors> = {};
  const items: ValidAccessCard[] = [];

  for (const card of cards) {
    const result = validateCard(card);

    if ("errors" in result) {
      errors[card.key] = result.errors;
    } else {
      items.push({ assignmentId: card.assignmentId, input: result.input });
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, items };
}

function sameIds(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

export function planAccessChanges(
  original: AccessAssignment[],
  items: ValidAccessCard[],
): AccessChange[] {
  const revokes: AccessChange[] = [];
  const updates: AccessChange[] = [];
  const assigns: AccessChange[] = [];
  const handled = new Set<string>();

  for (const { assignmentId, input } of items) {
    const previous = original.find(
      (assignment) => assignment.assignmentId === assignmentId,
    );

    if (!previous) {
      assigns.push({ kind: "assign", input });
      continue;
    }

    handled.add(previous.assignmentId);

    if (previous.projectId !== input.projectId) {
      revokes.push({ kind: "revoke", assignmentId: previous.assignmentId });
      assigns.push({ kind: "assign", input });
      continue;
    }

    const patch: UpdateAccessInput = {};

    if (previous.roleId !== input.roleId) {
      patch.roleId = input.roleId;
    }

    if (!sameIds(previous.entityIds, input.entityIds)) {
      patch.entityIds = input.entityIds;
    }

    if (!sameIds(previous.environmentIds, input.environmentIds)) {
      patch.environmentIds = input.environmentIds;
    }

    if (Object.keys(patch).length > 0) {
      updates.push({
        kind: "update",
        assignmentId: previous.assignmentId,
        input: patch,
      });
    }
  }

  for (const assignment of original) {
    if (!handled.has(assignment.assignmentId)) {
      revokes.push({ kind: "revoke", assignmentId: assignment.assignmentId });
    }
  }

  return [...revokes, ...updates, ...assigns];
}

export async function applyAccessChanges(
  userId: number,
  changes: AccessChange[],
): Promise<string[]> {
  const failures: string[] = [];

  for (const change of changes) {
    try {
      if (change.kind === "revoke") {
        await userAccessService.revoke(userId, change.assignmentId);
      } else if (change.kind === "update") {
        await userAccessService.update(
          userId,
          change.assignmentId,
          change.input,
        );
      } else {
        await userAccessService.assign(userId, change.input);
      }
    } catch (error) {
      failures.push(getErrorMessage(error));
    }
  }

  return failures;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) {
    return names[0] ?? "";
  }

  const last = names[names.length - 1];

  return `${names.slice(0, -1).join(", ")} and ${last ?? ""}`;
}

export function buildAccessSummary(
  card: AccessDraft,
  lookup: {
    roles: readonly RoleOption[];
    projects: readonly AccessOption[];
    entities: readonly AccessOption[];
    environments: readonly AccessOption[];
  },
): string {
  const role = lookup.roles.find((item) => item.id === card.roleId);

  if (!role) {
    return "Choose a role to see a summary.";
  }

  let scope = "all projects";

  if (card.projectId !== null) {
    const project =
      lookup.projects.find((item) => item.id === card.projectId)?.name ??
      "Unknown project";
    const entities =
      card.entityIds.length === 0
        ? "all entities"
        : joinNames(
            card.entityIds.map(
              (id) =>
                lookup.entities.find((item) => item.id === id)?.name ??
                `#${id}`,
            ),
          );

    scope = `${project} / ${entities}`;
  }

  const environments =
    card.environmentIds.length === 0
      ? "all environments"
      : joinNames(
          card.environmentIds.map(
            (id) =>
              lookup.environments.find((item) => item.id === id)?.name ??
              `#${id}`,
          ),
        );

  return `${role.name} on ${scope} in ${environments}`;
}
