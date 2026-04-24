# Archive

This directory contains files that are no longer in active use but are kept
for historical reference.

## `.gitlab-ci.yml`

The original GitLab CI pipeline used while the primary remote was
`git.cs.usask.ca`. The project has since migrated its primary codebase to
GitHub, where:

- Production deploys are handled automatically by Vercel's native GitHub
  integration on every push to `main` (no workflow file needed).
- The Supabase keep-alive job has been ported to a scheduled GitHub
  Actions workflow at `.github/workflows/keep-supabase-alive.yml`.

This file is intentionally left here (rather than deleted) in case we ever
need to push back to the GitLab mirror or reference the original pipeline
configuration.
