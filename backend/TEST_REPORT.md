# Backend QA / API verification report

**Date:** 2026-04-03  
**Environment:** Windows, Node (repo-local), PostgreSQL required for runtime HTTP tests.

---

## 1. Build status

| Check | Result | Notes |
|--------|--------|--------|
| `npx prisma validate` | **PASS** | Schema valid |
| `npx prisma generate` | **PASS** | Client generated |
| `npm run build` (Nest) | **PASS** | TypeScript compiles |

## 2. Database / runtime

| Check | Result | Notes |
|--------|--------|--------|
| `prisma/migrations` folder | **Absent** | First deploy: use `npx prisma migrate dev --name init` **or** `npx prisma db push` after DB is up |
| Docker Desktop (`docker run`) | **Not available** | Engine pipe missing — Docker Desktop not running during QA |
| Local PostgreSQL `127.0.0.1:5432` | **Reachable, auth failed** | `P1000` with default URL from `.env.example` — credentials differ on this machine |
| App boot + HTTP CRUD | **Not executed** | Blocked until a valid `DATABASE_URL` and schema sync exist |

**Provided for local QA**

- `docker-compose.yml` — Postgres 16 on host port **5433** (when Docker Desktop is running):  
  `docker compose up -d`  
  Then set `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/patrimoine?schema=public`, run `npx prisma db push`, `npm run prisma:seed` (optional), `npm run start:dev`, `npm run verify:api`.

## 3. Automated API script

- **File:** `scripts/verify-api.mjs`
- **Command:** `npm run verify:api` (with API running and DB populated)
- **Covers:** Health, Swagger URL, CRUD smoke for all 17 modules, domain negatives (observation/pathology/decision zone coherence, intervention vs decision zone, logbook cross-project links, document/photo context, risk scope, user `passwordHash` absent).

When the server is not running, the script exits non-zero with a **NETWORK** error (expected).

## 4. Static review (high-priority scenarios)

Code paths for the requested scenarios are present and consistent with Nest/Prisma usage:

- Project / zone / element / material flows use `PrismaService` and FK checks where applicable.
- Observation / pathology / decision / intervention validations use shared helpers in `src/common/validation/domain-validation.ts`.
- Logbook link sync validates zone/decision/intervention belong to the logbook’s `projectId`.
- Documents/photos require at least one context; risks require at least one scope.
- Users: `sanitizeUser` strips `passwordHash` on create/get/list/update responses.

No code defects requiring an immediate fix were found during static review alongside the build.

## 5. Issues found & fixes applied (this QA pass)

| Item | Fix |
|------|-----|
| No repeatable HTTP test harness | Added `scripts/verify-api.mjs` + `npm run verify:api` |
| No standard local DB recipe when Docker CLI broken | Added `docker-compose.yml` + `.env.example` comment for port 5433 |
| Script robustness | Network errors from `fetch` captured instead of raw stack only |

## 6. CRUD verification summary (by module)

Status reflects **runtime** execution on this machine: **NOT RUN** (no working DB + app). After you apply DB + start server, run `npm run verify:api` — expected **PASS** if nothing else blocks.

| Module | Status | Notes |
|--------|--------|--------|
| roles | NOT RUN | Script + routes present |
| users | NOT RUN | `passwordHash` checks in script |
| actors | NOT RUN | |
| materials | NOT RUN | |
| projects | NOT RUN | |
| zones | NOT RUN | Includes parent/child |
| elements | NOT RUN | |
| observations | NOT RUN | Negative: wrong element zone → 400 |
| pathologies | NOT RUN | Negative: obs/zone mismatch → 400 |
| decisions | NOT RUN | Negative: obs/zone mismatch → 400 |
| interventions | NOT RUN | Negative: zone ≠ decision.zone → 400 |
| logbooks | NOT RUN | Negative: cross-project zone → 400 |
| lab-tests | NOT RUN | |
| documents | NOT RUN | Negative: no context → 400 |
| photos | NOT RUN | Negative: no context → 400 |
| risks | NOT RUN | Negative: no scope → 400 |
| retex | NOT RUN | |
| GET `/api/health` | NOT RUN | In script |
| Swagger `/api/docs` | NOT RUN | In script (expects 200/304) |

## 7. Remaining manual steps

1. Start PostgreSQL (host install or `docker compose up -d` with Docker Desktop).
2. Copy `.env.example` → `.env`, set `DATABASE_URL`.
3. `npx prisma db push` **or** `npx prisma migrate dev --name init`.
4. Optional: `npm run prisma:seed`.
5. `npm run start:dev`
6. `npm run verify:api`

## 8. Readiness for frontend integration

- **Compile-time / schema:** Ready (`validate` + `generate` + `build` OK).
- **Runtime / contract:** Ready **after** DB URL is correct, schema is applied, and `verify:api` passes on your machine.
- **Auth:** Still open (no JWT guards) — acceptable only for internal/dev until secured.
