import { ApiStatus } from "@/feature/health/api-status";
import { ThemeSwitcher } from "@/shared/theme/theme.switcher";

// Render on every request so the API status is always live
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-semibold">Flagger</span>
        <ThemeSwitcher />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-4xl font-bold">Flagger</h1>
        <p className="text-muted">A lightweight feature flag service.</p>

        <div className="rounded-lg border border-border bg-surface px-4 py-3">
          <ApiStatus />
        </div>
      </main>
    </div>
  );
}
