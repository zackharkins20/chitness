"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SettingsClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    if (!confirm("Sign out?")) return;
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/sign-in");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="w-full h-12 rounded-2xl bg-bg-card border border-border text-danger font-semibold flex items-center justify-center gap-2 active:bg-bg-elevated disabled:opacity-60"
    >
      <LogOut className="size-4" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
