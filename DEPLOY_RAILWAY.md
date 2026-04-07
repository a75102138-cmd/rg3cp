# Deploy Railway (Docker)

This project is deployed as 2 Docker services:

- `backend` (NestJS + Prisma)
- `frontend` (Next.js)

And 1 managed database service:

- `PostgreSQL` (Railway plugin)

## 1) Create Railway services

1. Create a new Railway project.
2. Add PostgreSQL service.
3. Add service from repo for `backend` folder.
4. Add service from repo for `frontend` folder.

For each app service, set **Root Directory**:

- backend service root: `backend`
- frontend service root: `frontend`

Railway will detect each `Dockerfile`.

## 2) Backend variables

Set these env vars on backend service:

- `DATABASE_URL` = from Railway PostgreSQL service.
- `JWT_SECRET` = strong random secret.
- `JWT_EXPIRES_IN` = `7d` (or your preferred value).
- `API_PREFIX` = `api` (default, optional).
- `CLOUDINARY_CLOUD_NAME` = your Cloudinary cloud name.
- `CLOUDINARY_API_KEY` = your Cloudinary API key.
- `CLOUDINARY_API_SECRET` = your Cloudinary API secret.
- `SWAGGER_DOCS_PATH` = `docs` (optional).

Notes:

- Backend container startup runs: `prisma migrate deploy && node dist/main`.
- Railway injects `PORT`; backend already supports `PORT` via app config.

## 3) Frontend variables

Set these env vars on frontend service:

- `NEXT_PUBLIC_API_BASE_URL` = your backend public URL + `/api`
  - Example: `https://your-backend.up.railway.app/api`

Optional:

- Any other `NEXT_PUBLIC_*` flags you use.

## 4) Deploy order

Recommended first deploy:

1. Deploy PostgreSQL.
2. Deploy backend (confirm `/api/health` works).
3. Deploy frontend.
4. Open frontend and test login/register.

## 5) Post-deploy checks

- Backend health:
  - `GET https://<backend-url>/api/health`
- Swagger:
  - `GET https://<backend-url>/api/docs`
- Frontend:
  - Login page loads.
  - Register works.
  - API calls succeed (no CORS/auth issues).

## 6) Common pitfalls

- Wrong frontend API URL:
  - Must point to backend URL with `/api`.
- Missing `JWT_SECRET`:
  - Auth fails.
- Missing `DATABASE_URL`:
  - Backend fails at startup.
- Missing Cloudinary vars:
  - Upload features fail.

