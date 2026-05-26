import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex-1 flex flex-col gap-4 px-4 pt-safe pb-4 max-w-md w-full mx-auto">
      <header className="flex items-center gap-2 pt-3 pb-1">
        <Link
          href="/today"
          aria-label="Back"
          className="size-9 -ml-2 rounded-full flex items-center justify-center text-fg-muted active:bg-bg-elevated"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </header>

      <section className="rounded-2xl bg-bg-card border border-border overflow-hidden">
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-fg-dim font-semibold mb-1">Account</div>
          <div className="text-sm font-medium truncate">{user?.email ?? "—"}</div>
        </div>
      </section>

      <SettingsClient />

      <p className="text-xs text-fg-dim text-center mt-2">
        Chitness · v0.1.0
      </p>
    </main>
  );
}
