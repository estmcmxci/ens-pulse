import { cache } from "react";

/**
 * Server-side data fetching with React cache() for request deduplication.
 * These functions can be called multiple times in the same request cycle
 * and will only fetch once.
 */

const getBaseUrl = () => {
  // In server components, we need the full URL
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }
  return "";
};

/**
 * Fetch market data (ETH/ENS prices)
 * Cached per request cycle
 */
export const getMarketData = cache(async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/context/market`, {
    next: { revalidate: 300 }, // 5 minute cache
  });

  if (!response.ok) {
    console.error("Failed to fetch market data");
    return null;
  }

  const json = await response.json();
  return json.success ? json.data : null;
});

/**
 * Fetch treasury overview data
 * Cached per request cycle
 */
export const getTreasuryOverview = cache(async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/treasury/overview`, {
    next: { revalidate: 30 }, // 30 second cache
  });

  if (!response.ok) {
    console.error("Failed to fetch treasury data");
    return null;
  }

  const json = await response.json();
  return json.success ? json.data : null;
});

/**
 * Fetch proposals data
 * Cached per request cycle
 */
export const getProposals = cache(async (status?: string, limit: number = 20) => {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("limit", limit.toString());

  const response = await fetch(`${baseUrl}/api/governance/proposals?${params}`, {
    next: { revalidate: 60 }, // 1 minute cache
  });

  if (!response.ok) {
    console.error("Failed to fetch proposals");
    return null;
  }

  const json = await response.json();
  return json.success ? json.data : null;
});

/**
 * Fetch delegates data
 * Cached per request cycle
 */
export const getDelegates = cache(async (limit: number = 100) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/governance/delegates?limit=${limit}`, {
    next: { revalidate: 300 }, // 5 minute cache
  });

  if (!response.ok) {
    console.error("Failed to fetch delegates");
    return null;
  }

  const json = await response.json();
  return json.success ? json.data : null;
});

/**
 * Fetch ENS stats from Dune
 * Cached per request cycle
 */
export const getEnsStats = cache(async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/dune/ens-stats`, {
    next: { revalidate: 3600 }, // 1 hour cache
  });

  if (!response.ok) {
    console.error("Failed to fetch ENS stats");
    return null;
  }

  const json = await response.json();
  return json.success ? json.data : null;
});

/**
 * Fetch financials data from Dune
 * Cached per request cycle
 */
export const getFinancials = cache(async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/dune/financials`, {
    next: { revalidate: 3600 }, // 1 hour cache
  });

  if (!response.ok) {
    console.error("Failed to fetch financials");
    return null;
  }

  const json = await response.json();
  return json.success ? json.data : null;
});

/**
 * Fetch upcoming meetings
 * Cached per request cycle
 */
export const getUpcomingMeetings = cache(async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/calendar/meetings`, {
    next: { revalidate: 60 }, // 1 minute cache
  });

  if (!response.ok) {
    console.error("Failed to fetch meetings");
    return null;
  }

  const json = await response.json();
  return json.success ? json.data : null;
});

/**
 * Aggregate dashboard data for initial server render
 * Fetches all data needed for the main dashboard in parallel
 */
export const getDashboardInitialData = cache(async () => {
  const [market, treasury, proposals, delegates, financials] = await Promise.all([
    getMarketData(),
    getTreasuryOverview(),
    getProposals(undefined, 20),
    getDelegates(100),
    getFinancials(),
  ]);

  return {
    market,
    treasury,
    proposals,
    delegates,
    financials,
    fetchedAt: new Date().toISOString(),
  };
});

export type DashboardInitialData = Awaited<ReturnType<typeof getDashboardInitialData>>;
