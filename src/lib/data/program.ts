import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DayWithExercises } from "@/lib/types";

export async function getProgramData(): Promise<{ days: DayWithExercises[]; programId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: program } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!program) return null;

  const { data: days } = await supabase
    .from("program_days")
    .select("*")
    .eq("program_id", program.id)
    .order("day_order");

  if (!days) return null;

  const dayIds = days.map((d) => d.id);
  const { data: pes } = await supabase
    .from("program_exercises")
    .select("*, exercise:exercises(*)")
    .in("program_day_id", dayIds)
    .order("order_index");

  const byDay = new Map<string, typeof pes>();
  for (const pe of pes ?? []) {
    const arr = byDay.get(pe.program_day_id) ?? [];
    arr.push(pe);
    byDay.set(pe.program_day_id, arr);
  }

  return {
    programId: program.id,
    days: days.map((d) => ({
      ...d,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      exercises: (byDay.get(d.id) ?? []) as any,
    })),
  };
}
