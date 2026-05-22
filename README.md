# Chitness

A personal fitness PWA for following a 3-day strength program. Modeled after Hevy/Strong — exercise cards, tap-to-complete sets, inline rest timer, swipe-to-finish workout, per-exercise progress charts.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind v4** for styling
- **Supabase** for Postgres + Auth (magic link)
- **motion** (formerly framer-motion) for gestures
- **recharts** for progress charts
- Deployed as a **PWA** on **Vercel**

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev
```

Then run the schema migration in your Supabase project's SQL editor:
```
supabase/migrations/0001_init.sql
supabase/seed.sql
```

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    (auth)/             # sign-in flow
    (app)/              # authed app shell
      today/            # today's workout
      history/          # calendar + charts
      program/          # edit program
  components/           # UI primitives + feature components
  lib/
    supabase/           # browser + server clients
    types.ts            # shared types
supabase/
  migrations/           # SQL schema
  seed.sql              # her program
```

## Deployment

Vercel auto-deploys on push to `main`. Set the three `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` env vars in Vercel project settings.
