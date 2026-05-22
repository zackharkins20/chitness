-- Function that seeds the default 3-day program for a user.
-- Called from the app on first sign-in (idempotent: skips if user already has an active program).
--
-- Source: parsed from her actual program screenshots, ordered by phone-call timer.
--   Day 1 (6:47/6:54) — Lower + upper finishers, B1/B2 superset
--   Day 2 (7:08/7:14) — Posterior chain + pull
--   Day 3 (7:31/7:37) — Core + glutes + push/pull, A1/A2 superset

create or replace function seed_default_program(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
  v_d1 uuid;
  v_d2 uuid;
  v_d3 uuid;
begin
  -- Idempotent: if user already has any active program, return it
  select id into v_program_id from programs where user_id = p_user_id and is_active limit 1;
  if v_program_id is not null then
    return v_program_id;
  end if;

  -- Program + days
  insert into programs (user_id, name) values (p_user_id, 'Strength — 3 Day') returning id into v_program_id;
  insert into program_days (program_id, day_order, name) values (v_program_id, 1, 'Day 1 — Lower') returning id into v_d1;
  insert into program_days (program_id, day_order, name) values (v_program_id, 2, 'Day 2 — Posterior Pull') returning id into v_d2;
  insert into program_days (program_id, day_order, name) values (v_program_id, 3, 'Day 3 — Core & Glutes') returning id into v_d3;

  -- Exercise library (skip duplicates per-user)
  insert into exercises (user_id, name)
  values
    (p_user_id, 'Hamstring Bridge March'),
    (p_user_id, 'Machine Hip Abduction'),
    (p_user_id, 'Machine Adductor Press'),
    (p_user_id, '2DB Step Up'),
    (p_user_id, 'DB Sumo Squat'),
    (p_user_id, 'Bench'),
    (p_user_id, 'Wide Grip Lat Pulldown'),
    (p_user_id, 'Overhead Cable Tricep Extension'),
    (p_user_id, 'Plank w/ Brace'),
    (p_user_id, 'Machine Hip Thrust'),
    (p_user_id, 'BB RDL'),
    (p_user_id, '1 Arm DB Row'),
    (p_user_id, 'Rope Cable Curl'),
    (p_user_id, '1DB Side Bend'),
    (p_user_id, 'Seated Cable Chop'),
    (p_user_id, 'Cable Glute Kickback'),
    (p_user_id, 'Smith Machine Reverse Lunge'),
    (p_user_id, 'Seated DB Overhead Press'),
    (p_user_id, 'Chest Supported DB Row'),
    (p_user_id, 'Straight Bar Cable Curl')
  on conflict do nothing;

  -- Helper macro via CTE: insert program_exercises by looking up exercise_id by name
  -- Day 1
  insert into program_exercises (program_day_id, exercise_id, slot_label, order_index, superset_group, target_sets, target_reps_low, target_reps_high, target_rpe, show_intensity)
  select v_d1, e.id, v.slot_label, v.order_index, v.superset_group, v.sets, v.reps_low, v.reps_high, v.rpe, v.intensity
  from (values
    ('Hamstring Bridge March',           'A',  1, null,  3, 6, 10, 8.0, false),
    ('Machine Hip Abduction',            'B1', 2, 'B',   3, 6,  8, 9.0, false),
    ('Machine Adductor Press',           'B2', 3, 'B',   3, 6,  8, 7.0, false),
    ('2DB Step Up',                      'C',  4, null,  3, 6,  8, 9.0, false),
    ('DB Sumo Squat',                    'D',  5, null,  3, 6,  8, 9.0, false),
    ('Bench',                            'E',  6, null,  2, 8, 10, 7.0, true),
    ('Wide Grip Lat Pulldown',           'F',  7, null,  2, 8, 10, 7.0, false),
    ('Overhead Cable Tricep Extension',  'G',  8, null,  2, 8, 10, 7.0, false)
  ) as v(name, slot_label, order_index, superset_group, sets, reps_low, reps_high, rpe, intensity)
  join exercises e on e.name = v.name and e.user_id = p_user_id;

  -- Day 2
  -- Plank uses target_time_sec instead of reps
  insert into program_exercises (program_day_id, exercise_id, slot_label, order_index, superset_group, target_sets, target_time_sec, target_reps_low, target_reps_high, target_rpe)
  select v_d2, e.id, v.slot_label, v.order_index, v.superset_group, v.sets, v.time_sec, v.reps_low, v.reps_high, v.rpe
  from (values
    ('Plank w/ Brace',                   'A', 1, null,  2,   30::smallint, null::smallint, null::smallint, null::numeric),
    ('Machine Hip Abduction',            'B', 2, null,  3,   null,         6::smallint,    8::smallint,    8.0),
    ('Machine Hip Thrust',               'C', 3, null,  3,   null,         6,              8,              8.0),
    ('BB RDL',                           'D', 4, null,  3,   null,         6,              8,              8.0),
    ('1 Arm DB Row',                     'E', 5, null,  2,   null,         8,             10,              7.0),
    ('Rope Cable Curl',                  'F', 6, null,  2,   null,         8,             10,              7.0),
    ('Overhead Cable Tricep Extension',  'G', 7, null,  2,   null,         8,             10,              7.0)
  ) as v(name, slot_label, order_index, superset_group, sets, time_sec, reps_low, reps_high, rpe)
  join exercises e on e.name = v.name and e.user_id = p_user_id;

  -- Day 3
  insert into program_exercises (program_day_id, exercise_id, slot_label, order_index, superset_group, target_sets, target_reps_low, target_reps_high, target_rpe)
  select v_d3, e.id, v.slot_label, v.order_index, v.superset_group, v.sets, v.reps_low, v.reps_high, v.rpe
  from (values
    ('1DB Side Bend',                    'A1', 1, 'A',   3, 6, 10, 8.0),
    ('Seated Cable Chop',                'A2', 2, 'A',   3, 6,  8, 8.0),
    ('Machine Hip Thrust',               'B',  3, null,  3, 6,  8, 9.0),
    ('Cable Glute Kickback',             'C',  4, null,  3, 6,  8, 9.0),
    ('Smith Machine Reverse Lunge',      'D',  5, null,  3, 6,  8, 9.0),
    ('Seated DB Overhead Press',         'E',  6, null,  2, 8, 10, 7.0),
    ('Chest Supported DB Row',           'F',  7, null,  2, 8, 10, 7.0),
    ('Straight Bar Cable Curl',          'G',  8, null,  2, 8, 10, 7.0)
  ) as v(name, slot_label, order_index, superset_group, sets, reps_low, reps_high, rpe)
  join exercises e on e.name = v.name and e.user_id = p_user_id;

  return v_program_id;
end;
$$;

grant execute on function seed_default_program(uuid) to authenticated;
