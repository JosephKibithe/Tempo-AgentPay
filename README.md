# TempoAgentPay

TempoAgentPay is a production-style demo dashboard and adapter layer for a budget-safe paid-agent runtime. It pairs the existing TypeScript backend modules in [`src/`](./src) with a Next.js App Router frontend for task execution, ledger inspection, provider health, and policy control.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- SWR
- Recharts
- Existing AgentPay backend modules under [`src/`](./src)

## Features

- Dashboard home with summary cards, recent runs, provider health, and budget utilization
- Task Runner form for creating new budget-capped tasks
- Task detail page with itemized attempt timeline and fallback markers
- Provider health page with sorting and status filtering
- Policy control page with editable runtime settings
- Next API routes that proxy to the AgentPay backend
- Mock payload mode for local demo without a live backend

## API Adapter Routes

- `POST /api/tasks`
- `GET /api/tasks/:id`
- `GET /api/tasks/:id/report`
- `GET /api/providers/health`
- `GET /api/policy`
- `PATCH /api/policy`
- `GET /api/stats/summary`

All adapter routes point at `AGENTPAY_API_BASE`.

## Environment

Copy `.env.example` to `.env.local` and adjust as needed.

```bash
AGENTPAY_API_BASE=http://localhost:4000
AGENTPAY_ENABLE_MOCKS=false
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

If you want the dashboard to run without a backend, set:

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
- [`components/`](./components): dashboard UI, forms, tables, and shared view components
- [`lib/`](./lib): typed models, normalizers, API helpers, mock data, and proxy utilities
- [`mock-data/`](./mock-data): sample payloads for each adapter endpoint
- [`docs/demo-script.md`](./docs/demo-script.md): short presentation script
- [`src/`](./src): existing AgentPay backend runtime and tests

## Mock Payload Samples

Sample endpoint payloads are included here:

- [`tasks.create.json`](./mock-data/tasks.create.json)
- [`tasks.status.json`](./mock-data/tasks.status.json)
- [`tasks.report.json`](./mock-data/tasks.report.json)
- [`providers.health.json`](./mock-data/providers.health.json)
- [`policy.json`](./mock-data/policy.json)
- [`stats.summary.json`](./mock-data/stats.summary.json)

## Validation

The repo currently passes:

- `npm run check`
- `npm test`
- `npm run build`

## Notes

- The dashboard handles backend failures gracefully and will show retryable error states instead of crashing pages.
- The API layer normalizes partial backend payloads into strict frontend interfaces.
- The original backend runtime remains intact and can still be exercised through [`src/index.ts`](./src/index.ts).
