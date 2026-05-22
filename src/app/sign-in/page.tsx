"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold tracking-tight">Chitness</h1>
        <p className="text-fg-muted mt-1 mb-8">Sign in with a magic link.</p>

        {status === "sent" ? (
          <div className="rounded-xl bg-bg-card border border-border p-4">
            <p className="font-medium">Check your email</p>
            <p className="text-sm text-fg-muted mt-1">
              We sent a sign-in link to <strong>{email}</strong>. Tap it on this phone to finish signing in.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-bg-card border border-border px-4 h-14 text-lg focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-accent text-white h-14 font-semibold text-lg disabled:opacity-50 active:bg-accent-hover"
            >
              {status === "loading" ? "Sending..." : "Send magic link"}
            </button>
            {error && <p className="text-danger text-sm">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
