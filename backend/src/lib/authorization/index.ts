export {
  canSee,
  decide,
  hasPermission,
  resolveEntityScope,
  resolveScope,
  type AccessDecision,
  type AccessUser,
} from "./access";
export { authorize } from "./middleware";
export { isAllowed } from "./resolver";
export {
  adminOnly,
  adminOnlyHidden,
  adminOnlyOn,
  requires,
  scoped,
} from "./rules";
export {
  entityScopeIds,
  isVisible,
  scopeIds,
  scopeWhere,
  toIdFilter,
  type IdScope,
  type ScopeClause,
  type ScopeWhere,
} from "./scope";
export { secureRouter } from "./secure-router";
export type { AccessGrant, AccessRule, AccessTarget } from "./types";
