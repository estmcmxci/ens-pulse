# ENS Pulse Codebase Navigation

> **Purpose:** Complete map of the codebase → UI relationship for continuing development in new sessions.

---

## Quick Start

```bash
cd apps/dashboard
pnpm install
pnpm dev          # Starts on :3000
```

**Required Environment Variables:**
```env
TALLY_API_KEY=           # Governance data from Tally.xyz
DUNE_API_KEY=            # Analytics from Dune
ANTHROPIC_API_KEY=       # AI summaries for feeds (optional)
TWITTER_BEARER_TOKEN=    # Social feed (optional)
NEXT_PUBLIC_ALCHEMY_URL= # Ethereum RPC
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         UI LAYER                            │
│  app/page.tsx (Dashboard) + app/*/page.tsx (Sub-pages)      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      HOOKS LAYER                            │
│  shared/hooks/use-api-data.ts (SWR hooks for all data)      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     API ROUTES                              │
│  app/api/**/*.ts (Next.js API routes)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   CLIENT LIBRARIES                          │
│  shared/lib/* (Tally, Safe, Dune, Discourse, Twitter, etc.) │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   EXTERNAL APIS                             │
│  Tally.xyz | Dune Analytics | Discourse | Twitter | etc.    │
└─────────────────────────────────────────────────────────────┘
```

---

## Pages & Routes

| Route | File | Description | Key Components |
|-------|------|-------------|----------------|
| `/` | `app/page.tsx` | **Main Dashboard** - Single-page monitor | 14 widgets (see below) |
| `/governance` | `app/governance/page.tsx` | Proposals & voting | GovernanceOverview, GovernanceStats, HistoricalContext |
| `/treasury` | `app/treasury/page.tsx` | Multisig wallets | TreasuryOverview, PendingTransactions |
| `/delegates` | `app/delegates/page.tsx` | Delegate leaderboard | DelegateHighlights, searchable table |
| `/context` | `app/context/page.tsx` | External signals | ExternalContextPanel, UpcomingMeetings, ProtocolHealthWidget |
| `/newsletter` | `app/newsletter/page.tsx` | Archive search | NewsletterSearch |
| `/historical` | `app/historical/page.tsx` | Historical context | HistoricalContext |
| `/custom` | `app/custom/page.tsx` | Customizable layout | Drag-and-drop widgets |
| `/settings` | `app/settings/page.tsx` | User preferences | Settings form |

---

## Main Dashboard Widgets (`app/page.tsx`)

The dashboard is a single-page monitor with **14 widgets** in a grid layout:

### Row 1: Market Data (3 columns)
| Widget | Hook | API Endpoint | Data Source |
|--------|------|--------------|-------------|
| `PriceWidget (ETH)` | `useMarketData()` | `/api/context/market` | CoinGecko |
| `PriceWidget (ENS)` | `useMarketData()` | `/api/context/market` | CoinGecko |
| `GasWidget` | `useGasPrices()` | `/api/context/gas` | Etherscan |

### Row 2: Governance (4 columns)
| Widget | Hook | API Endpoint | Data Source |
|--------|------|--------------|-------------|
| `ActiveProposalsWidget` | `useProposals()` | `/api/governance/proposals` | Tally GraphQL |
| `DelegatesWidget` | `useDelegates()` | `/api/governance/delegates` | Tally GraphQL |

### Row 3: Attack Analysis (full width)
| Widget | Hook | API Endpoint | Data Source |
|--------|------|--------------|-------------|
| `AttackAnalysisWidget` | Multiple | Treasury + Market + Delegates | Calculated |

### Row 4: Protocol Stats (4 columns)
| Widget | Hook | API Endpoint | Data Source |
|--------|------|--------------|-------------|
| `ENSStatsWidget` | `useEnsStats()` | `/api/dune/ens-stats` | Dune Analytics |
| `FinancialsWidget` | `useFinancials()` | `/api/dune/financials` | Dune (Steakhouse) |

