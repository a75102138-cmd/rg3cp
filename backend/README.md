# Patrimoine backend — chantier patrimonial

NestJS + Prisma + PostgreSQL foundation for a **heritage restoration** platform (projets, zones, diagnostics, décisions, interventions, journal de chantier, médias, risques, RETEX).

This repository step provides **database-first architecture** and **module skeletons**. Business CRUD routes, auth, uploads, and workflows are intentionally **not** implemented yet so the schema and structure can stabilize first.

## Why `User` and `Actor` are separate

- **`User`**: platform account (authentication, RBAC via `Role`). Represents someone who can log in.
- **`Actor`**: business participant (architecte d’OF, entreprise, laboratoire, maître d’ouvrage, etc.). Exists in the domain even when there is **no** login.
- **`User.actorId`**: optional **1:1** link so a person can be both an authenticated user and a known business actor.

Keeping these tables apart avoids blending CRM/participant data with credentials and permission models.

## Why `Zone` is central

The UI may feel hierarchical (`Project → Zone → Element → …`), but the persistence model is **relational**.

- **`Zone`** is the **operational pivot**: most field work, diagnostics, decisions, and interventions are anchored to a zone.
- **`Project`** remains the **administrative container** (chantier, reporting boundaries, high-level risks, RETEX at portfolio level).

Queries like “everything that happened on this façade this week” should start from `zoneId` and join outward.

## Domain traceability (business chain)

Typical patrimonial traceability:

**Observation → Pathology → Decision → Intervention**

plus **Logbook** (journal de chantier) at project level with explicit links to zones / decisions / interventions for filtering and reporting.

`Document` and `Photo` carry **Cloudinary metadata** and optional foreign keys to the scope they document (project, zone, observation, etc.).

## Project layout

```
backend/
├── prisma/
│   ├── schema.prisma    # enums, models, indexes, relations
│   └── seed.ts          # realistic dev data (run on a fresh DB)
├── src/
│   ├── main.ts          # bootstrap, global ValidationPipe, Swagger
│   ├── app.module.ts    # Config + Prisma + feature modules
│   ├── config/          # @nestjs/config registerAs modules
│   ├── prisma/          # PrismaService (global module)
│   ├── common/          # shared DTOs, filters, guards placeholders
│   └── modules/         # one folder per domain aggregate
│       ├── cloudinary/  # CloudinaryPathBuilderService (folder naming only)
│       ├── projects/
│       ├── zones/
│       └── …
├── .env.example
└── package.json
```

Each feature module currently exposes a **service** wired with `PrismaService`. Controllers and DTOs per route will appear when APIs are added.

## Prisma

- **Database**: PostgreSQL, **UUID** primary keys, `createdAt` / `updatedAt` on main entities.
- **Enums**: project/zone/intervention status, pathology/decision types, lab tests, risk scales, `FileKind`, etc. (see `prisma/schema.prisma`).
- **Notable schema decisions**:
  - `Decision.pvDocumentId`: formal PV document, distinct from loose `Document` rows attached via `decisionId`.
  - `Logbook` + `LogbookZone` / `LogbookDecision` / `LogbookIntervention` for many-to-many scoping.
  - `LabTest.documentId`: optional link to a stored lab report `Document`.

Commands:

```bash
cp .env.example .env
# Set DATABASE_URL, then:

npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed   # optional, after migrate
```

**Seed demo data** (`prisma/seed.ts`) first **removes** projects whose `code` is in the demo list (`PROJ-TINMEL-26`, `PROJ-QARAWIYYIN-25`, `PROJ-KSAR-ATLAS-24`, legacy `PROJ-ETA-2025`) and all dependent rows, then **recreates** a full patrimonial slice (roles, users, actors, materials, zones, observations, pathologies, decisions, interventions, logbooks, documents, photos, risks, retex, lab tests). You can rerun `npm run prisma:seed` anytime in development; other projects or rows in the database are left untouched.

## Cloudinary folder conventions

Upload logic is **not** implemented here; **`CloudinaryPathBuilderService`** centralizes **folder strings** so all modules share the same layout:

| Scope | Example folder |
|--------|----------------|
| Project documents | `projects/{projectCode}/documents` |
| Project photos | `projects/{projectCode}/photos` |
| Journal attachments | `projects/{projectCode}/journal` |
| Zone | `projects/{projectCode}/zones/{zoneCode}/documents|photos|media` |
| Observation | `…/observations/{observationCode}/photos|documents` |
| Pathology | `…/pathologies/{pathologyCode}/photos|documents` |
| Decision | `…/decisions/{decisionCode}/documents` |
| Intervention | `…/interventions/{interventionCode}/photos|documents` |

`Document` and `Photo` models store `publicId`, `assetFolder`, `secureUrl`, etc., so DB state matches what was uploaded.

`DocumentsModule` and `PhotosModule` already import `CloudinaryModule` so services can inject `CloudinaryPathBuilderService` when you add upload endpoints.

## Configuration

| File | Role |
|------|------|
| `src/config/app.config.ts` | `PORT`, `API_PREFIX` |
| `src/config/database.config.ts` | `DATABASE_URL` (informational; Prisma reads env directly) |
| `src/config/swagger.config.ts` | docs path segment |
| `src/config/cloudinary.config.ts` | Cloudinary env vars |
| `src/config/validation.config.ts` | global `ValidationPipe` options |

Swagger UI: **`{API_PREFIX}/docs`** (default `http://localhost:3001/api/docs` si `PORT=3001`).

## What is scaffold-only today

- **`AuthModule` / `AuthService`**: no JWT, guards, or strategies yet.
- **Domain module services**: no public HTTP API (except **`GET /api/health`** on `AppController`).
- **Cloudinary**: path builder only; no SDK upload pipeline.
- **`HttpExceptionFilter`**: present under `common/filters` but **not** registered globally (opt-in when you want unified errors).

## Suggested next implementation steps

1. Run `prisma migrate dev` and confirm the schema in Prisma Studio.
2. Add **controllers + DTOs** per module, starting with `projects` and `zones` (overview/detail aggregates for `/projects/:id/overview`, `/zones/:id/details`).
3. Implement **authentication** (e.g. Passport + JWT), password hashing, and attach guards to routes.
4. Add **upload** use cases using `cloudinary` SDK + `CloudinaryPathBuilderService`, then persist `Document` / `Photo`.
5. Layer **policies** (who can approve a `Decision`, close an `Intervention`, etc.) on top of `Role` / future permissions.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Nest watch mode |
| `npm run build` | Compile to `dist/` |
| `npx prisma migrate dev` | Create/apply migrations |
| `npm run prisma:seed` | Run `prisma/seed.ts` |

---

This backend is tailored to **patrimonial restoration governance** (preuve documentaire, traçabilité technique, capitalisation), not a generic CRUD admin template.
