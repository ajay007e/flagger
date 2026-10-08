"use client";

import { useEffect, useState } from "react";

import { useApiQuery } from "@/shared/hooks";
import { getErrorMessage } from "@/shared/lib";

import { userAccessService } from "./user-access.service";
import type { AccessOption } from "./user-access.types";

export function useAccessOptions() {
  const available = useApiQuery(userAccessService.available);
  const roles = useApiQuery(userAccessService.roles);

  return {
    projects: available.data?.projects ?? [],
    environments: available.data?.environments ?? [],
    roles: roles.data ?? [],
    loading:
      (available.loading && !available.data) || (roles.loading && !roles.data),
    error: available.error ?? roles.error,
    refetch: () => {
      void available.refetch();
      void roles.refetch();
    },
  };
}

export function useProjectEntities(projectId: number | null) {
  const [items, setItems] = useState<AccessOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId === null) {
      setItems([]);
      setError(null);
      setLoading(false);

      return undefined;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    userAccessService
      .entities(projectId)
      .then(({ data: body }) => {
        if (cancelled) return;

        if (!body.success) {
          setItems([]);
          setError(body.message);
        } else {
          setItems(body.data.items);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        setItems([]);
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { items, loading, error };
}