### Row 5: Treasury & Meetings (2 columns)
| Widget | Hook | API Endpoint | Data Source |
|--------|------|--------------|-------------|
| `TreasuryWidget` | `useTreasuryOverview()` | `/api/treasury/overview` | On-chain (viem) |
| `MeetingsWidget` | `useUpcomingMeetings()` | `/api/calendar/meetings` | Google Calendar |

### Row 6: News & Health (2 columns)
| Widget | Hook | API Endpoint | Data Source |
|--------|------|--------------|-------------|
| `NewsWidget` | `useNews()` | `/api/context/news` | RSS Feeds |
| `HealthWidget` | `useProtocolHealth()` + `useInfraStatus()` | `/api/context/protocol` + `/api/context/status` | ENS Node + Cloudflare |

### Row 7: Social Feeds (2 columns) **[NEW]**
| Widget | Hook | API Endpoint | Data Source |
|--------|------|--------------|-------------|
| `DiscourseFeedWidget` | `useDiscourseFeed()` | `/api/feeds/discourse` | discuss.ens.domains |
| `SocialFeedWidget` | `useSocialFeed()` | `/api/feeds/social` | Twitter/X API |

---

## API Routes

### Governance (`/api/governance/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/governance/proposals` | GET | Fetch proposals from Tally |
| `/api/governance/delegates` | GET | Fetch delegates from Tally |

### Treasury (`/api/treasury/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/treasury/overview` | GET | All multisig balances (on-chain via viem) |
| `/api/treasury/[address]` | GET | Single multisig data |
| `/api/treasury/pending` | GET | Pending transactions (if Safe API configured) |

### Context (`/api/context/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/context/market` | GET | ETH, ENS, BTC prices (CoinGecko) |
| `/api/context/gas` | GET | Gas prices (Etherscan) |
| `/api/context/news` | GET | RSS feed aggregation |
| `/api/context/protocol` | GET | ENS Node health |
| `/api/context/status` | GET | Cloudflare status |
| `/api/context/historical` | GET | Historical context for proposals |

### Dune Analytics (`/api/dune/`)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/dune/[queryId]` | GET | Generic Dune query results |
| `/api/dune/ens-stats` | GET | ENS protocol statistics |
| `/api/dune/financials` | GET | Revenue & treasury (Steakhouse queries) |

### Feeds (`/api/feeds/`) **[NEW]**
| Route | Method | Description |
|-------|--------|-------------|
| `/api/feeds/discourse` | GET | Forum topics with AI summaries |
| `/api/feeds/social` | GET | Twitter posts with AI summaries |

### Other
| Route | Method | Description |
|-------|--------|-------------|
| `/api/calendar/meetings` | GET | Working group meetings |
| `/api/newsletter/search` | GET | Full-text newsletter search |
| `/api/settings` | GET/POST | User preferences |
| `/api/cron/snapshot-ens-stats` | GET | Cron job for stats snapshots |

---

## Data Fetching Hooks (`shared/hooks/use-api-data.ts`)

All hooks use SWR with appropriate refresh intervals:

```typescript
// Treasury
useTreasuryOverview()      // 5min refresh
useTreasuryAddress(addr)   // 5min refresh
usePendingTransactions()   // 2min refresh

// Market
useMarketData()            // 5min refresh
useGasPrices()             // 1min refresh

// Governance
useProposals(status?, limit)  // 1min refresh
useDelegates(limit)           // 5min refresh

// Protocol
useProtocolHealth()        // 1min refresh
useInfraStatus()           // 5min refresh

// News & Feeds
useNews(category?, limit)  // 15min refresh
useDiscourseFeed(limit)    // 15min refresh  [NEW]
useSocialFeed(limit)       // 5min refresh   [NEW]

// Analytics
useEnsStats()              // 1hr refresh
useFinancials()            // 1hr refresh
useDuneQuery(queryId)      // 1hr refresh

// Context
useHistoricalContext(proposalId)  // 5min refresh
useUpcomingMeetings()             // 5min refresh
```

