"use client";

import { useRouter } from "next/navigation";

import { getDefaultRoute } from "@/feature/auth";
import { Button, NotFoundState } from "@/shared/components";
import { useAuth } from "@/shared/lib/auth";

export default function NotFound() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <NotFoundState
      action={
        <Button
          onClick={() => router.push(user ? getDefaultRoute(user.type) : "/")}
        >
          Go home
        </Button>
      }
    />
  );
}
