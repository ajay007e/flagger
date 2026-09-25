export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: string;
  mustChangePassword: boolean;
}

export interface AuthState {
  status: AuthStatus;
  user: SessionUser | null;
}
