import { createAccessChecker, type AccessUser } from "./access";
import { adminOnly } from "./rules";
import type {
  AccessTarget,
  OverallCapabilities,
  WithCapabilities,
} from "./types";

export const NO_CAPABILITIES: OverallCapabilities = {
  isAdmin: false,
  canManageUsers: false,
  canManageCatalog: false,
  canReadFlags: false,
  canCreateFlags: false,
  canUpdateFlags: false,
  canDeleteFlags: false,
  canApproveFlags: false,
  canReadAudit: false,
};

interface SoftDeletable {
  deletedAt: Date | null;
}

export async function withCatalogCapabilities<T extends SoftDeletable>(
  user: AccessUser,
  items: readonly T[],
  target: (item: T) => AccessTarget,
): Promise<WithCapabilities<T>[]> {
  const checker = createAccessChecker(user);

  return Promise.all(
    items.map(async (item) => {
      const allowed = await checker.can(adminOnly, target(item));
      const deleted = item.deletedAt !== null;

      return {
        ...item,
        capabilities: {
          canUpdate: allowed && !deleted,
          canDelete: allowed && !deleted,
          canRestore: allowed && deleted,
        },
      };
    }),
  );
}

export async function withCatalogCapability<T extends SoftDeletable>(
  user: AccessUser,
  item: T,
  target: AccessTarget,
): Promise<WithCapabilities<T>> {
  const [result] = await withCatalogCapabilities(user, [item], () => target);

  return result;
}
