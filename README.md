# CampusFind

A Next.js + Supabase app for finding and claiming lost-and-found items on campus.

## Live Resources
- PRODUCTION: https://campus-find-three.vercel.app/
- Presentation: https://docs.google.com/presentation/d/1MdBNZC3A6L-B2VWjRbE2f90GAi3fChZ1YET77xTsxXw/edit?usp=sharing

---

## Prerequisites
- Node.js 18.18+ (recommended: 22.x LTS)
- pnpm (latest recommended)
- Git
- Supabase account (for a hosted project) and/or Supabase CLI for local development
  - Supabase CLI: ^2.53.6

Check your versions:
```bash
node -v
pnpm -v
supabase --version
```

---

## Environment Variables
Create a `.env.local` at the project root with your Supabase project values:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key
```

Notes:
- Never commit secrets. `.env.local` is ignored by default.
- For SSR/auth stability with Supabase, this app creates the client per-request (see `lib/supabase/`).

---

## Install
```bash
git clone <repo-url>
cd campus-find
pnpm install
```

If you use `nvm`, select a compatible Node:
```bash
nvm use 22 || nvm install 22
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

## Optional: Local Supabase (for local DB + Auth)
You can run Supabase locally to apply the provided migrations in `supabase/migrations/`.
```bash
# start local Supabase (Docker required)
supabase start

# reset and apply all migrations to local database
supabase db reset --local
```
Update `.env.local` with your local Supabase URL and anon key (printed by `supabase start`) to develop fully offline.

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

## Dependencies and Versions

These reflect `package.json` at the time of writing.

### Runtime dependencies
- @radix-ui/react-avatar: ^1.1.11  
- @radix-ui/react-checkbox: ^1.3.1  
- @radix-ui/react-dialog: ^1.1.15  
- @radix-ui/react-dropdown-menu: ^2.1.14  
- @radix-ui/react-label: ^2.1.6  
- @radix-ui/react-select: ^2.2.6  
- @radix-ui/react-slot: ^1.2.2  
- @radix-ui/react-tooltip: ^1.2.8  
- @supabase/ssr: latest  
- @supabase/supabase-js: latest  
- class-variance-authority: ^0.7.1  
- clsx: ^2.1.1  
- date-fns: ^4.1.0  
- lucide-react: ^0.545.0  
- next: latest  
- next-themes: ^0.4.6  
- react: ^19.0.0  
- react-dom: ^19.0.0  
- sonner: ^2.0.7  
- tailwind-merge: ^3.3.0  

### Dev dependencies
- @eslint/eslintrc: ^3  
- @tailwindcss/postcss: ^4.1.14  
- @types/node: ^22  
- @types/react: ^19  
- @types/react-dom: ^19  
- eslint: ^9  
- eslint-config-next: 15.5.5  
- postcss: ^8  
- supabase: ^2.53.6  
- tailwindcss: ^4.1.14  
- tailwindcss-animate: ^1.0.7  
- typescript: ^5  

Tip: Consider pinning `next`, `@supabase/ssr`, and `@supabase/supabase-js` to specific versions for production stability.

---

## Troubleshooting
- If the dev server fails to start, ensure Node 18.18+ (preferably 22.x), reinstall deps (`pnpm install`), and clear `.next/`.
- If Supabase auth behaves unexpectedly in SSR, ensure environment variables are correct and see `lib/supabase/` for the SSR pattern used.
