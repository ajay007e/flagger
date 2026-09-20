"use client";

import { useHealth } from "./health.hook";

export function ApiStatus() {
  const { data, loading, error } = useHealth();

  if (loading) {
    return <p className="text-muted">Checking API...</p>;
  }

  if (error) {
    return <p className="font-medium text-danger">{error}</p>;
  }

  return (
    <p>
      API status:{" "}
      <span className="font-medium text-success">{data?.status}</span>
    </p>
  );
}
