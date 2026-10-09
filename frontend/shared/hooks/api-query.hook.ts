"use client";

import type { AxiosResponse } from "axios";
import { useCallback, useEffect, useState } from "react";

import { getErrorCode, getErrorMessage } from "@/shared/lib";

import type { ApiResponse, ErrorCode } from "../types";

export function useApiQuery<T>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | undefined>();

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorCode(undefined);

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
      setErrorCode(getErrorCode(err));
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void execute();
  }, [execute]);

  return { data, loading, error, errorCode, refetch: execute };
}
