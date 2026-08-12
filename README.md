# Self Learning

A personal interview-prep study tool: browse a bank of Q&A imported from a spreadsheet, filter by
topic/subtopic/probability/level/scope, mark questions as "no review needed", and practice with a
random question + AI feedback on your typed answer.

Stack: Next.js (App Router) + Prisma 7 + PostgreSQL, AI feedback via the Anthropic API.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Database

Point `DATABASE_URL` in `.env` at a Postgres instance (see `.env.example`). Locally, either:

- Use a Postgres you already have running, or
- Install Postgres and create a role/db:

```bash
sudo -u postgres psql -c "CREATE ROLE selflearning LOGIN PASSWORD 'selflearning' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE selflearning OWNER selflearning;"
```

Then apply the schema:

```bash
npx prisma migrate dev
```

### 3. Import your questions

Put your spreadsheet at `data/Study.xlsx` (this path is gitignored — it's your personal data).
The importer expects two sheets named `Arch Focused QA` and `Comprehensive list`, each with columns:
`Topic`, `Sub Topic`, `OProb`, `DLevel`, `InfraVsDev`, `Review 1 day Before Interview`, `Scope`,
`Question`, `Answer`.

```bash
npm run db:seed
```

Re-running the seed is safe — it replaces all rows previously imported from each of those two sheets.
To import from a different file path, set `DATA_FILE=/path/to/file.xlsx npm run db:seed`.

### 4. AI feedback (optional but needed for the Practice page)

Set `ANTHROPIC_API_KEY` in `.env` (get one at https://console.anthropic.com/). Without it, the
Practice page's "Submit for feedback" will return a clear error instead of failing silently.

### 5. Run it

```bash
npm run dev
```

Visit http://localhost:3000. Other useful commands:

```bash
npm run db:studio   # Prisma Studio — browse/edit the DB in a GUI
```

## Deploying

Recommended: **Vercel** (for the Next.js app) + **Neon** or **Supabase** (for managed Postgres).
The repo is already set up for this — `npm install` runs `prisma generate` automatically via a
`postinstall` hook, so a fresh Vercel build works without extra config.

1. **Create the database.** On [Neon](https://neon.tech) or [Supabase](https://supabase.com),
   create a Postgres project and copy its connection string.
   - **Neon specifically:** use the **pooled** connection string (the one with `-pooler` in the
     hostname), not the direct one. Vercel functions are serverless — each invocation can open a
     new DB connection, and the pooled endpoint (PgBouncer) is what keeps that from exhausting
     Neon's connection limit. Supabase's default connection string is already pooled the same way.
2. **Push this repo to GitHub** (already done — `claude/report-connection-61qnlj`) and import it
   into Vercel as a new project. Vercel auto-detects Next.js; no build command changes needed.
3. **Set environment variables** in Vercel's project settings (Settings → Environment Variables):
   - `DATABASE_URL` — the pooled connection string from step 1
   - `ANTHROPIC_API_KEY` — for AI feedback (from https://console.anthropic.com/)
   - `ANTHROPIC_MODEL` — optional, defaults to `claude-opus-5`
4. **Deploy.** Vercel builds and deploys automatically on push.
5. **Apply the schema and seed data**, once, against the production database — run these from your
   own machine with `DATABASE_URL` (and `DATA_FILE` pointing at your local spreadsheet) set to the
   production values:
   ```bash
   DATABASE_URL="<your-neon-or-supabase-url>" npm run db:migrate:deploy
   DATABASE_URL="<your-neon-or-supabase-url>" npm run db:seed
   ```
   Re-run `db:migrate:deploy` after any future schema change; `db:seed` is safe to re-run any time
   you want to re-import from the spreadsheet.
6. The app has no login by default — keep the deployment URL private (Vercel gives you an
   unguessable `*.vercel.app` URL by default), or ask for a password-gate to be added if you plan
   to share the link.

## Project structure

- `prisma/schema.prisma` — `Question` (imported rows + app state like `noReviewNeeded`) and
  `PracticeAttempt` (recorded answers + AI feedback) models.
- `prisma/seed.ts` — spreadsheet importer.
- `src/app/page.tsx` — welcome page.
- `src/app/questions/` — browse/filter page.
- `src/app/practice/` — random-question practice page with AI feedback.
- `src/app/api/` — route handlers backing the pages above.
