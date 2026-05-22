-- Chitness schema — initial migration
-- Tables: profiles, programs, program_days, exercises, program_exercises, workouts, set_logs
-- All user-scoped data is protected by RLS keyed to auth.uid()

set search_path = public, extensions;

create extension if not exists "uuid-ossp";

------------------------------------------------------------
-- profiles: 1:1 with auth.users
------------------------------------------------------------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

------------------------------------------------------------
-- programs: a named workout program (a user can have multiple)
------------------------------------------------------------
create table if not exists programs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists programs_user_active_idx on programs(user_id, is_active);

------------------------------------------------------------
-- program_days: 1..N days within a program (Day 1 / Day 2 / Day 3)
------------------------------------------------------------
create table if not exists program_days (
  id         uuid primary key default uuid_generate_v4(),
  program_id uuid not null references programs(id) on delete cascade,
  day_order  smallint not null,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (program_id, day_order)
);

------------------------------------------------------------
-- exercises: per-user exercise library
------------------------------------------------------------
create table if not exists exercises (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null,
  notes      text,
  video_url  text,
  created_at timestamptz not null default now()
);
create index if not exists exercises_user_idx on exercises(user_id);

------------------------------------------------------------
-- program_exercises: exercises slotted into a day with target sets/reps/RPE
------------------------------------------------------------
create table if not exists program_exercises (
  id                uuid primary key default uuid_generate_v4(),
  program_day_id    uuid not null references program_days(id) on delete cascade,
  exercise_id       uuid not null references exercises(id) on delete restrict,
  slot_label        text not null,                    -- "A", "B1", "B2", "C"
  order_index       smallint not null,
  superset_group    text,                             -- "B" if B1/B2 share, null otherwise
  target_sets       smallint not null,
  target_reps_low   smallint,
  target_reps_high  smallint,
  target_time_sec   smallint,                         -- for time-based exercises (Plank)
  target_rpe        numeric(3,1),
  show_intensity    boolean not null default false,   -- Bench has this column in her program
  notes             text,
  created_at        timestamptz not null default now()
);
create index if not exists program_exercises_day_idx on program_exercises(program_day_id, order_index);

------------------------------------------------------------
-- workouts: a logged session
------------------------------------------------------------
create table if not exists workouts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  program_day_id  uuid not null references program_days(id) on delete restrict,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists workouts_user_started_idx on workouts(user_id, started_at desc);
create index if not exists workouts_user_finished_idx on workouts(user_id, finished_at desc) where finished_at is not null;

------------------------------------------------------------
-- set_logs: individual sets recorded in a workout
------------------------------------------------------------
create table if not exists set_logs (
  id                   uuid primary key default uuid_generate_v4(),
  workout_id           uuid not null references workouts(id) on delete cascade,
  program_exercise_id  uuid not null references program_exercises(id) on delete cascade,
  user_id              uuid not null references profiles(id) on delete cascade,
  set_index            smallint not null,
  load                 numeric(6,2),                  -- weight; lbs or kg per user preference
  reps                 smallint,
  time_sec             smallint,
  rpe                  numeric(3,1),
  intensity            text,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  unique (workout_id, program_exercise_id, set_index)
);
create index if not exists set_logs_user_exercise_idx on set_logs(user_id, program_exercise_id, completed_at desc);

------------------------------------------------------------
-- RLS
------------------------------------------------------------
alter table profiles           enable row level security;
alter table programs           enable row level security;
alter table program_days       enable row level security;
alter table exercises          enable row level security;
alter table program_exercises  enable row level security;
alter table workouts           enable row level security;
alter table set_logs           enable row level security;

-- profiles: self only
create policy "profiles_self_select" on profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on profiles for update using (auth.uid() = id);

-- programs: self only
create policy "programs_self_all" on programs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- program_days: scoped via program_id
create policy "program_days_self_all" on program_days for all using (
  exists (select 1 from programs p where p.id = program_days.program_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from programs p where p.id = program_days.program_id and p.user_id = auth.uid())
);

-- exercises: self only
create policy "exercises_self_all" on exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- program_exercises: scoped via program_day → program
create policy "program_exercises_self_all" on program_exercises for all using (
  exists (
    select 1 from program_days d
    join programs p on p.id = d.program_id
    where d.id = program_exercises.program_day_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from program_days d
    join programs p on p.id = d.program_id
    where d.id = program_exercises.program_day_id and p.user_id = auth.uid()
  )
);

-- workouts: self only
create policy "workouts_self_all" on workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- set_logs: self only
create policy "set_logs_self_all" on set_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
