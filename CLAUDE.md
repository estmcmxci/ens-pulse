# ENS Pulse

## Project Overview

A unified governance intelligence dashboard for ENS Protocol participants that combines on-chain governance data with real-world context signals. Built as a fork of Anticapture, focused exclusively on ENS DAO.

**Core Value:** "Never vote on a proposal without understanding the world it exists in."

## Architecture

### Monorepo Structure

- `apps/dashboard` — Next.js 15 frontend (App Router)
- `apps/indexer` — Ponder blockchain event indexer
- `packages/shared` — Shared types and utilities

### Key Technologies

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Radix UI
- **Data:** Apollo Client, TanStack Query, Zustand
- **Blockchain:** viem, wagmi, Ponder
- **Database:** PostgreSQL 16, Drizzle ORM
- **APIs:** Hono, GraphQL

## Data Sources

### On-Chain (Ponder Indexer)
- ENS Governor contract (proposals, votes)
- ENS Token contract (balances, delegation)
- Real-time block-level updates

### External APIs
- **Safe API Kit:** 11 ENS multisig wallets
- **Dune Analytics:** Governance metrics (daily refresh)
- **Google Calendar:** Working Group meeting schedules
- **CoinGecko:** ETH, ENS, BTC prices
- **Cloudflare:** Status API

### RSS Feeds
- ENS DAO Newsletter (discuss.ens.domains, paragraph.xyz)
- ENS Blog (via rss.app)
- ICANN news
- Regulatory feeds

## Key Configurations

### ENS Multisig Addresses
Located in `apps/dashboard/shared/config/multisigs.ts`:

```typescript
export const ENS_MULTISIGS = {
  DAO_WALLET: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
  ECOSYSTEM_1: "0x2686A8919Df194aA7673244549E68D42C1685d03",
  ECOSYSTEM_2: "0x536013c57DAF01D78e8a70cAd1B1abAda9411819",
  ECOSYSTEM_3: "0x9B9c249Be04dd433c7e8FbBF5E61E6741b89966D",
  ECOSYSTEM_4: "0x13aEe52C1C688d3554a15556c5353cb0c3696ea2",
  METAGOV_1: "0x91c32893216dE3eA0a55ABb9851f581d4503d39b",
  METAGOV_2: "0xB162Bf7A7fD64eF32b787719335d06B2780e31D1",
  PUBLIC_GOODS_1: "0xcD42b4c4D102cc22864e3A1341Bb0529c17fD87d",
  PUBLIC_GOODS_2: "0xebA76C907F02BA13064EDAD7876Fe51D9d856F62",
};
```

### Google Calendar IDs
Located in `apps/dashboard/shared/config/calendars.ts`:
- Metagov WG, Ecosystem WG, Public Goods WG meeting calendars
- IDs to be obtained from ENS DAO

### Dune Query IDs
Located in `apps/dashboard/shared/config/dune-queries.ts`:
- Extract from avsa/governancerisk, kpk/ens-dao-governance, ethereumnameservice/ens
- Known query: 3522362

### RSS Feed URLs
Located in `apps/dashboard/shared/config/feeds.ts`:

```typescript
export const RSS_FEEDS = {
  NEWSLETTER_FORUM: "https://discuss.ens.domains/c/dao-wide/newsletter/72.rss",
  NEWSLETTER_PARAGRAPH: "https://paragraph.xyz/@ensdao/feed.xml",
  ICANN_NEWS: "https://www.icann.org/news/rss",
};
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development
pnpm dashboard dev     # Frontend on :3000
pnpm indexer dev       # Indexer on :42069

# Build
pnpm build

# Lint and format
pnpm lint
pnpm typecheck
```

## Feature Areas

### 1. Governance (`features/governance/`)
- Proposal list with status, voting bars
- Individual proposal detail with historical context
- Reused from Anticapture with ENS customization

### 2. Treasury (`features/treasury/`)
- Real-time multisig balances via Safe API
- Pending transaction alerts
- Historical treasury snapshots

### 3. External Context (`features/external-context/`)
- Aggregated news feeds (ICANN, regulatory, crypto)
- Market data (prices, gas)
- Infrastructure status (Cloudflare)

### 4. Historical Context (`features/historical-context/`)
- Proposal-linked: World state when created vs. now
- Treasury time-series: Value at key decision points

### 5. Delegates (`features/delegates/`)
- Voting power rankings
- Delegation patterns
- Reused from Anticapture

