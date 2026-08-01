# EduAI (ship7)

Hackathon boilerplate for an interactive education platform. File structure
forked from **NextRag**; Docker layout aligned with **lambda/boilerplate**.

## Stack

- **Next.js 15** (App Router, `output: "standalone"`)
- **PostgreSQL 16 + pgvector** (course-isolated `documents`)
- **Firebase Auth** (email/password + Google) + Storage for course files
- **Prisma**: `User`, `Course`, `Enrollment`, `CourseTopic`, `Material`, `ChatThread`, `ChatMessage`
- **markitdown** (Python CLI in Docker) → text for RAG
- **OpenAI** via AI SDK

## Quick start

```bash
cp .env.example .env
# set OPENAI_API_KEY
# place firebase-service-account.json at repo root (gitignored)

docker compose up -d --build
```

| Service   | URL                             |
|-----------|---------------------------------|
| App       | http://localhost:3000           |
| Dashboard | http://localhost:3000/dashboard |

Dev compose defaults `UPLOAD_DRIVER=local` (volume `/data/uploads`). Prod defaults to Firebase Storage.

### Firebase console

1. Auth: Email/Password + Google. Authorized domains: `localhost` + Coolify FQDN.
### Firebase Storage rules (pegar en Console → Storage → Rules)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Lectura para usuarios autenticados (links firmados / client SDK)
    // Escritura solo desde el servidor (Firebase Admin) — las rules no aplican al Admin SDK
    match /courses/{courseId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

Env para usar Storage en todos lados:

```bash
UPLOAD_DRIVER=firebase
FIREBASE_STORAGE_BUCKET=ship7-a8c70.firebasestorage.app
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
# o FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
```

Si el upload falla con 403: en Google Cloud Console → IAM, al service account `firebase-adminsdk-...@ship7-a8c70.iam.gserviceaccount.com` asigná el rol **Storage Object Admin** (o Storage Admin) sobre el proyecto/bucket.

### Fallback: persistent volume (Coolify)

Solo si no usás Firebase Storage:

1. Coolify → app → Persistent Storage → mount `/data/uploads`
2. `UPLOAD_DRIVER=local` + `UPLOAD_DIR=/data/uploads`

## Commands

```bash
docker compose up -d --build
docker compose logs -f app
docker compose exec app npx prisma migrate deploy
```

## License

Inherited from NextRag (see `LICENSE`).
