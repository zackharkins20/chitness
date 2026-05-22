// Hand-written types matching supabase/migrations/0001_init.sql.
// To regenerate from Supabase later: `supabase gen types typescript`.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; created_at: string };
        Insert: { id: string; display_name?: string | null };
        Update: { display_name?: string | null };
      };
      programs: {
        Row: { id: string; user_id: string; name: string; is_active: boolean; created_at: string };
        Insert: { user_id: string; name: string; is_active?: boolean };
        Update: { name?: string; is_active?: boolean };
      };
      program_days: {
        Row: { id: string; program_id: string; day_order: number; name: string; created_at: string };
        Insert: { program_id: string; day_order: number; name: string };
        Update: { name?: string; day_order?: number };
      };
      exercises: {
        Row: { id: string; user_id: string; name: string; notes: string | null; video_url: string | null; created_at: string };
        Insert: { user_id: string; name: string; notes?: string | null; video_url?: string | null };
        Update: { name?: string; notes?: string | null; video_url?: string | null };
      };
      program_exercises: {
        Row: {
          id: string;
          program_day_id: string;
          exercise_id: string;
          slot_label: string;
          order_index: number;
          superset_group: string | null;
          target_sets: number;
          target_reps_low: number | null;
          target_reps_high: number | null;
          target_time_sec: number | null;
          target_rpe: number | null;
          show_intensity: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          program_day_id: string;
          exercise_id: string;
          slot_label: string;
          order_index: number;
          superset_group?: string | null;
          target_sets: number;
          target_reps_low?: number | null;
          target_reps_high?: number | null;
          target_time_sec?: number | null;
          target_rpe?: number | null;
          show_intensity?: boolean;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["program_exercises"]["Insert"]>;
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          program_day_id: string;
          started_at: string;
          finished_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: { user_id: string; program_day_id: string; started_at?: string; finished_at?: string | null; notes?: string | null };
        Update: { finished_at?: string | null; notes?: string | null };
      };
      set_logs: {
        Row: {
          id: string;
          workout_id: string;
          program_exercise_id: string;
          user_id: string;
          set_index: number;
          load: number | null;
          reps: number | null;
          time_sec: number | null;
          rpe: number | null;
          intensity: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          workout_id: string;
          program_exercise_id: string;
          user_id: string;
          set_index: number;
          load?: number | null;
          reps?: number | null;
          time_sec?: number | null;
          rpe?: number | null;
          intensity?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["set_logs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      seed_default_program: {
        Args: { p_user_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// View-model types used across the UI

export type ProgramDay = Database["public"]["Tables"]["program_days"]["Row"];
export type ProgramExercise = Database["public"]["Tables"]["program_exercises"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type Workout = Database["public"]["Tables"]["workouts"]["Row"];
export type SetLog = Database["public"]["Tables"]["set_logs"]["Row"];

export type ExerciseSlot = ProgramExercise & {
  exercise: Exercise;
};

export type DayWithExercises = ProgramDay & {
  exercises: ExerciseSlot[];
};
