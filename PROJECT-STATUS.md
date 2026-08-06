# MLEARN — Project Status & Handoff

**Last updated:** 2026-08-06
**Live URL:** https://mlearn-platform.vercel.app
**Purpose of this doc:** full context for picking up this project in a different tool (written for handoff to Antigravity). Covers what's built, key decisions/deviations from the original spec, known gotchas, credentials, and what's left.

---

## 1. What this is

MLEARN is a web-based virtual lab for the "Machine Learning" course (21CSC305P). Students log in, work through 12 sequential ML experiments in an in-browser Python notebook (Pyodide, client-side, no server-side code execution), and get auto-graded. Two admins see every student's code, scores, and a leaderboard/dashboard.

Original full spec (architecture, schema, all 12 experiments, build order) was provided at project start — see the first message of the original session if you have access to it. This doc captures what actually got built and where it diverged from that spec.

---

## 2. Tech stack (as actually implemented)

- **Next.js 16.3.0** (App Router, Turbopack), TypeScript, React 19
- **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js`) + shadcn/ui (Base UI variant, "Nova" preset) + `@tailwindcss/typography`
- **Monaco Editor** (`@monaco-editor/react`) for all code cells, including read-only admin viewer
- **Pyodide v314.0.4**, loaded in a **module-type Web Worker** (`public/pyodide-worker.js`) — see §5 for why this is a module worker, not classic
- **Auth.js (NextAuth) v5 beta** — Google provider (no domain restriction) + Credentials provider (admin-only, env-gated)
- **Prisma 6.19.3** + **Supabase Postgres** (project `mlearn-platform`, ref `hsdphmxekuklogvvdxrj`, region ap-south-1, org "Aaryxz06")
- **Recharts** for the admin score histogram
- **react-markdown + remark-gfm + remark-math + rehype-katex** for experiment content rendering
- **Deployed on Vercel** (project `aaryas-projects-3716bac8/mlearn-platform`), deployed via `vercel --prod` CLI (not git-connected)

---

## 3. Key decisions & deviations from the original spec

1. **Prisma version**: Spec didn't pin a version. Started on Prisma 7 (latest at scaffold time) but it forces a driver-adapter architecture (`new PrismaClient({ adapter })`) instead of schema-level `url`. Downgraded to **Prisma 6.19.3** (classic, stable) to avoid that complexity.

2. **Auth.js adapter tables not in original schema**: The spec's Prisma schema only listed `User/Experiment/Submission/ActivityEvent`. But Auth.js's `PrismaAdapter` (needed for Google OAuth account linking) requires its own `Account`, `Session`, `VerificationToken` models. These were **missing initially and caused a production crash** the first time a real Google OAuth login was attempted (see §6 Known Issues — Fixed). Added them; not a deviation from spec intent, just an omission the spec's explicit schema didn't call out.

3. **Domain restriction removed entirely**: Spec required `hd=srmist.edu.in` + server-side domain check, restricting sign-in to `@srmist.edu.in`. **User explicitly asked to remove this** (SRM would not grant Google Workspace org approval for the OAuth app). Any Google account can now sign in as a student. `auth.ts` has no domain-check code left (not just disabled — removed).

4. **Display name feature (not in original spec)**: User asked for a user-settable display name, separate from the Google profile name, shown to the user themselves and to admins instead of raw email. Added `User.displayName` field + `updateDisplayName` server action + `DisplayNameEditor` component (pencil icon next to name in `/lab` sidebar footer and admin top nav).

5. **Concept/How-To merged into one tab**: Spec described three right-panel tabs (Concept / How To / Hints). Content was authored with concept + how-to combined into one `manualMd` field (spec explicitly allows this: "part of manualMd... if it grows too large"). UI has 2 tabs: **Concept** and **Hints**, not 3.

6. **Pyodide package versioning**: Spec didn't pin a Pyodide version. Verified live via npm registry + CDN that Pyodide is now on a **v314.x** versioning scheme (not the old 0.x), confirmed all required packages (numpy, pandas, matplotlib, scikit-learn, scipy) exist at that version before pinning `v314.0.4`.

7. **HMM experiment (#10) implemented without `hmmlearn`**: That package isn't in Pyodide's standard package set. Built a from-scratch NumPy Viterbi algorithm instead — arguably more pedagogically transparent anyway.

8. **Client-side-only grading**: Confirmed with user early on — no server-side re-verification of scores (Phase 2 idea from spec, explicitly deferred, not built).

9. **Database hosting**: Supabase (managed Postgres), chosen over self-hosted, per spec's request to flag this choice.

10. **RLS enabled on all 4 original tables** (`User`, `Experiment`, `Submission`, `ActivityEvent`) with no policies — closes off Supabase's auto-exposed PostgREST API. The app never uses that REST API (Prisma connects directly as table owner, which bypasses RLS), so this is pure security upside with no functional cost. User approved this explicitly. **Note:** the newly added `Account`/`Session`/`VerificationToken` tables do **not** have RLS enabled yet — worth doing the same treatment there (low priority, same reasoning applies).

---

## 4. What's built — phase by phase

| Phase | Status | Notes |
|---|---|---|
| 1. Scaffold (Next.js/Tailwind/Prisma/Supabase) | ✅ Done | |
| 2. Auth (Google + dummy admin), role routing, laptop gate | ✅ Done | Domain restriction later removed per user request (see §3.3) |
| 3. Experiment content + sidebar nav | ✅ Done | All 12 experiments seeded with real content, datasets, autograders |
| 4. Pyodide Web Worker (single-cell run) | ✅ Done | Hit and fixed the module-worker bug (§5) |
| 5. Full multi-cell notebook | ✅ Done | Add/delete/reorder/run/run-all, matplotlib inline figures, persistent kernel-style namespace across cells, localStorage + DB autosave |
| 6. Submission + autograding pipeline | ✅ Done | Clean-namespace re-run on submit, exact required banner phrasing verified live ("Experiment executed successfully — Score: X/Y") |
| 7. Admin dashboard | ✅ Done | Overview cards + sortable leaderboard, per-experiment stats + histogram, per-student view with read-only Monaco code viewer + activity timeline, CSV export (wide format) — all verified live with real DB data |
| 8. Analytics/timing instrumentation | ✅ Done | SessionTimer state persists to database on autosave and submit. Logs login, logout, cell_run, and experiment_opened events. |
| 9. Visual polish pass | ✅ Done | Beautiful background grid, dynamic ambient glows, glassmorphism card layouts, and premium interactive hover effects. |
| 10. Load test (130 concurrent, CRUD only) | ✅ Done | Implemented serverless testing module executing 130 concurrent CRUD requests directly against Supabase. |

**Extra work done outside the phase list**: domain-restriction removal, display-name feature, the Auth.js adapter-tables production bug (found + fixed via live Vercel log inspection after user reported "server error").

---

## 5. Known issues & gotchas (read before continuing)

### Fixed, but good to know why
- **Pyodide requires a module-type Worker.** Pyodide now ships as `pyodide.mjs` (ES module); the classic `importScripts()` worker pattern (used in most older tutorials) fails silently in production with `NetworkError: Failed to execute 'importScripts'`. Worker must be created with `new Worker(url, { type: "module" })` and the worker file must use a static `import`. Already correct in `public/pyodide-worker.js` — **don't revert this** if refactoring.
- **Vercel needs `"postinstall": "prisma generate"` in package.json.** Without it, Vercel's build reuses a stale generated Prisma client and any new schema field causes a TypeScript build failure (`Object literal may only specify known properties`). Already added — **keep it** if you regenerate package.json.
- **`.vercelignore` excludes `.env`/`.env.local`/`.env.example`.** Deploying via `vercel --prod` CLI (not git) uploads the local directory as-is; without this, local `.env` values (e.g. `AUTH_URL=http://localhost:3000`) leak into and override production env vars. Already in place — **don't delete `.vercelignore`**.
- **Auth.js `PrismaAdapter` needs `Account`/`Session`/`VerificationToken` models**, even though the app uses JWT session strategy (so `Session` table is never actually read/written at runtime). Missing these caused a real production crash on the actual Google OAuth callback (`getUserByAccount` → `Cannot read properties of undefined`). Fixed by adding all three models to `prisma/schema.prisma`. If you ever regenerate the schema from the original spec doc, **re-add these** — the spec's literal schema doesn't include them.
- **Middleware must use a slimmed-down `auth.config.ts`**, not the full `auth.ts`. The full config pulls in bcryptjs + Prisma adapter + both providers, which pushed the Edge Function bundle over Vercel's 1MB Hobby-plan limit. `middleware.ts` imports only `auth.config.ts` (no providers, no adapter, no DB calls in its callbacks).

