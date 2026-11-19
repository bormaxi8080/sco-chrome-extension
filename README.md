# Source Credibility Overlay

**Chrome extension + TypeScript/Fastify API + PostgreSQL cache.** An MVP for collecting and explaining source-verification signals.

![Source Credibility Overlay interface](https://raw.githubusercontent.com/bormaxi8080/bormaxi8080/main/img/sco.png)

## At a glance

```text
Chrome extension (Manifest V3)
        | HTTP / shared RiskCard contract
        v
Fastify API ----> RDAP, DNS, TLS and page metadata checks
        |
        v
PostgreSQL risk-card cache
```

The stack demonstrates API integration, a shared TypeScript contract, browser-extension development, caching, and Docker-based setup. Redis is included in Compose but is not yet used for queues.

**Assessment uses explainable rules, not an AI credibility model.** A risk card supports manual verification; it does not prove that a source is truthful or malicious.

## API example

After starting the local stack:

```bash
curl http://localhost:8080/v1/domains/example.com/risk-card
```

Illustrative response excerpt with placeholder values, based on the [shared RiskCard contract](packages/shared/src/index.ts). This is not a live assessment of example.com and omits other contract fields:

```json
{
  "domain": "example.com",
  "status": "partial",
  "riskLevel": "unknown",
  "confidence": "low",
  "summary": "Illustrative placeholder; inspect the actual response and evidence.",
  "signals": []
}
```

The full response groups domain, DNS, TLS, site, redirect, and list-match information with a check timestamp and cache TTL. Signals can include evidence and verification recommendations. Known limitations are listed below.

## Implementation and setup

Chrome extension plus backend API for transparent source credibility signals. The project does not claim that a site is fake or malicious. It collects technical and contextual signals, explains them, and recommends manual verification when risk is elevated.

## What Is Implemented

- Chrome extension shell with:
  - toolbar badge
  - popup risk card
  - dismissible content overlay
  - local card cache via `chrome.storage.local`
- Backend API with:
  - RDAP lookup
  - DNS lookup
  - TLS certificate inspection
  - homepage metadata and common about/contact/privacy checks
  - simple explainable risk scoring
  - Postgres-backed risk card cache
- Docker Compose stack:
  - `api`
  - `postgres`
  - `redis`
- Shared TypeScript `RiskCard` contract.
- Initial scoring tests.

## Requirements

- Node.js 22+
- npm 10+
- Docker and Docker Compose

## Docker Data Directory Configuration

By default, Docker stores container data (including Postgres databases) in its default data directory on the system disk (`/var/lib/docker` on Linux, or inside the Docker Desktop VM on macOS/Windows). This can fill up your system disk over time.

To store Docker data on an external volume instead, configure `DOCKER_DATA_PATH` in your `.env` file:

```bash
# .env
DOCKER_DATA_PATH=/Volumes/Transcend/DockerData/sco-chrome-extension
```

This path is used as a bind mount for the Postgres data directory in `docker-compose.yml`:

```yaml
volumes:
  - ${DOCKER_DATA_PATH}/postgres:/var/lib/postgresql/data
```

The directory will be created automatically when you run `docker compose up`. Make sure the path exists and is writable by your user (and Docker has access to it on macOS/Windows via Docker Desktop's file sharing settings).

## Quick Start

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build all workspaces:

```bash
npm run build
```

Start backend, Postgres, and Redis:

```bash
docker compose up --build
```

API endpoints:

```text
GET  http://localhost:8080/health
GET  http://localhost:8080/v1/domains/example.com/risk-card
POST http://localhost:8080/v1/domains/example.com/refresh
```

## Extension Development

Build the extension:

```bash
npm run build -w @sco/extension
```

Load `apps/extension/dist` as an unpacked extension in Chrome:

```text
chrome://extensions
Developer mode
Load unpacked
```

The extension calls `http://localhost:8080` by default. Override it at build time with:

```bash
VITE_API_BASE_URL=https://your-api.example.com npm run build -w @sco/extension
```

## Backend Development

Run the API locally without Docker:

```bash
npm run dev:api
```

When running locally outside Docker, set `DATABASE_URL` if you want persistent cache:

```bash
DATABASE_URL=postgres://sco:sco_password@localhost:5432/sco npm run dev:api
```

If `DATABASE_URL` is omitted, the API still runs but does not persist risk card cache.

## Risk Model

The MVP uses explainable rules, not machine learning:

- recently registered domain
- unavailable or incomplete RDAP
- missing HTTPS
- recently issued TLS certificate
- missing about/contact/privacy pages
- sparse homepage metadata
- cross-domain redirects

The popup and overlay use cautious language:

```text
Signals indicate elevated risk. Manual verification recommended.
```

## Repository Layout

```text
apps/
  api/          Fastify backend
  extension/    Chrome Manifest V3 extension
packages/
  shared/       Shared TypeScript contracts
docker/
  postgres/     DB initialization
docs/           Product and risk model notes
```

## Known MVP Limits

- External list matching is stubbed for now.
- Redis is included in Docker but not yet used for queues.
- Page checks are intentionally shallow to avoid aggressive crawling.
- Social profile extraction is best-effort from homepage links only.
- The content overlay's "View details" action is a placeholder; the toolbar popup is the canonical detail view.
