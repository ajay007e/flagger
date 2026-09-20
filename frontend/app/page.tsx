import { ApiStatus } from "@/feature/health/api-status";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-4xl font-bold">Flagger</h1>
      <p className="text-gray-600">A lightweight feature flag service.</p>
      <ApiStatus />
    </main>
  );
}
