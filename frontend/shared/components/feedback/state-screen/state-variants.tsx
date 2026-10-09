import { AlertTriangle, SearchX, ShieldOff } from "lucide-react";
import type { ReactNode } from "react";

import { ERROR_CODES } from "@/shared/constants";
import type { ErrorCode } from "@/shared/types";

import { StateScreen } from "./state-screen";

interface VariantProps {
  action?: ReactNode;
}

export function NoAccessState({ action }: VariantProps) {
  return (
    <StateScreen
      icon={ShieldOff}
      title="No access"
      description="You do not have permission to do this. Ask an admin if you think you should."
      action={action}
    />
  );
}

export function NotFoundState({ action }: VariantProps) {
  return (
    <StateScreen
      icon={SearchX}
      title="Not found"
      description="This page does not exist, or you do not have access to it."
      action={action}
    />
  );
}

export function ErrorState({ action }: VariantProps) {
  return (
    <StateScreen
      icon={AlertTriangle}
      title="Something went wrong"
      description="An unexpected error occurred. Try again, and contact an admin if it keeps happening."
      action={action}
    />
  );
}

export function ApiErrorScreen({
  code,
  action,
}: {
  code?: ErrorCode;
  action?: ReactNode;
}) {
  if (code === ERROR_CODES.FORBIDDEN) return <NoAccessState action={action} />;
  if (code === ERROR_CODES.NOT_FOUND) return <NotFoundState action={action} />;

  return null;
}
