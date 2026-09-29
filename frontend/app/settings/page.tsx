import { ApiStatus } from "@/feature/health";
import { ThemeSwitcher } from "@/shared/theme";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
        <div>
          <h2 className="text-sm font-semibold">Theme</h2>
          <p className="text-sm text-muted">Switch between light and dark.</p>
        </div>
        <ThemeSwitcher />
      </section>

      <section className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
        <div>
          <h2 className="text-sm font-semibold">API status</h2>
          <p className="text-sm text-muted">Connectivity to the backend.</p>
        </div>
        <ApiStatus />
      </section>
    </main>
  );
}