---

## Client Libraries (`shared/lib/`)

### External API Clients
| File | Purpose | External Service |
|------|---------|------------------|
| `tally/client.ts` | GraphQL client for governance | api.tally.xyz |
| `safe/client.ts` | On-chain multisig data | Ethereum RPC (viem) |
| `dune/client.ts` | Analytics queries | api.dune.com |
| `market/client.ts` | Price data | CoinGecko |
| `ensnode/client.ts` | Protocol health | ENS Node API |
| `calendar/client.ts` | Meeting schedules | Google Calendar |

### Feed Clients **[NEW]**
| File | Purpose | External Service |
|------|---------|------------------|
| `feeds/discourse-client.ts` | Forum topics | discuss.ens.domains |
| `feeds/social-client.ts` | Twitter posts | Twitter API v2 |
| `feeds/summarizer.ts` | AI summaries | Anthropic Claude |
| `feeds/cache.ts` | In-memory cache | Local |
| `feeds/types.ts` | Type definitions | — |

### Utilities
| File | Purpose |
|------|---------|
| `utils.ts` | Formatting, classnames |
| `db/client.ts` | PostgreSQL (stats snapshots) |
| `cache/treasury-cache.ts` | Treasury data caching |

---

## Configuration Files (`shared/config/`)

### `multisigs.ts`
Defines **17 ENS wallet addresses**:
- DAO Wallet, Controller, Legacy Controller
- Endowment
- Ecosystem WG (7 wallets)
- Metagov WG (4 wallets)
- Public Goods WG (2 wallets)

### `dune-queries.ts`
Defines **30+ Dune query IDs** for:
- Governance (quorum, risk, proposals)
- Delegates (voting power, concentration)
- Treasury (revenue, balances)
- Registrations (totals, monthly trends)
- Steakhouse financials

### `feeds.ts`
Defines **8 RSS feed URLs**:
- ENS Newsletter (Forum + Paragraph)
- ENS Blog
- ICANN News, CircleID
- Ethereum Blog, Vitalik's Blog
- SEC Press Releases

### `ens.ts`
ENS protocol constants:
- Contract addresses (Governor, Token, Registry)
- Governance settings (voting delay, quorum)
- External links

### `calendars.ts`
Google Calendar IDs for Working Groups.

---

## UI Components

### Widgets (`shared/components/widgets/`)
| Component | Description |
|-----------|-------------|
| `Widget` | Base container with header/content |
| `PriceCard` | Price display with sparkline |
| `ProposalCard` | Proposal summary card |
| `TreasuryWidget` | Balance breakdown table |
| `ProtocolHealthWidget` | Status indicators |
| `LiveWidgets` | Real-time updating container |

### UI Primitives (`shared/components/ui/`)
| Component | Based On |
|-----------|----------|
| `Badge` | Custom variants (ens, success, warning, etc.) |
| `Button` | Radix + CVA |
| `Card` | Custom with header/content slots |

### Feature Components (`features/*/components/`)
| Directory | Components |
|-----------|------------|
| `governance/` | GovernanceOverview, GovernanceStats |
| `treasury/` | TreasuryOverview |
| `delegates/` | DelegateHighlights |
| `external-context/` | ExternalContextPanel, UpcomingMeetings |
| `historical-context/` | HistoricalContext |
| `newsletter/` | NewsletterSearch |

---

## Data Flow Examples

### Dashboard → Governance Data
```
app/page.tsx
  └─ ActiveProposalsWidget
       └─ useProposals() hook
            └─ fetch('/api/governance/proposals')
                 └─ app/api/governance/proposals/route.ts
                      └─ fetchTallyProposals()
                           └─ shared/lib/tally/client.ts
                                └─ POST api.tally.xyz/query
```

