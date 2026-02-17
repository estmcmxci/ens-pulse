const DEFILLAMA_API_BASE = "https://api.llama.fi";

// In-memory cache — avoids re-fetching 454KB on every request
let cachedTreasury: { data: EnsTreasuryData; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface EnsTreasuryData {
  /** Total treasury value in USD, excluding ENS governance tokens */
  tvl: number;
  /** ENS governance token holdings in USD */
  ownTokens: number;
  /** Breakdown by asset category (USD) */
  tokenBreakdowns: {
    stablecoins: number;
    majors: number;
    others: number;
  };
  /** Percent changes */
  change1d: number | null;
  change7d: number | null;
}

interface DefiLlamaTreasuryEntry {
  id: string;
  name: string;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  tokenBreakdowns?: {
    ownTokens?: number;
    stablecoins?: number;
    majors?: number;
    others?: number;
  };
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
}

export async function fetchEnsTreasury(): Promise<EnsTreasuryData | null> {
  // Return cached data if fresh
  if (cachedTreasury && Date.now() - cachedTreasury.fetchedAt < CACHE_TTL_MS) {
    return cachedTreasury.data;
  }

  try {
    const response = await fetch(`${DEFILLAMA_API_BASE}/treasuries`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // Next.js fetch cache: 1 hour
    });

    if (!response.ok) {
      console.error(`DefiLlama API error: ${response.status}`);
      return cachedTreasury?.data ?? null;
    }

    const treasuries: DefiLlamaTreasuryEntry[] = await response.json();
    const ens = treasuries.find(
      (t) => t.id === "2519-treasury" || t.slug === "ens-(treasury)"
    );

    if (!ens) {
      console.error("ENS treasury entry not found in DefiLlama response");
      return cachedTreasury?.data ?? null;
    }

    const data: EnsTreasuryData = {
      tvl: ens.tvl,
      ownTokens: ens.chainTvls?.["OwnTokens"] ?? 0,
      tokenBreakdowns: {
        stablecoins: ens.tokenBreakdowns?.stablecoins ?? 0,
        majors: ens.tokenBreakdowns?.majors ?? 0,
        others: ens.tokenBreakdowns?.others ?? 0,
      },
      change1d: ens.change_1d ?? null,
      change7d: ens.change_7d ?? null,
    };

    cachedTreasury = { data, fetchedAt: Date.now() };
    return data;
  } catch (error) {
    console.error("Error fetching ENS treasury from DefiLlama:", error);
    return cachedTreasury?.data ?? null;
  }
}
