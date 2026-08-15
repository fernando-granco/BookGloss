# BookGloss

BookGloss is a calm, keyboard-first reading companion for saving unfamiliar words under the book where you found them. Enter a word, press Enter, and BookGloss translates and saves it. Repeated words increment an encounter count without overwriting a translation you edited by hand.

## Screenshots

_Screenshots will be added after the first deployment._

## Requirements

- Docker Engine with Docker Compose (recommended), or Node.js 24+
- A Google Cloud project with the Cloud Translation API enabled
- A restricted API key or service account allowed to use Cloud Translation

## Google Cloud Translation setup

1. Enable **Cloud Translation API** in your Google Cloud project.
2. For the simplest setup, create an API key, restrict it to the Cloud Translation API, and set `GOOGLE_TRANSLATE_API_KEY` in `.env`.

For service-account authentication instead, download its JSON key and encode it as a single base64 line:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))
```

```bash
base64 -w 0 service-account.json
```

Copy `.env.example` to `.env`, then configure either the API key or the service-account variables. Never commit `.env` or the JSON key.

For local development, Application Default Credentials are also supported through `GOOGLE_APPLICATION_CREDENTIALS`.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Published Docker port |
| `DATABASE_URL` | `file:./dev.db` locally | Prisma SQLite location (relative to `prisma/schema.prisma`) |
| `GOOGLE_CLOUD_PROJECT_ID` | empty | Google Cloud project |
| `GOOGLE_TRANSLATE_API_KEY` | empty | Restricted Translation API key |
| `GOOGLE_CLOUD_CREDENTIALS_BASE64` | empty | Base64 service-account JSON for Docker |
| `GOOGLE_APPLICATION_CREDENTIALS` | empty | Optional local ADC JSON path |

## Run with Docker

```bash
cp .env.example .env
# Edit .env with Google Cloud credentials
docker compose up -d --build
```

Open `http://localhost:3000`. The container applies pending Prisma migrations before starting the app. The `/api/status` endpoint is used by the container health check.

## Run locally

```bash
cp .env.example .env
npm install
npm run db:deploy
npm run dev
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Persistence and backups

Docker Compose stores SQLite in the named volume `bookgloss-data`, mounted at `/app/data`. Rebuilding or replacing the container does not remove the volume.

For a consistent raw-file backup, briefly stop writes, copy the database, and restart:

```bash
mkdir -p backups
docker compose stop bookgloss
docker cp bookgloss:/app/data/vocabulary.db backups/vocabulary-$(date +%Y-%m-%d).db
docker compose start bookgloss
```

Do not use `docker compose down -v` unless you intentionally want to delete all stored vocabulary. Restore by stopping the service and copying a backup to `/app/data/vocabulary.db`.

## Updating

```bash
git pull
docker compose up -d --build
docker image prune -f
```

Migrations run automatically and the named volume remains intact. Take a backup before significant upgrades.

## Architecture

BookGloss is one Next.js application and one container. React renders the responsive interface; route handlers validate all writes with Zod; server-only services call Google Cloud Translation; Prisma reads and writes SQLite. A unique `(bookId, normalizedOriginal)` constraint prevents duplicate words, and deleting a book cascades to its vocabulary. There are no accounts, queues, caches, or additional services.
