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

1. Create a Postgres database on Neon/Supabase and copy its connection string.
2. Push this repo to GitHub and import it into Vercel.
3. In Vercel's project settings, set the environment variables:
   - `DATABASE_URL` — your Neon/Supabase connection string
   - `ANTHROPIC_API_KEY` — for AI feedback
4. Vercel runs `next build`, which does not run migrations automatically — before or after the
   first deploy, run against the production `DATABASE_URL`:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
5. The app has no login by default — keep the deployment URL private, or ask for a password-gate
   to be added if you plan to share the link.

## Project structure

- `prisma/schema.prisma` — `Question` (imported rows + app state like `noReviewNeeded`) and
  `PracticeAttempt` (recorded answers + AI feedback) models.
- `prisma/seed.ts` — spreadsheet importer.
- `src/app/page.tsx` — welcome page.
- `src/app/questions/` — browse/filter page.
- `src/app/practice/` — random-question practice page with AI feedback.
- `src/app/api/` — route handlers backing the pages above.