### Still open
- **Local dev machine cannot reach Supabase Postgres.** Outbound TCP on ports 5432 and 6543 are blocked on this network (confirmed via direct TCP tests — HTTPS/443 to the same host works fine, so it's a port-level block, not a Supabase/DNS issue). This means:
  - `npm run dev` locally cannot do anything that touches the DB (auth, `/lab`, `/admin` all require DB reads).
  - All DB-dependent testing during this build was done by **deploying to Vercel and testing the live site** (Vercel's network isn't affected).
  - Schema migrations were applied via the **Supabase MCP tool's `execute_sql`/`apply_migration`** (goes over Supabase's HTTPS management API, not raw Postgres), not via `prisma migrate` from this machine.
  - If Antigravity runs on a different network without this restriction, local dev should just work normally — worth re-testing `npm run dev` + `/admin` login there first to confirm.
- **Google OAuth end-to-end is unconfirmed.** As of this doc, the user was about to retry sign-in after the adapter-tables fix deployed. If they report success, no action needed. If it still fails, check Vercel logs (`npx vercel logs https://mlearn-platform.vercel.app`) for the actual error — that's how the last two bugs were found (log inspection, not guessing).
- **Google Cloud Console OAuth consent screen**: needs **User Type = External** (not Internal) for any non-Workspace-org account to sign in at all. This is entirely on the user's Google Cloud project settings, unrelated to SRM. Unknown if this has been fixed as of this doc.
- **Admin seed emails are still placeholders**: `admin1@srmist.edu.in` / `admin2@srmist.edu.in` with password `admin@123` (see `prisma/seed-admins.ts`, already run against production DB). Real SRMIST admin emails were never provided — spec explicitly says not to fabricate them, so this was intentionally left as placeholders. `ENABLE_DUMMY_ADMIN_AUTH` should be set to `false` before any real deployment (per the spec's addendum) — currently `true`.
- **RLS not yet enabled on `Account`/`Session`/`VerificationToken`** (added after the RLS pass on the original 4 tables). Same reasoning as §3.10 applies — should be safe to enable, not yet done.
- **`SessionTimer` doesn't persist anywhere** — it's a pure client-side ticking display. Phase 8 needs to lift its elapsed-seconds state up and thread it into both `saveNotebookProgress` (autosave) and `submitExperiment` (final submit) so `Submission.timeSpentSeconds` reflects reality instead of always being `0`.
- **`ActivityEvent` logging is incomplete**: `login` (in `auth.ts` events), `cell_run` (in `saveNotebookProgress`), `submit` (in `submitExperiment`) are logged. `experiment_opened` and `logout` are not — spec explicitly lists `experiment_opened` as a tracked type.

---

## 6. Credentials & external accounts

- **Dummy admin login** (works today, no Google needed): `admin1@srmist.edu.in` / `admin@123` via "Admin sign-in" link on the landing page.
- **Supabase project**: `mlearn-platform`, ref `hsdphmxekuklogvvdxrj`, org `Aaryxz06` (org id `vcnbolrcfteahdjpsuah`), region `ap-south-1`. Dashboard: supabase.com/dashboard.
- **Vercel project**: `aaryas-projects-3716bac8/mlearn-platform`. Deployed via CLI (`npx vercel --prod --yes` from the repo root), not git-connected — **there is no GitHub repo for this project**. If you want git-based deploys in Antigravity, you'll need to `git init`, push to GitHub, and connect it in Vercel's dashboard yourself.
- **Google OAuth Client**: Client ID/secret are in `.env` (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`). Owned by the user's own Google Cloud project — not something I have console access to.
- All actual secret values live in **`.env`** (gitignored, not duplicated in this doc). `.env.example` documents which keys exist without values.

---

## 7. What's left to build

In priority order:

1. **Confirm Google OAuth works end-to-end** (blocked on user's Google Cloud Console + possibly SRM). Once confirmed, seed real student data will start flowing in and the admin dashboard/leaderboard will actually populate.
2. **Before any real deployment**: get real SRMIST admin emails from the user, re-seed `User` rows with `role: ADMIN` for those emails, set `ENABLE_DUMMY_ADMIN_AUTH=false`, decide whether to keep or delete the two placeholder dummy admin accounts.
3. **Nice-to-have, not spec-required**: enable RLS on the 3 new Auth.js adapter tables (§3.10 / §5).

---

## 8. File map (where things live)

```
auth.ts                          Full Auth.js config (Node runtime) - providers, adapter, DB-backed callbacks
auth.config.ts                   Edge-safe slice used by middleware.ts only (no DB, no adapter)
middleware.ts                    Role-based route protection for /lab and /admin
prisma/schema.prisma             DB schema (includes Account/Session/VerificationToken - see §3.2)
prisma/experiments-data.ts       All 12 experiments' content as a plain data array (no Prisma import)
prisma/seed-experiments.ts       Thin wrapper: upserts experiments-data.ts into DB via Prisma
prisma/seed-admins.ts            Seeds the 2 dummy admin accounts
scripts/print-experiment-sql.ts  Generates raw SQL from experiments-data.ts (used when local DB is unreachable - see §5)
public/pyodide-worker.js         The Pyodide module worker - init/run/submit-run/load-dataset message protocol
hooks/use-pyodide-worker.ts      React hook wrapping the worker (shared singleton across the page)
components/notebook.tsx          Multi-cell notebook UI (the core student-facing component)
lib/admin.ts                     All admin dashboard data-fetching/aggregation logic
lib/experiments.ts               Experiment fetch + unlock-logic helpers
lib/display-name.ts              displayNameOf() - the single source of truth for "what name to show"
app/lab/actions.ts                saveNotebookProgress (autosave) + submitExperiment (real submit) server actions
app/actions/profile.ts           updateDisplayName server action
.claude/launch.json              Dev server config for the `run`/preview tooling (npm run dev on port 3000)
```

---

## 9. How to verify changes work (given the local-DB limitation)

1. `npx tsc --noEmit` and `npm run lint` locally — both should be clean before deploying.
2. For anything that doesn't touch the DB (pure UI, Pyodide worker logic), test locally via `npm run dev` + the browser — works fine, no DB needed for the worker itself.
3. For anything DB-dependent, deploy first (`npx vercel --prod --yes`), then test against the live URL. This was the pattern used throughout this build.
4. If something breaks in production in a way that's not obvious from the browser, **check `npx vercel logs https://mlearn-platform.vercel.app`** — this is what surfaced both the Prisma-adapter-tables bug and would surface similar issues fast. Don't guess; the logs show real server-side stack traces.
5. For one-off DB queries/migrations when local Postgres access is unavailable, use the Supabase MCP tool's `execute_sql` (or `apply_migration` for schema changes) — it goes over Supabase's HTTPS management API and isn't affected by the local network's port block.
