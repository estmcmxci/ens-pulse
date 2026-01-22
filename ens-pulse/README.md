# ENS Pulse

> **ENS Governance Intelligence Dashboard** - A comprehensive dashboard for monitoring ENS DAO governance, treasury, delegates, and protocol health.

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Turbo](https://img.shields.io/badge/Turbo-2.3-black)](https://turbo.build/)

## Overview

ENS Pulse is a real-time dashboard that aggregates and visualizes critical data about the Ethereum Name Service (ENS) DAO. It provides insights into governance proposals, treasury management, delegate activity, protocol metrics, and external context signals.

### Key Features

- 📊 **Live Dashboard** - Real-time monitoring with 14+ widgets covering market data, governance, treasury, and protocol health
- 🗳️ **Governance Tracking** - Active proposals, voting status, and delegate performance
- 💰 **Treasury Management** - Multisig wallet balances, pending transactions, and asset composition
- 👥 **Delegate Analytics** - Leaderboard, voting power distribution, and delegate highlights
- 📰 **Context Feeds** - Discourse discussions, social media signals, and newsletter archive
- 📅 **Calendar Integration** - Upcoming ENS DAO meetings and working group events
- 📈 **Historical Analysis** - Protocol metrics over time and historical context
- ⚙️ **Customizable Layout** - Drag-and-drop widget configuration

## Architecture

This is a **monorepo** built with:

- **Dashboard** (`apps/dashboard`) - Next.js 15 web application
- **Indexer** (`apps/indexer`) - Ponder-based blockchain event indexer
- **Shared** (`packages/shared`) - Shared TypeScript types and utilities

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Dashboard                        │
│  (React 19, TypeScript, Tailwind CSS, SWR)                │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    API Routes Layer                         │
│  /api/governance | /api/treasury | /api/context | etc.     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  Client Libraries                           │
│  Tally | Safe | Dune | Discourse | Twitter | Calendar      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              External APIs & Blockchain                      │
│  Tally.xyz | Dune Analytics | Ethereum | Google Calendar   │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.15.0
- PostgreSQL (optional, for caching)

### Installation

```bash
# Clone the repository
git clone https://github.com/estmcmxci/ens-pulse.git
cd ens-pulse

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Governance
TALLY_API_KEY=              # Required: Governance data from Tally.xyz

# Analytics
DUNE_API_KEY=               # Required: Dune Analytics API key

# Blockchain
NEXT_PUBLIC_ALCHEMY_URL=    # Required: Ethereum RPC endpoint
ALCHEMY_API_KEY=            # Optional: For indexer
ETHERSCAN_API_KEY=          # Optional: Gas price oracle

# Market Data
COINGECKO_API_KEY=          # Optional: Higher rate limits

# Feeds (Optional)
TWITTER_BEARER_TOKEN=       # Social feed
ANTHROPIC_API_KEY=          # AI summaries for feeds
DISCOURSE_API_KEY=          # Higher rate limits for Discourse

# Calendar (Optional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# Database (Optional)
DATABASE_URL=               # PostgreSQL connection string

# Safe (Optional)
SAFE_API_KEY=               # Safe multisig API
```

### Development

```bash
# Start the dashboard
pnpm dev

# Or run specific apps
pnpm dashboard dev          # Dashboard only
pnpm indexer dev            # Indexer only
```

The dashboard will be available at `http://localhost:3000`

### Build

```bash
# Build all apps
pnpm build

# Build dashboard for production
pnpm dashboard build
pnpm dashboard start
```

## Project Structure

```
ens-pulse/
├── apps/
│   ├── dashboard/          # Next.js dashboard application
│   │   ├── app/            # Next.js app router pages & API routes
│   │   ├── features/       # Feature-specific components
│   │   └── shared/        # Shared components, hooks, libs
│   └── indexer/           # Ponder blockchain indexer
├── packages/
│   └── shared/            # Shared TypeScript types
└── scripts/               # Utility scripts
```

## Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Main dashboard with live widgets |
| `/governance` | Proposals, voting, and governance stats |
| `/treasury` | Multisig wallets and treasury overview |
| `/delegates` | Delegate leaderboard and analytics |
| `/context` | External signals and upcoming meetings |
| `/newsletter` | Newsletter archive search |
| `/historical` | Historical protocol metrics |
| `/custom` | Customizable widget layout |
| `/settings` | User preferences |

## Data Sources

- **Tally.xyz** - Governance proposals and delegate data
- **Dune Analytics** - Protocol metrics and financial data
- **Safe** - Multisig wallet balances and transactions
- **CoinGecko** - Token prices and market data
- **Etherscan** - Gas prices and blockchain data
- **Discourse** - Community discussions
- **Twitter/X** - Social signals
- **Google Calendar** - ENS DAO meetings

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS 4, Radix UI
- **State:** SWR, Zustand
- **Blockchain:** Viem, Wagmi
- **Indexing:** Ponder
- **Monorepo:** Turborepo, pnpm workspaces
- **Type Safety:** TypeScript 5.7

## Development Workflow

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Clean build artifacts
pnpm clean
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Acknowledgments

Built for the ENS DAO community to improve governance transparency and decision-making.

---

**Note:** This dashboard requires API keys for various services. See `.env.example` for required configuration.