### Dashboard → Discourse Feed **[NEW]**
```
app/page.tsx
  └─ DiscourseFeedWidget
       └─ useDiscourseFeed() hook
            └─ fetch('/api/feeds/discourse')
                 └─ app/api/feeds/discourse/route.ts
                      └─ fetchDiscourseTopics()
                           └─ shared/lib/feeds/discourse-client.ts
                                └─ GET discuss.ens.domains/c/*.json
                      └─ summarize() [optional]
                           └─ shared/lib/feeds/summarizer.ts
                                └─ Anthropic Claude API
```

### Dashboard → Treasury Data
```
app/page.tsx
  └─ TreasuryWidget
       └─ useTreasuryOverview() hook
            └─ fetch('/api/treasury/overview')
                 └─ app/api/treasury/overview/route.ts
                      └─ fetchAllMultisigsData()
                           └─ shared/lib/safe/client.ts
                                └─ viem multicall (on-chain reads)
```

---

## State Management

- **Server State:** SWR (stale-while-revalidate) via `use-api-data.ts`
- **Client State:** React Query (TanStack Query) for sub-pages
- **Global State:** Zustand (configured but minimal use)
- **Providers:** `app/providers.tsx` wraps with QueryClientProvider

---

## Styling

- **Framework:** Tailwind CSS v4
- **Theme:** Dark mode only (`html.dark`)
- **CSS Variables:** Defined in `globals.css`
  - `--color-bg-base`, `--color-bg-elevated`, `--color-bg-overlay`
  - `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
  - `--color-ens-blue`, `--color-ens-purple`
  - `--color-positive`, `--color-negative`, `--color-warning`
- **Utilities:** `cn()` from `shared/lib/utils.ts` for classname merging

---

## Development Notes

### Adding a New Widget
1. Create component in `app/page.tsx` or extract to `shared/components/widgets/`
2. Add hook in `shared/hooks/use-api-data.ts` if new data source
3. Create API route in `app/api/` if new endpoint needed
4. Add client library in `shared/lib/` if new external service

### Adding a New Data Source
1. Create client in `shared/lib/<source>/client.ts`
2. Add API route in `app/api/<category>/route.ts`
3. Export hook from `shared/hooks/use-api-data.ts`
4. Add to widget(s) in dashboard

### Adding a New Page
1. Create `app/<route>/page.tsx`
2. Add to navigation in `shared/components/Sidebar.tsx`
3. Import feature components from `features/` or create new

---

## Known Issues / TODOs

1. **Social Feed** requires `TWITTER_BEARER_TOKEN` - returns empty without it
2. **Calendar API** needs Google Service Account setup
3. **Newsletter Search** needs PostgreSQL database for full-text search
4. **Treasury History Chart** placeholder (not implemented)
5. **Governance Analytics Chart** placeholder (not implemented)
6. Some stats in Treasury/Delegates pages are hardcoded placeholders

---

## File Line Counts

```
shared/hooks/use-api-data.ts    547 lines  # All SWR hooks
app/page.tsx                   1318 lines  # Main dashboard
shared/lib/tally/client.ts      430 lines  # Tally GraphQL
shared/lib/safe/client.ts       319 lines  # On-chain reads
shared/lib/dune/client.ts       ~200 lines # Dune queries
shared/lib/feeds/              711 lines  # Discourse + Twitter + AI
```

---

## Quick Reference

### Start Development
```bash
pnpm dev
```

### Test API Endpoints
```bash
curl http://localhost:3000/api/feeds/discourse?limit=3
curl http://localhost:3000/api/governance/proposals?limit=5
curl http://localhost:3000/api/treasury/overview
curl http://localhost:3000/api/dune/ens-stats
```

### Build for Production
```bash
pnpm build
pnpm start
```

---

*Last updated: 2026-01-21*
