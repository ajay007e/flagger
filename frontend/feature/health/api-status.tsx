import { api } from "@/shared/lib";

import type { HealthResponse } from "./types";

export async function ApiStatus() {
  try {
    const { data } = await api.get<HealthResponse>("/api/health");

    return (
      <p>
        API status:{" "}
        <span className="font-medium text-success">{data.status}</span>
      </p>
    );
  } catch {
    return <p className="font-medium text-danger">API is unreachable</p>;
  }
}
