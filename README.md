# CampusFind

A Next.js + Supabase app for finding and claiming lost-and-found items on campus.

## Live Resources
- PRODUCTION: https://campus-find-three.vercel.app/
- Presentation: https://docs.google.com/presentation/d/1MdBNZC3A6L-B2VWjRbE2f90GAi3fChZ1YET77xTsxXw/edit?usp=sharing

---

## Prerequisites
- Node.js 18.18+ (recommended: 22.x LTS)
  - https://nodejs.org/en/download
- pnpm (latest recommended)
  - https://pnpm.io/installation
- Git
- Supabase account (for a hosted project) and/or Supabase CLI for local development
  - Supabase CLI: ^2.53.6
    - https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=npm&queryGroups=access-method&access-method=analytics

Check your versions:
```bash
node -v
pnpm -v
supabase --version
```

If you use `nvm`, select a compatible Node:
```bash
nvm use 22 || nvm install 22
```

---

## Environment Variables
Create a `.env.local` at the project root with your Supabase project values:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key
```
---

## Install
```bash
git clone https://git.cs.usask.ca/nzy764/cmpt-370-final-project.git
cd campus-find
pnpm install
```

---

## Run (Development)
Starts Next.js with Turbopack for fast HMR:
```bash
pnpm dev
```
Visit http://localhost:3000

---

## Build and Run (Production)
```bash
pnpm build
pnpm start
```
By default, the app starts on port 3000.

---

## Supabase Backend Setup

CampusFind uses Supabase for authentication, database, storage, and real-time features.

### Option A — Use the hosted Supabase project (recommended for graders)

This is the fastest way to run the app exactly like the deployed version.

1. Create a `.env.local` file at the project root (if you haven’t already).
2. Add the following environment variables (Note: we know that this is bad practice, 
but for the sake of this project, it just makes the setup faster.)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://fgitxgfwkdmduybokvis.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnaXR4Z2Z3a2RtZHV5Ym9rdmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjA3MDYsImV4cCI6MjA3NjAzNjcwNn0.5c-1WM4D7bBYVgwErBWVu06BaME_rEknHpJLjpUgA20
```

3. Start the app with `pnpm dev` (development) or `pnpm start` (after `pnpm build`). No additional Supabase setup or migrations are required for this option.

### Option B — Run Supabase locally (for local DB + Auth)

You can run Supabase locally to apply the provided migrations in `supabase/migrations/` if you want a fully local setup.

```bash
# start local Supabase (Docker required)
pnpm supabase start

# reset and apply all migrations to local database
pnpm supabase db reset --local
```
Then update `.env.local` with your local Supabase URL and anon key (printed by `supabase start`) to develop fully offline.

---

## Scripts
- `pnpm dev` — Start the dev server (Next.js + Turbopack)
- `pnpm build` — Build for production
- `pnpm start` — Run the production build
- `pnpm lint` — Lint the codebase

---

## Tech Stack
- Next.js (App Router, latest)
- React 19
- Supabase (auth, Postgres, storage, real-time)
- Tailwind CSS 4
- Radix UI primitives
- TypeScript 5
- ESLint 9

---

## Troubleshooting
- If the dev server fails to start, ensure Node 18.18+ (preferably 22.x), reinstall deps (`pnpm install`), and clear `.next/`.
- If Supabase auth behaves unexpectedly in SSR, ensure environment variables are correct and see `lib/supabase/` for the SSR pattern used.
