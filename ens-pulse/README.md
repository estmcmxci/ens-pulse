# ENS Pulse

> **ENS DAO Monitor** — Real-time governance intelligence dashboard for the Ethereum Name Service DAO.

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Turbo](https://img.shields.io/badge/Turbo-2.3-black)](https://turbo.build/)

## Overview

ENS Pulse aggregates and visualizes critical data about the ENS DAO in real time. The homepage is a single-page command monitor with 14+ widgets that stream data independently via SWR, with a full-viewport hero overlay on first visit.

### Features

- **Live Dashboard** — Price tickers (ETH/ENS), total treasury assets, active proposals, top delegates, attack profitability analysis, protocol metrics, treasury breakdown, calendar, forum feed, social feed, and a floating signals ticker
- **Governance** — Active proposals, voting status, and delegate performance via Tally
- **Treasury** — Multisig wallet balances, pending transactions, and asset composition via Safe
- **Delegate Analytics** — Leaderboard with voting power distribution
- **Context Feeds** — Discourse discussions, X/Twitter signals, and newsletter archive
- **Calendar** — Upcoming ENS DAO meetings and working group events
- **Historical Analysis** — Protocol metrics over time
- **Hero Overlay** — Session-gated cinematic entry with radial clip-path reveal

## Architecture

Monorepo with Turborepo:

- **Dashboard** (`apps/dashboard`) — Next.js 15 web application
- **Indexer** (`apps/indexer`) — Ponder-based blockchain event indexer
- **Shared** (`packages/shared`) — Shared TypeScript types and utilities

```
Next.js Dashboard (React 19, Tailwind CSS 4, SWR)
        │
        ▼
API Routes (/api/dashboard, /api/dune, /api/signals, etc.)
        │
        ▼
Client Libraries (Tally, Safe, Dune, Discourse, CoinGecko, Calendar)
        │
        ▼
External APIs & Blockchain (Tally.xyz, Dune Analytics, Ethereum, Google Calendar)
```

The dashboard homepage (`WorldMonitorClient`) uses dynamic imports and code splitting — each widget loads and fetches data independently, so the UI renders instantly with skeletons while data streams in.

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.15.0

### Installation

```bash
git clone https://github.com/estmcmxci/ens-pulse.git
cd ens-pulse
pnpm install
cp .env.example .env
```

### Environment Variables

```env
# Governance
TALLY_API_KEY=              # Required: Governance data from Tally.xyz

# Analytics
DUNE_API_KEY=               # Required: Dune Analytics API key

# Blockchain
NEXT_PUBLIC_ALCHEMY_URL=    # Required: Ethereum RPC endpoint

# Market Data
COINGECKO_API_KEY=          # Optional: Higher rate limits

# Feeds
TWITTER_BEARER_TOKEN=       # Optional: Social feed
ANTHROPIC_API_KEY=          # Optional: AI summaries
DISCOURSE_API_KEY=          # Optional: Higher rate limits for Discourse

# Calendar
GOOGLE_SERVICE_ACCOUNT_EMAIL=  # Optional
GOOGLE_PRIVATE_KEY=            # Optional

# Safe
SAFE_API_KEY=               # Optional: Safe multisig API
```

### Development

```bash
# Start the dashboard
pnpm dashboard

# Or run all apps
pnpm dev
```

Dashboard runs at `http://localhost:3000`.

### Build

```bash
pnpm build
```

## Project Structure

```
ens-pulse/
├── apps/
│   ├── dashboard/
│   │   ├── app/                    # Next.js app router
│   │   │   ├── api/                # API routes (dashboard, dune, signals)
│   │   │   ├── WorldMonitorClient  # Homepage widget grid
│   │   │   └── [pages]/            # governance, treasury, delegates, etc.
│   │   ├── features/
│   │   │   ├── dashboard/          # Homepage widgets (14+)
│   │   │   ├── governance/         # Governance components
│   │   │   ├── treasury/           # Treasury components
│   │   │   ├── delegates/          # Delegate components
│   │   │   ├── external-context/   # Meetings, feeds
│   │   │   ├── newsletter/         # Newsletter archive
│   │   │   └── historical-context/ # Historical metrics
│   │   └── shared/
│   │       ├── components/         # Navbar, Widget, Card, Badge
│   │       ├── hooks/              # SWR data hooks
│   │       ├── lib/                # API clients, formatters, data utils
│   │       ├── config/             # Dune queries, multisig addresses
│   │       └── types/              # TypeScript types
│   └── indexer/                    # Ponder blockchain indexer
└── packages/
    └── shared/                     # Shared types and utilities
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Live dashboard with hero overlay and widget grid |
| `/governance` | Proposals, voting, and governance stats |
| `/treasury` | Multisig wallets and treasury overview |
| `/delegates` | Delegate leaderboard and analytics |
| `/context` | External signals and upcoming meetings |
| `/newsletter` | Newsletter archive search |
| `/historical` | Historical protocol metrics |
| `/settings` | User preferences |

## Dashboard Widgets

The homepage renders these widgets with independent data fetching:

| Widget | Data Source |
|--------|------------|
| ETH/ENS Price | CoinGecko |
| Total Assets | Safe + CoinGecko |
| Active Proposals | Tally |
| Top Delegates | Tally |
| Attack Profitability | Tally + CoinGecko |
| Protocol Metrics (ENS Stats) | Dune Analytics |
| Protocol Metrics (Financials) | Dune Analytics |
| Treasury | Safe |
| Calendar | Google Calendar |
| Forum Feed | Discourse |
| Social Feed | X/Twitter |
| Signals Ticker | Editorial pipeline |

## Data Sources

- **Tally.xyz** — Governance proposals, delegates, voting power
- **Dune Analytics** — Protocol metrics, financials, ENS stats
- **Safe** — Multisig wallet balances and transactions
- **CoinGecko** — Token prices and market data
- **Discourse** — ENS Forum discussions
- **X/Twitter** — Social signals
- **Google Calendar** — ENS DAO meetings

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Data Fetching:** SWR (client-side, parallel, cached)
- **Blockchain:** Viem
- **Indexing:** Ponder
- **Monorepo:** Turborepo, pnpm workspaces
- **TypeScript:** 5.7

## License

This project is private and proprietary.

---

Built for the ENS DAO community to improve governance transparency and decision-making.
