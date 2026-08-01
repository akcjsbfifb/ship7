# EduAI (ship7)

Hackathon boilerplate for an interactive education platform. File structure
forked from **NextRag**; Docker layout aligned with **lambda/boilerplate**
(`docker-compose.yml` + `docker-compose.prod.yml`).

## Stack

- **Next.js 15** (App Router, `output: "standalone"`)
- **PostgreSQL 16 + pgvector** (course-isolated `documents`)
- **Prisma** + **node-pg** for similarity queries
- **Firebase Auth** (email/password + Google) + Prisma `User` / `Course` / `Enrollment`
- **OpenAI** (`gpt-4o-mini`, `text-embedding-3-small`) via AI SDK
- **Tailwind + shadcn/ui**
- **pnpm**

## Quick start

```bash
cp .env.example .env
# set OPENAI_API_KEY in .env

# Firebase Admin (local): place service account at project root
# firebase-service-account.json  (gitignored)
# or set GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

docker compose up -d --build
```

| Service    | URL                            |
|------------|--------------------------------|
| App        | http://localhost:3000          |
| Dashboard  | http://localhost:3000/dashboard|
| Postgres   | localhost:5432                 |

Ports: `PUERTO_FRONTEND`, `PUERTO_POSTGRES` in `.env`.

### Firebase console (once)

1. Enable **Email/Password** and **Google** in Authentication → Sign-in method.
2. Client config is hardcoded in `src/lib/firebase/client.ts` (same project for local + prod).
3. Authentication → Settings → **Authorized domains**: keep `localhost`, add your Coolify FQDN for production.
4. Sign-in uses `signInWithPopup`. If the Google popup is blocked in Coolify (third-party cookies / iframe), switch the client to `signInWithRedirect` — same provider, different entry method.
5. Prefer the same email if linking Google ↔ password accounts (Firebase account linking).

### Auth UX (hackathon)

- `/register`: pick Teacher or Student, then email/password **or** Continue with Google (role applied only on first User create).
- `/login`: email/password **or** Continue with Google (new users from login default to `STUDENT`).
- Re-login never changes an existing `User.role`.

### Production (Coolify / Docker)

Do **not** bake the service account JSON into the image. Set these env vars in Coolify (same Firebase project as local):

```bash
FIREBASE_PROJECT_ID=ship7-a8c70
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@ship7-a8c70.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Copy values from `firebase-service-account.json`:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (keep `\n` escaped as a single-line string in Coolify)

Also set `OPENAI_API_KEY` and Postgres vars as before.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Migrations run on container start (same pattern as lambda/boilerplate API entrypoint).

## Auth + courses

- Roles: `TEACHER` | `STUDENT` (stored in Prisma `User.role`)
- Teacher creates courses → gets `inviteCode`
- Student joins with `POST /api/courses/join`
- All RAG routes (`/api/ingest`, `/api/search`, `/api/chat`) require Bearer Firebase ID token + course membership
- Ingest / rotate invite: teacher only

## Docker layout (mirrors lambda/boilerplate)

```
├── docker-compose.yml          # Development (bind mount + hot reload)
├── docker-compose.prod.yml     # Production build
├── docker/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── entrypoint.dev.sh
│   ├── entrypoint.prod.sh
│   └── init/01-pgvector.sql
├── firebase-service-account.json  # local only, gitignored
```

## Commands

```bash
docker compose up -d --build
docker compose -f docker-compose.prod.yml up -d --build
docker compose logs -f app
docker compose exec app npx prisma studio
docker compose exec app npx prisma migrate deploy
```

## License

Inherited from NextRag (see `LICENSE`).
