# CampusFind

A Next.js + Supabase app for finding and claiming lost-and-found items on campus.

## Live Resources
- ### PRODUCTION: https://campus-find-three.vercel.app/

---

## Prerequisites
- Git
- Node.js 18.18+ (recommended: 22.x LTS)
  - https://nodejs.org/en/download
- pnpm (latest recommended)
  - https://pnpm.io/installation
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

## Install
```bash
git clone https://git.cs.usask.ca/nzy764/cmpt-370-final-project.git
cd cmpt-370-final-project
pnpm install
```

---

## Supabase Backend Setup

CampusFind uses Supabase for authentication, database, storage, and real-time features.

### Option A — Use our existing hosted Supabase project (recommended for graders)

This is the fastest way to run the app exactly like the deployed version.

1. Create a `.env.local` file at the project root (if you haven’t already).
2. Add the following environment variables (Note: we know that this is bad practice, 
but for the sake of this project, it just makes the setup faster.)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://fgitxgfwkdmduybokvis.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnaXR4Z2Z3a2RtZHV5Ym9rdmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjA3MDYsImV4cCI6MjA3NjAzNjcwNn0.5c-1WM4D7bBYVgwErBWVu06BaME_rEknHpJLjpUgA20
```

3. Start the app with `pnpm dev` (development) or `pnpm start` (after `pnpm build`). No additional Supabase setup or migrations are required for this option.

### Option B — Use your own hosted Supabase project

1. Create a Supabase account if you don't have one yet.
2. Create a new Supabase project.
3. Create a `.env.local` file at the project root (if you haven’t already).
4. Add the following environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key 
```

5. Push the database migrations to your new project to setup the database schema.

```bash
# Link to our project for the first time
pnpm supabase link --project-ref <your_project_id>

# Push migrations
pnpm supabase db push
```

6. Start the app with `pnpm dev` (development) or `pnpm start` (after `pnpm build`). No additional Supabase setup or migrations are required for this option.

### Option C — Run Supabase locally for local development

You can run Supabase locally to apply the provided migrations in `supabase/migrations/` if you want a fully local setup.

```bash
# start local Supabase (Docker required)
pnpm supabase start

# reset and apply all migrations to local database
pnpm supabase db reset --local
```
Then update `.env.local` with your local Supabase URL and anon key (printed by `supabase start`) to develop fully offline.

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

## Using CampusFind

- **Sign in**: Click "Login" and sign in with your USask email (via Supabase auth).
- **Browse items**: Go to the Dashboard to see recent lost-and-found posts and filter/search by keyword, category, or location.
- **Report a lost/found item**: From the Dashboard, create a new post, add a title, description, category, location, and photos.
- **Claim or return an item**: Open a listing and use the built-in messaging page to coordinate with the other student without sharing personal contact info.

---

## Scripts
- `pnpm dev` — Start the dev server (Next.js + Turbopack)
- `pnpm build` — Build for production
- `pnpm start` — Run the production build
- `pnpm lint` — Lint the codebase

---

## Tech Stack
- Next.js (App Router, 15.5.7)
- React 19
- Supabase (auth, Postgres, storage, real-time)
- Tailwind CSS 4
- Radix UI primitives
- TypeScript 5
- ESLint 9

For the full list of dependencies and exact versions, see `package.json` and `pnpm-lock.yaml`.

---

## Troubleshooting
- If the dev server fails to start, ensure Node 18.18+ (preferably 22.x), reinstall deps (`pnpm install`), and clear `.next/`.
- If Supabase auth behaves unexpectedly in SSR, ensure environment variables are correct and see `lib/supabase/` for the SSR pattern used.