### 6. Newsletter Archive (`features/newsletter/`)
- Full-text search across 90+ newsletters
- Cross-reference with proposals

## API Integration Patterns

### Dune SDK
```typescript
import { DuneClient } from "@duneanalytics/client-sdk";
const client = new DuneClient(process.env.DUNE_API_KEY!);
const result = await client.runQuery({ queryId: QUERY_ID });
```

### Safe API Kit
```typescript
import SafeApiKit from "@safe-global/api-kit";
const apiKit = new SafeApiKit({ chainId: 1n, apiKey: API_KEY });
const info = await apiKit.getSafeInfo(address);
```

### RSS Parsing
```typescript
import Parser from "rss-parser";
const parser = new Parser();
const feed = await parser.parseURL(feedUrl);
```

## Database Schema

Key tables in Ponder schema:
- `proposals_onchain` — Governance proposals
- `votes_onchain` — Individual votes
- `account_power` — Voting power per account
- `delegation` — Delegation records
- `treasury_snapshot` — Historical treasury state (new)
- `proposal_context` — World state at proposal creation (new)
- `newsletter_archive` — Searchable newsletter content (new)

## Environment Variables

Required in `.env`:

```env
# APIs
DUNE_API_KEY=              # Dune Analytics API key
SAFE_API_KEY=              # Safe Global API key
COINGECKO_API_KEY=         # Price data

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# Database
DATABASE_URL=              # PostgreSQL connection

# Frontend
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=
NEXT_PUBLIC_ALCHEMY_KEY=   # Ethereum RPC
```

## Conventions

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `use-kebab-case.ts`
- Utils: `kebab-case.ts`
- Types: `types.ts` in feature directory

### Code Style
- ESLint + Prettier enforced
- Conventional commits required
- TypeScript strict mode

### Component Structure
```typescript
// Feature component example
// apps/dashboard/features/treasury/components/MultisigCard.tsx

interface MultisigCardProps {
  address: string;
  name: string;
}

export function MultisigCard({ address, name }: MultisigCardProps) {
  // Implementation
}
```

## API Routes Structure

```
/api/
├── governance/
│   ├── proposals/route.ts    # GET active proposals
│   └── delegates/route.ts    # GET delegate rankings
├── treasury/
│   ├── overview/route.ts     # GET all multisig balances
│   ├── [address]/route.ts    # GET single multisig
│   └── pending/route.ts      # GET pending transactions
├── calendar/
│   └── meetings/route.ts     # GET upcoming WG meetings
├── context/
│   ├── market/route.ts       # GET prices
│   ├── gas/route.ts          # GET gas prices
│   ├── news/route.ts         # GET RSS feeds
│   └── status/route.ts       # GET infrastructure status
├── dune/
│   └── [queryId]/route.ts    # GET Dune query results
└── newsletter/
    └── search/route.ts       # GET full-text search
```

## Testing Strategy

1. **Unit Tests:** Vitest for utility functions and hooks
2. **Component Tests:** React Testing Library for UI components
3. **Integration Tests:** Playwright for critical user flows
4. **API Tests:** Mock external APIs, test route handlers

## Deployment

- **Frontend:** Vercel (automatic deploys from main branch)
- **Indexer:** Railway (Docker container)
- **Database:** Railway PostgreSQL

## Related Documentation

- [PRD.md](./PRD.md) — Product Requirements Document
- [EED.md](./EED.md) — Engineering Design Document
- [Anticapture](https://github.com/blockful/anticapture) — Base repository

## MCP Tools

When working on this project, these MCP tools are helpful:
- **Context7 MCP:** Fetch documentation for Next.js, Tailwind, Safe SDK, Dune SDK
- **Playwright MCP:** Visual testing for UI changes

## Common Tasks

### Adding a new RSS feed
1. Add URL to `apps/dashboard/shared/config/feeds.ts`
2. Update feed type in `apps/dashboard/shared/types/feeds.ts`
3. Add to aggregation in `/api/context/news/route.ts`

### Adding a new multisig
1. Add address to `apps/dashboard/shared/config/multisigs.ts`
2. Update type definitions
3. Treasury overview will automatically include it

### Running a new Dune query
1. Add query ID to `apps/dashboard/shared/config/dune-queries.ts`
2. Create handler in `/api/dune/[queryId]/route.ts` if needed
3. Add caching strategy based on query refresh needs
