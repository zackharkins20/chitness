import { getProgramData } from "@/lib/data/program";
import { ProgramEditor } from "@/components/program/ProgramEditor";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const data = await getProgramData();
  if (!data) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="text-fg-muted">No program yet.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col gap-4 px-4 pt-safe pb-4 max-w-md w-full mx-auto">
      <header className="pt-3 pb-1">
        <h1 className="text-2xl font-bold tracking-tight">Program</h1>
        <p className="text-sm text-fg-muted">Tap any exercise to edit.</p>
      </header>
      <ProgramEditor days={data.days} />
    </main>
  );
}
