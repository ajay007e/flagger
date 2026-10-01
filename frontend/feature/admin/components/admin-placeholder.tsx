/** Stand-in body for admin screens that don't exist yet (Epics 2, 3 and 5). */
export function AdminPlaceholder({ title }: { title: string }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted">Coming soon.</p>
    </main>
  );
}
