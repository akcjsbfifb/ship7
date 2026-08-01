# EduAI (ship7)

Hackathon boilerplate for an interactive education platform. File structure
forked from **NextRag**; Docker layout aligned with **lambda/boilerplate**
(`docker-compose.yml` + `docker-compose.prod.yml`).

## Stack

- **Next.js 15** (App Router, `output: "standalone"`)
- **PostgreSQL 16 + pgvector** (course-isolated `documents`)
- **Prisma** + **node-pg** for similarity queries
- **OpenAI** (`gpt-4o-mini`, `text-embedding-3-small`) via AI SDK
- **Tailwind + shadcn/ui**
- **pnpm**

## Quick start

```bash
cp .env.example .env
# set OPENAI_API_KEY in .env

docker compose up -d --build
```

| Service    | URL                         |
|------------|-----------------------------|
| App        | http://localhost:3000       |
| Playground | http://localhost:3000/chat  |
| Postgres   | localhost:5432              |

Ports: `PUERTO_FRONTEND`, `PUERTO_POSTGRES` in `.env`.

### Production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Migrations run on container start (same pattern as lambda/boilerplate API entrypoint).

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
```

Dev volumes (same idea as boilerplate):

```yaml
volumes:
  - .:/app
  - /app/node_modules
  - /app/.next
```

## Multi-tenancy

```prisma
model documents {
  id        BigInt                 @id @default(autoincrement())
  courseId  String
  content   String?
  embedding Unsupported("vector")?
  metadata  Json?                  @default("{}")
  createdAt DateTime               @default(now())
  updatedAt DateTime               @updatedAt

  @@index([courseId])
}
```

All RAG reads/writes require `courseId`.

## Commands

```bash
docker compose up -d --build
docker compose -f docker-compose.prod.yml up -d --build
docker compose logs -f app
docker compose exec app npx prisma studio
docker compose exec app npx prisma migrate deploy
```

## Roadmap (8h hackathon)

1. Auth (teachers / students)
2. Courses + enrollments
3. Attendance
4. Student RAG agent (polish `/api/chat`)
5. Teacher tools (presentations via AI SDK / v0)

## License

Inherited from NextRag (see `LICENSE`).
