# My Deployed App — Ink & Ideas Blog

A production-oriented full-stack blog application built with React, Vite, TypeScript, Express, Prisma and PostgreSQL. It includes a multi-stage Docker build, health checks, structured request logging, graceful shutdown, GitHub Actions CI/CD and Railway deployment configuration.

## Features

- Create, read and delete blog posts.
- React + Vite frontend; Express + TypeScript API.
- PostgreSQL persistence through Prisma ORM.
- `GET /api/health` readiness/health endpoint with database and memory checks.
- Pino JSON logging in production and request IDs.
- Environment validation at startup; no secrets committed.
- Graceful handling of `SIGTERM` and `SIGINT`.
- Docker multi-stage image and GitHub Actions pipeline.

## Requirements

- Node.js 20+
- npm
- Docker (for container workflow)
- PostgreSQL database (local or hosted)

## Run locally

1. Copy the example configuration:

   ```bash
   cp .env.example server/.env
   ```

2. Set `DATABASE_URL` in `server/.env` to a PostgreSQL database you can access. Keep `CLIENT_URL=http://localhost:5173`.

3. Install dependencies and generate Prisma Client:

   ```bash
   cd server && npm install && npx prisma generate && cd ..
   cd client && npm install && cd ..
   ```

4. Apply database migrations:

   ```bash
   cd server && npx prisma migrate deploy && cd ..
   ```

5. Start both applications in separate terminals:

   ```bash
   cd server && npm run dev
   ```

   ```bash
   cd client && npm run dev
   ```

6. Open http://localhost:5173. The API runs at http://localhost:3001.

## Docker

Build the production image:

```bash
docker build -t my-deployed-app .
```

Run it with the server environment file:

```bash
docker run --rm -p 3001:3001 --env-file server/.env my-deployed-app
```

Open http://localhost:3001 and verify http://localhost:3001/api/health. The container runs production dependencies and applies committed Prisma migrations before starting the server.

## Environment variables

| Variable | Required | Default / example | Purpose |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime mode; use `production` in cloud |
| `PORT` | No | `3001` | HTTP server port; cloud platforms may inject this |
| `DATABASE_URL` | Yes | PostgreSQL connection string | Prisma database connection |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed browser origin for CORS |
| `LOG_LEVEL` | No | `info` | Pino logging threshold |
| `VITE_API_URL` | No | empty | Optional API origin for a separately hosted frontend; set at frontend build time |

Never commit `.env` files, passwords, database URLs or tokens. Configure production values in the hosting platform's secret/environment-variable settings.

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns status, timestamp, uptime, version and dependency checks |
| `GET` | `/api/posts` | Lists posts newest first |
| `POST` | `/api/posts` | Creates a post; JSON body: `{ "title": "...", "content": "..." }` |
| `DELETE` | `/api/posts/:id` | Deletes a post |

Health status is `ok` when database and memory checks pass, or `degraded` when a dependency check fails. A degraded response uses HTTP 503 so the platform can detect an unhealthy instance. The response intentionally excludes credentials and internal connection details.

## CI/CD with GitHub Actions

Workflow: `.github/workflows/ci-cd.yml`.

- Runs on pushes and pull requests targeting `main`.
- Installs Node.js dependencies, generates Prisma Client, type-checks/lints, runs tests and builds both applications.
- Builds the Docker image after checks pass.
- Deploys only on a push to `main`, never on pull requests.
- Uses the `RAILWAY_TOKEN` GitHub Actions secret; never hard-code deployment credentials.

### Configure GitHub

1. Create a GitHub repository and push this project to its `main` branch.
2. In **Settings → Secrets and variables → Actions**, add `RAILWAY_TOKEN`.
3. Connect the repository to your Railway project and configure its service. Ensure the service uses the repository Dockerfile.
4. Confirm the Railway project/service is linked to the token used by the workflow. If your Railway setup requires an explicit project or service selection, configure the corresponding Railway CLI context/variables in the workflow before relying on automated deployment.

## Deploy to Railway

1. Create a Railway project and add a PostgreSQL service.
2. Add the application service from the GitHub repository and select the root `Dockerfile`.
3. Set these variables on the application service:
   - `NODE_ENV=production`
   - `DATABASE_URL` to the PostgreSQL connection URL exposed by your Railway database service (use the internal/private URL when both services are in the same project).
   - `CLIENT_URL` to the public application origin, e.g. `https://your-service.up.railway.app`.
   - `PORT` only if Railway does not inject it automatically; the application defaults to `3001`.
4. Generate a Railway domain in the service's networking settings.
5. Add `RAILWAY_TOKEN` to GitHub repository Actions secrets.
6. Push to `main`. Confirm the workflow passes and Railway reports a successful deployment.
7. Verify `https://YOUR-DOMAIN/api/health`, create a post, refresh the page and confirm the post remains in PostgreSQL.

For the first deployment, deploy from Railway's dashboard if needed to establish the project/service. Then verify the CLI context used by GitHub Actions before depending on automated deployments.

## Production considerations

- **Migrations:** `prisma migrate deploy` applies committed migrations in production. Do not use `prisma migrate dev` in production.
- **Persistent data:** PostgreSQL is a managed external service; container restarts do not erase database records.
- **Logging:** Pino emits structured logs. HTTP logs include request method, URL, status and response time. Do not log passwords, tokens or request bodies.
- **Request tracing:** `pino-http` assigns a request ID (or accepts `x-request-id`) so related log entries can be correlated.
- **Shutdown:** the HTTP server stops accepting new connections and Prisma disconnects on `SIGTERM`/`SIGINT`.
- **Monitoring:** configure Railway health checks to use `/api/health`; use platform logs/metrics and an uptime monitor for alerting.

## What I learned

This project demonstrates the last mile of application delivery: separating build and runtime concerns with Docker, validating configuration at startup, keeping secrets outside source control, automating quality gates with CI/CD, applying production database migrations, exposing health information, and operating a service with structured logs and graceful shutdown.

## Repository structure

```text
my-deployed-app/
├── .github/workflows/ci-cd.yml
├── client/                 # React + Vite frontend
├── server/                 # Express + TypeScript API
│   ├── prisma/             # Schema and SQL migration
│   ├── src/
│   └── test/
├── .dockerignore
├── .env.example
├── Dockerfile
└── README.md
```
