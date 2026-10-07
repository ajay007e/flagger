export {
  canSee,
  createAccessChecker,
  decide,
  getOverallCapabilities,
  hasPermission,
  resolveEntityScope,
  resolveScope,
  type AccessChecker,
  type AccessDecision,
  type AccessUser,
} from "./access";
export {
  NO_CAPABILITIES,
  withCatalogCapabilities,
  withCatalogCapability,
} from "./capabilities";
export { authorize } from "./middleware";
export { isAllowed, ruleAllows } from "./resolver";
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
export type {
  AccessGrant,
  AccessRule,
  AccessTarget,
  ItemCapabilities,
  OverallCapabilities,
  WithCapabilities,
} from "./types";
