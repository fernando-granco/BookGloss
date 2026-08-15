<div align="center">
  <h1>BookGloss</h1>
  <p>A quiet, keyboard-first home for the words you meet while reading.</p>
</div>

BookGloss keeps unfamiliar words attached to the books where you found them. Type a word, press Enter, and it is translated and saved. The input clears and focuses again so you can return to reading immediately.

## What it does

- Organizes vocabulary by book and language pair
- Translates through Google Cloud Translation on the server
- Counts repeated encounters without creating duplicate rows
- Preserves translations you edit by hand
- Stores optional page numbers, context, and favorites
- Searches, filters, and sorts each book’s vocabulary
- Supports polished light, dark, and system themes
- Runs as one Docker container with persistent SQLite storage

BookGloss intentionally has no accounts, analytics, gamification, flashcards, or additional services.

## Quick start with Docker

Requirements: Docker Engine with Docker Compose and a Google Cloud project with the Cloud Translation API enabled.

```bash
git clone https://github.com/fernando-granco/BookGloss.git
cd BookGloss
cp .env.example .env
# Add your Google Translation credentials to .env
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000). The container applies database migrations automatically and reports its health through `/api/status`.

## Google Cloud Translation

The simplest option is a Google Cloud API key:

1. Enable **Cloud Translation API** in your Google Cloud project.
2. Create an API key and restrict it to the Cloud Translation API.
3. Set `GOOGLE_TRANSLATE_API_KEY` in `.env`.

Service-account authentication is also supported. Encode the downloaded JSON key as one base64 line and set `GOOGLE_CLOUD_PROJECT_ID` and `GOOGLE_CLOUD_CREDENTIALS_BASE64`:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))
```

```bash
base64 -w 0 service-account.json
```

For local development, you may instead set `GOOGLE_APPLICATION_CREDENTIALS` to an Application Default Credentials JSON path. Credentials are only read by the server and are never stored in SQLite or sent to browser code.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Published Docker port |
| `DATABASE_URL` | `file:./dev.db` locally | Prisma SQLite location, relative to `prisma/schema.prisma` |
| `GOOGLE_TRANSLATE_API_KEY` | empty | Restricted Translation API key |
| `GOOGLE_CLOUD_PROJECT_ID` | empty | Google Cloud project for service-account authentication |
| `GOOGLE_CLOUD_CREDENTIALS_BASE64` | empty | Base64 service-account JSON for Docker |
| `GOOGLE_APPLICATION_CREDENTIALS` | empty | Optional local ADC JSON path |

Copy `.env.example` to `.env`; never commit `.env`, database files, or credential JSON.

## Local development

BookGloss requires Node.js 24 or newer.

```bash
cp .env.example .env
npm install
npm run db:deploy
npm run dev
```

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Data and backups

Docker Compose stores SQLite in the named volume `bookgloss-data`, mounted at `/app/data`. Rebuilding or replacing the container keeps the volume intact.

For a consistent raw-file backup, briefly stop writes, copy the database, and restart:

```bash
mkdir -p backups
docker compose stop bookgloss
docker cp bookgloss:/app/data/vocabulary.db backups/vocabulary-$(date +%Y-%m-%d).db
docker compose start bookgloss
```

Do not run `docker compose down -v` unless you intend to delete all saved vocabulary.

## Updating

```bash
git pull
docker compose up -d --build
```

Pending migrations run automatically. Take a backup before significant upgrades.

## Architecture

BookGloss is a single Next.js application. React renders the responsive interface, route handlers validate writes with Zod, a server-only service calls Google Cloud Translation, and Prisma reads and writes SQLite. A unique `(bookId, normalizedOriginal)` constraint prevents duplicates, while deleting a book cascades to its vocabulary.

## Security

BookGloss has no built-in authentication. Keep it on a private network or place it behind a trusted VPN or authenticated reverse proxy. See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Contributing and license

Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md). BookGloss is available under the [MIT License](LICENSE).
