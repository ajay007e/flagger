/**
 * The current user's safe fields, attached to res.locals by requireAuth and
 * read back via getCurrentUser(res). Never includes the password hash.
 */
export interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: string;
  mustChangePassword: boolean;
}
