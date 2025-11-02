# CampusFind

## Quick Start
```bash
git pull
pnpm i
pnpm dev
```

## Prerequisites
- Node.js 18+ and pnpm installed

## Environment
Set the following in your `.env.local` (values from Supabase project):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Scripts
- `pnpm dev`: Start the dev server
- `pnpm build`: Build for production
- `pnpm start`: Run the production build
- `pnpm lint`: Lint the code

### Notes 
- Currently, in-app notifications only work with database events(INSERT, UPDATE, DELETE) directed to a specific user (as intended).
- A future update will have a new feature to implement listening for specific listings that match what the user is looking for, allowing
for more automated notification triggers.
