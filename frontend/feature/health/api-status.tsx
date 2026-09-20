import { apiFetch } from "@/shared/lib/api";

type HealthResponse = {
  status: string;
  uptime: number;
  timestamp: string;
};

export async function ApiStatus() {
  try {
    const data = await apiFetch<HealthResponse>("/api/health");

    return (
      <p>
        API status:{" "}
        <span className="font-medium text-green-600">{data.status}</span>
      </p>
    );
  } catch {
    return <p className="font-medium text-red-600">API is unreachable</p>;
  }
}
