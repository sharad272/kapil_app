# RM Productivity Portal

Monthly APE, FRP, quality and certification tracking for a team of relationship managers. RMs submit their own figures; the team lead sees everyone's.

Live: [kapilapp.vercel.app](https://kapilapp.vercel.app)

Next.js 16 · Vercel · optional Supabase (Postgres + Auth + RLS)

This is the RM portal from `rm-portal.tar.gz`, rebuilt for Cache Components, edge session refresh (`proxy.ts`), coalesced writes, and a preview mode so an interviewer can open the desk without a database.

## Who can see what

Access is enforced in Postgres with row-level security when Supabase is connected. Bypassing the UI does not get you anyone else's data.

| Data | RM | Team lead |
|---|---|---|
| Own APE / FRP / policies | read + write | read + correct |
| Another RM's figures | **no access** | read + correct |
| Targets, quality scores | read own only | read + write all |
| Own certification scores | read + write | read + correct |
| Coaching notes | **no access** | read + write |
| In-app notices | own inbox | filter + send |

Quality is an audit metric. It is not self-reported.

## Plain-English assistant

Team leads can type *who hasn't submitted* or *below 80% of target* and get a filtered list of RMs with suggested copy. Notices show up in the RM inbox, including when you switch the preview from Kapil to Kabir.

Set in `.env.local` (same keys as the Marvel project):

- `HF_TOKEN`
- `HF_BASE_URL` (default `https://router.huggingface.co/v1`)
- `LLM_MODEL` (default `openai/gpt-oss-120b`)
- optional `GROQ_API_KEY` / `GROQ_BASE_URL` / `GROQ_MODEL` if Hugging Face credits or rate limits trip

If no token is set, the desk still filters with deterministic KPI rules so the notify path works in an interview.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Choose **Kapil Sharma** or any relationship manager from the roster. Search by name if the book is long.

## Connect Supabase (production)

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → paste `supabase/schema.sql` → Run. Optionally run `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
4. After first sign-in, promote yourself:

```sql
update public.profiles set role = 'tl' where email = 'you@company.com';
```

5. In Supabase **Authentication → URL Configuration**, set Site URL and Redirect URLs to `https://your-app.vercel.app/auth/callback` (and localhost for dev).

## What changed for traffic

- Public landing and `/how-it-works` are cached shells. They do not touch submissions.
- `proxy.ts` refreshes the session and keeps `_next/static` out of the matcher.
- Figure inputs debounce 450ms so month-end typing is one upsert per field.
- RM queries select only that user's rows and named columns.
- Closed months are read-only for the RM.

## Project layout

```
supabase/schema.sql       tables, RLS policies, signup trigger
src/proxy.ts              session refresh + auth gate
src/lib/supabase/         browser and server clients
src/app/rm/               RM workspace + inbox
src/app/tl/               TL console + assistant
src/app/api/assistant     plain-English KPI filter
src/app/api/notifications in-app notices
src/app/how-it-works/     access model for reviewers
```
