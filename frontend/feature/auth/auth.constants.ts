/** Where a user lands right after logging in, and where a non-admin is sent
 * back to if they try to open an area that isn't theirs. */
export const DEFAULT_ROUTE_BY_TYPE: Record<string, string> = {
  admin: "/admin",
};

export const DEFAULT_ROUTE = "/";

export function getDefaultRoute(type: string): string {
  return DEFAULT_ROUTE_BY_TYPE[type] ?? DEFAULT_ROUTE;
}
