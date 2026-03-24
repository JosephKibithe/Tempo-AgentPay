# Tempo Query Commerce

Tempo Query Commerce is a pay-per-query knowledge base demo built on Next.js. It packages a customer-facing query flow, receipt detail pages, source collection browsing, pricing controls, and retrieval telemetry into one product-shaped app.

The repo still keeps the original TypeScript AgentPay runtime in [`src/`](./src), but the main app is now a monetizable vertical slice: ask a grounded question against a source collection, meter the answer, and show the receipt with citations.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- SWR
- Recharts
- Local knowledge-base engine for demo mode under [`lib/server/`](./lib/server)
- Existing AgentPay runtime under [`src/`](./src)

## Product Features

- Dashboard with paid-query volume, answer rate, revenue, citation coverage, and latency
- Query form for asking a paid question against a chosen source collection
- Receipt/detail page with answer, citations, pipeline trace, and settlement metadata
- Source collection catalog exposed through the dashboard and `/api/sources`
- Retrieval health page with provider latency, cost, and success metrics
- Pricing policy page for query ceilings, citation limits, and kill-switch control
- Backward-compatible task-shaped routes plus new query-shaped routes

## API Routes

Primary routes:

- `POST /api/queries`
- `GET /api/queries/:id`
- `GET /api/queries/:id/report`
- `GET /api/sources`
- `GET /api/providers/health`
- `GET /api/policy`
- `PATCH /api/policy`
- `GET /api/stats/summary`

Compatibility routes:

- `POST /api/tasks`
- `GET /api/tasks/:id`
- `GET /api/tasks/:id/report`

When `AGENTPAY_ENABLE_MOCKS=true`, the app serves seeded demo data locally. When `AGENTPAY_API_BASE` is set and mock mode is disabled, the proxy layer can forward to an external backend.

## Environment

Copy `.env.example` to `.env.local` and adjust as needed.

```bash
AGENTPAY_API_BASE=http://localhost:4000
AGENTPAY_ENABLE_MOCKS=false
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For the built-in local knowledge-base demo, either leave `AGENTPAY_API_BASE` unset or enable mocks:

```bash
AGENTPAY_ENABLE_MOCKS=true
```

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Commands

```bash
npm run dev
npm run check
npm test
npm run build
npm run start
npm run demo:backend
```

## Project Structure

- [`app/`](./app): Next.js pages and API routes
- [`components/`](./components): dashboard UI, query flow, receipt views, and control forms
- [`lib/`](./lib): typed models, normalizers, mock data, API helpers, and server-side query engine
- [`docs/demo-script.md`](./docs/demo-script.md): short walkthrough for showing the product
- [`src/`](./src): original AgentPay backend runtime and tests

## Validation

The repo currently passes:

- `npm run check`
- `npm test`
- `npm run build`

## Notes

- The product now works without an external backend by using the local query engine in [`lib/server/knowledge-base.ts`](./lib/server/knowledge-base.ts).
- The proxy layer stays in place so the app can still front a separate backend later.
- The original AgentPay runtime remains intact and can still be exercised through [`src/index.ts`](./src/index.ts).
