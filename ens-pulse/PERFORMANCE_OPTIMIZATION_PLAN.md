# ENS Pulse Performance Optimization Plan

> Vercel React Best Practices Review - January 2026

## Overview

This document outlines performance optimizations for the ENS Pulse dashboard based on Vercel's React and Next.js best practices. Optimizations are prioritized by impact and organized into implementation phases.

---

## Table of Contents

1. [Critical Issues](#critical-issues)
2. [High Priority Issues](#high-priority-issues)
3. [Medium Priority Issues](#medium-priority-issues)
4. [Implementation Phases](#implementation-phases)
5. [Code Examples](#code-examples)
6. [Verification Checklist](#verification-checklist)

---

## Critical Issues

### 1. Large Client Bundle (bundle-dynamic-imports)

**Location:** `apps/dashboard/app/page.tsx`

**Problem:** The entire 1,510-line page is marked `"use client"`, creating a large JavaScript bundle that must be downloaded and parsed before any interactivity.

**Impact:** Slower First Contentful Paint (FCP) and Time to Interactive (TTI)

**Solution:** Split widgets into separate files and use `next/dynamic` for code splitting.

```tsx
// Before
"use client";
// ... 1500+ lines of components

// After
import dynamic from 'next/dynamic';

const AttackAnalysisWidget = dynamic(
  () => import('@/features/dashboard/AttackAnalysisWidget'),
  { loading: () => <WidgetSkeleton /> }
);
```

**Files to create:**
- `apps/dashboard/features/dashboard/AttackAnalysisWidget.tsx`
- `apps/dashboard/features/dashboard/DelegatesWidget.tsx`
- `apps/dashboard/features/dashboard/ProposalsWidget.tsx`
- `apps/dashboard/features/dashboard/TreasuryWidget.tsx`
- `apps/dashboard/features/dashboard/ENSStatsGrid.tsx`
- `apps/dashboard/features/dashboard/FinancialsGrid.tsx`
- `apps/dashboard/features/dashboard/MeetingsWidget.tsx`
- `apps/dashboard/features/dashboard/DiscourseFeedWidget.tsx`
- `apps/dashboard/features/dashboard/SocialFeedWidget.tsx`
- `apps/dashboard/features/dashboard/SignalsTicker.tsx`
- `apps/dashboard/features/dashboard/PriceWidget.tsx`
- `apps/dashboard/features/dashboard/WidgetSkeleton.tsx`

---

### 2. Client-Side Request Waterfalls (async-parallel)

**Location:** `apps/dashboard/app/page.tsx:671-676`

**Problem:** Multiple SWR hooks in the same component trigger separate client-side requests that could be parallelized or batched.

```tsx
// Current: 4 separate requests
const { data: treasuryData } = useTreasuryOverview();
const { data: marketData } = useMarketData();
const { data: delegatesData } = useDelegates(1);
const { data: financialsData } = useFinancials();
```

**Solution A:** Create an aggregated API endpoint:

```tsx
// apps/dashboard/app/api/dashboard/attack-analysis/route.ts
export async function GET() {
  const [treasury, market, delegates, financials] = await Promise.all([
    fetchTreasuryOverview(),
    fetchMarketData(),
    fetchDelegates(1),
    fetchFinancials(),
  ]);

  return NextResponse.json({
    success: true,
    data: { treasury, market, delegates, financials }
  });
}
```

**Solution B:** Use SWR's parallel fetching pattern:

```tsx
// apps/dashboard/shared/hooks/use-attack-analysis-data.ts
export function useAttackAnalysisData() {
  const { data, error, isLoading } = useSWR(
    '/api/dashboard/attack-analysis',
    fetcher,
    { refreshInterval: 300000 }
  );
  return { data, error, isLoading };
}
```

---

### 3. Barrel File Imports (bundle-barrel-imports)

**Location:** `apps/dashboard/app/page.tsx:6-24`

**Problem:** Importing from barrel files (`index.ts`) can prevent tree-shaking.

```tsx
// Before
import { Widget, WidgetHeader, WidgetTitle, WidgetContent } from "@/shared/components/widgets";
import { useTreasuryOverview, useMarketData, ... } from "@/shared/hooks/use-api-data";

// After
import { Widget } from "@/shared/components/widgets/Widget";
import { WidgetHeader, WidgetTitle, WidgetContent } from "@/shared/components/widgets/Widget";
import { useTreasuryOverview } from "@/shared/hooks/treasury";
import { useMarketData } from "@/shared/hooks/market";
```

**Recommended Structure:**
```
shared/hooks/
├── treasury.ts      # useTreasuryOverview, useTreasuryAddress, usePendingTransactions
├── market.ts        # useMarketData
├── governance.ts    # useProposals, useDelegates
├── feeds.ts         # useDiscourseFeed, useSocialFeed, useNewsletter
├── dune.ts          # useEnsStats, useFinancials, useDuneQuery
├── calendar.ts      # useUpcomingMeetings
├── protocol.ts      # useProtocolHealth, useGasPrices
└── index.ts         # Re-exports (optional, for convenience)
```

---

### 4. Missing Suspense Boundaries (async-suspense-boundaries)

**Location:** `apps/dashboard/app/page.tsx`

**Problem:** No Suspense boundaries means all widgets load/fail together.

**Solution:**

```tsx
import { Suspense } from 'react';

export default function WorldMonitor() {
  return (
    <div className="space-y-3 pb-10">
      <Header />

      <div className="grid grid-cols-3 gap-3">
        <Suspense fallback={<WidgetSkeleton />}>
          <PriceWidget symbol="ETH" />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <PriceWidget symbol="ENS" />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <TotalAssetsWidget />
        </Suspense>
      </div>

      {/* Group related widgets in shared boundaries */}
      <Suspense fallback={<WidgetSkeleton className="col-span-4" />}>
        <div className="grid grid-cols-4 gap-3">
          <ActiveProposalsWidget />
          <div className="col-span-3">
            <DelegatesWidget />
          </div>
        </div>
      </Suspense>

      {/* ... */}
    </div>
  );
}
```

---

## High Priority Issues

### 5. Server Components Not Utilized (server-parallel-fetching)

**Location:** `apps/dashboard/app/page.tsx:1`

**Problem:** The entire page is a Client Component when initial data could be fetched server-side.

**Solution:** Hybrid Server/Client architecture:

```tsx
// apps/dashboard/app/page.tsx (Server Component)
import { Suspense } from 'react';
import WorldMonitorClient from './WorldMonitorClient';

async function getInitialData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const [market, treasury] = await Promise.all([
    fetch(`${baseUrl}/api/context/market`, { next: { revalidate: 300 } })
      .then(r => r.json()),
    fetch(`${baseUrl}/api/treasury/overview`, { next: { revalidate: 30 } })
      .then(r => r.json()),
  ]);

  return { market: market.data, treasury: treasury.data };
}

export default async function WorldMonitor() {
  const initialData = await getInitialData();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <WorldMonitorClient initialData={initialData} />
    </Suspense>
  );
}
```

```tsx
// apps/dashboard/app/WorldMonitorClient.tsx
"use client";

import { SWRConfig } from 'swr';

export default function WorldMonitorClient({ initialData }) {
  return (
    <SWRConfig value={{
      fallback: {
        '/api/context/market': initialData.market,
        '/api/treasury/overview': initialData.treasury,
      }
    }}>
      {/* Dashboard content */}
    </SWRConfig>
  );
}
```

---

### 6. Missing Request Deduplication (server-cache-react)

**Location:** API routes and shared lib files

**Solution:** Use React's `cache()` for shared data fetching:

```tsx
// apps/dashboard/shared/lib/data/market.ts
import { cache } from 'react';

export const getMarketData = cache(async () => {
  const response = await fetch('https://api.coingecko.com/...');
  return response.json();
});

// Now multiple components can call getMarketData()
// and it will only fetch once per request
```

---

## Medium Priority Issues

### 7. Expensive Re-renders (rerender-memo)

**Location:** `apps/dashboard/app/page.tsx:406-416`

**Problem:** Array sorting runs on every render.

```tsx
// Before
const sortedProposals = [...proposals].sort((a, b) => {
  const activeStates = ["active", "pending", "queued"];
  // ...
});

// After
const sortedProposals = useMemo(() => {
  const activeStates = ["active", "pending", "queued"];
  return [...proposals].sort((a, b) => {
    const aActive = activeStates.includes(a.status);
    const bActive = activeStates.includes(b.status);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}, [proposals]);
```

---

### 8. Helper Functions Inside Components (js-hoist-regexp / rerender optimization)

**Location:** Multiple locations in `apps/dashboard/app/page.tsx`

**Problem:** Functions recreated on every render.

**Solution:** Hoist pure functions to module scope:

```tsx
// apps/dashboard/shared/lib/formatters.ts

export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 30) return `${Math.floor(diffDays / 30)}mo ago`;
  if (diffDays > 0) return `${diffDays}d ago`;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) return `${diffHours}h ago`;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `${diffMins}m ago`;
}

export function formatRangePrice(price: number): string {
  if (price >= 1000) return price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

export function extractSummary(description: string): string {
  if (!description) return "";

  let text = description
    .replace(/^#+\s+.+$/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\|[^\n]+\|/g, "")
    .replace(/[-|]+/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  const abstractMatch = description.match(/##\s*Abstract\s*\n+([\s\S]*?)(?=\n##|\n\n\n|$)/i);
  if (abstractMatch) {
    text = abstractMatch[1]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`]/g, "")
      .replace(/\n+/g, " ")
      .trim();
  }

  if (text.length > 200) {
    text = text.slice(0, 200).trim() + "...";
  }

  return text;
}
```

---

### 9. Inline Calculations in Render (rerender-derived-state)

**Location:** `apps/dashboard/app/page.tsx:431-439`

**Problem:** Vote percentage calculation inside map.

```tsx
// Before
{sortedProposals.map((proposal) => {
  const votes = getVotePercent(proposal); // Called every render
  // ...
})}

// After
const processedProposals = useMemo(() =>
  sortedProposals.map(proposal => ({
    ...proposal,
    votePercent: getVotePercent(proposal),
    isActive: ["active", "pending", "queued"].includes(proposal.status),
  })),
  [sortedProposals]
);
```

---

## Implementation Phases

### Phase 1: Quick Wins (1-2 days)

| Task | File | Impact | Effort |
|------|------|--------|--------|
| Add `useMemo` to sorting operations | `page.tsx` | Medium | Low |
| Hoist formatter functions to module | Create `formatters.ts` | Low | Low |
| Add memoization to vote calculations | `page.tsx` | Medium | Low |
| Configure SWR global deduplication | `providers.tsx` | Medium | Low |

### Phase 2: Component Splitting (3-5 days)

| Task | Files | Impact | Effort |
|------|-------|--------|--------|
| Extract widgets to separate files | `features/dashboard/*.tsx` | High | Medium |
| Implement `next/dynamic` imports | `page.tsx` | High | Medium |
| Create `WidgetSkeleton` component | `components/` | Medium | Low |
| Split hooks into domain files | `hooks/*.ts` | Medium | Medium |

### Phase 3: Server Components (3-5 days)

| Task | Files | Impact | Effort |
|------|-------|--------|--------|
| Create Server Component wrapper | `page.tsx` | High | Medium |
| Implement SWR fallback pattern | `WorldMonitorClient.tsx` | High | Medium |
| Add React `cache()` to data fetching | `lib/data/*.ts` | Medium | Medium |
| Create aggregated API endpoints | `api/dashboard/*.ts` | High | Medium |

### Phase 4: Advanced Optimizations (5-7 days)

| Task | Files | Impact | Effort |
|------|-------|--------|--------|
| Add Suspense boundaries | `page.tsx` | Medium | Medium |
| Implement preloading on hover | Link components | Low | Medium |
| Add `content-visibility` to long lists | `globals.css` | Low | Low |
| Profile and optimize remaining bottlenecks | Various | Variable | High |

---

## Code Examples

### Global SWR Configuration

```tsx
// apps/dashboard/app/providers.tsx
"use client";

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 2000,
        focusThrottleInterval: 5000,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        errorRetryCount: 3,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

### Widget Skeleton Component

```tsx
// apps/dashboard/shared/components/widgets/WidgetSkeleton.tsx
import { cn } from "@/shared/lib/utils";

interface WidgetSkeletonProps {
  className?: string;
  rows?: number;
}

export function WidgetSkeleton({ className, rows = 3 }: WidgetSkeletonProps) {
  return (
    <div className={cn(
      "bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)]",
      "rounded-lg overflow-hidden",
      className
    )}>
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="h-3 w-24 bg-[var(--color-bg-overlay)] rounded animate-pulse" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-[var(--color-bg-overlay)] rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-[var(--color-bg-overlay)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Aggregated Dashboard API

```tsx
// apps/dashboard/app/api/dashboard/overview/route.ts
import { NextResponse } from "next/server";
import { cache } from "react";

export const revalidate = 60;

const fetchAllData = cache(async () => {
  const [market, treasury, proposals, delegates] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/context/market`).then(r => r.json()),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/treasury/overview`).then(r => r.json()),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/governance/proposals?limit=20`).then(r => r.json()),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/governance/delegates?limit=100`).then(r => r.json()),
  ]);

  return {
    market: market.data,
    treasury: treasury.data,
    proposals: proposals.data,
    delegates: delegates.data,
  };
});

export async function GET() {
  try {
    const data = await fetchAllData();

    return NextResponse.json({
      success: true,
      data,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
```

---

## Verification Checklist

After implementing optimizations, verify with these checks:

### Bundle Analysis
```bash
# Generate bundle analysis
npx @next/bundle-analyzer

# Check for:
# - Main bundle size < 200KB (gzipped)
# - No duplicate dependencies
# - Proper code splitting
```

### Performance Metrics
```bash
# Run Lighthouse
npx lighthouse http://localhost:3000 --output html

# Target scores:
# - Performance: > 90
# - First Contentful Paint: < 1.5s
# - Time to Interactive: < 3.5s
# - Largest Contentful Paint: < 2.5s
```

### Network Requests
- [ ] Initial page load makes < 10 API requests
- [ ] Subsequent navigations reuse cached data
- [ ] No duplicate requests for same data
- [ ] API requests are parallelized (check waterfall)

### React DevTools
- [ ] No unnecessary re-renders on data updates
- [ ] Suspense boundaries show loading states
- [ ] Memoized components don't re-render parents

---

## Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Bundle Size (main) | ~450KB | ~180KB | 60% |
| First Contentful Paint | ~2.5s | ~1.2s | 52% |
| Time to Interactive | ~4.5s | ~2.8s | 38% |
| Largest Contentful Paint | ~3.2s | ~1.8s | 44% |
| API Requests (initial) | 12 | 4 | 67% |

---

## Resources

- [Vercel React Best Practices](https://vercel.com/blog/how-to-optimize-your-react-app-for-production)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [SWR Documentation](https://swr.vercel.app/)
- [React Server Components](https://react.dev/reference/react/use-server)
