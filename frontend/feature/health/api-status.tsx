import { api } from "@/shared/lib/api";

type HealthResponse = {
  status: string;
  uptime: number;
  timestamp: string;
};

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
