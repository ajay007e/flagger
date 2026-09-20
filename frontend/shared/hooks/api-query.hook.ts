"use client";

import type { AxiosResponse } from "axios";
import { useCallback, useEffect, useState } from "react";

import { getErrorMessage } from "@/shared/lib";

import type { ApiResponse } from "../types";

/**
 * Runs a service call on mount and exposes { data, loading, error, refetch }.
 *
 * `request` must be a stable reference (a service method or a function
 * defined outside the component), otherwise it will refetch on every render.
 */
export function useApiQuery<T>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: body } = await request();

      if (!body.success) {
        setData(null);
        setError(body.message);
      } else {
        setData("data" in body ? body.data : null);
      }
    } catch (err) {
      setData(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
