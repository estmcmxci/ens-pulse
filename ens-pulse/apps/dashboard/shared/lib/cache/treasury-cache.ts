import { fetchAllMultisigsData, fetchPrimaryWalletsData, fetchEthPrice, type MultisigData } from "@/shared/lib/safe/client";

const CACHE_TTL_MS = 30000; // 30 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let multisigsCache: CacheEntry<MultisigData[]> | null = null;
let primaryWalletsCache: CacheEntry<MultisigData[]> | null = null;
let ethPriceCache: CacheEntry<bigint | null> | null = null;

function isCacheValid<T>(cache: CacheEntry<T> | null): cache is CacheEntry<T> {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_TTL_MS;
}

/**
 * Fetch all multisigs data with caching
 * Uses 30s TTL to reduce RPC calls
 */
export async function getCachedMultisigsData(): Promise<MultisigData[]> {
  if (isCacheValid(multisigsCache)) {
    return multisigsCache.data;
  }

  const data = await fetchAllMultisigsData();
  multisigsCache = {
    data,
    timestamp: Date.now(),
  };
  return data;
}

/**
 * Fetch primary wallets data with caching
 * Uses 30s TTL to reduce RPC calls
 */
export async function getCachedPrimaryWalletsData(): Promise<MultisigData[]> {
  if (isCacheValid(primaryWalletsCache)) {
    return primaryWalletsCache.data;
  }

  const data = await fetchPrimaryWalletsData();
  primaryWalletsCache = {
    data,
    timestamp: Date.now(),
  };
  return data;
}

/**
 * Fetch ETH price with caching
 * Uses 30s TTL to reduce RPC calls
 */
export async function getCachedEthPrice(): Promise<bigint | null> {
  if (isCacheValid(ethPriceCache)) {
    return ethPriceCache.data;
  }

  const data = await fetchEthPrice();
  ethPriceCache = {
    data,
    timestamp: Date.now(),
  };
  return data;
}

/**
 * Invalidate all treasury caches
 * Call this if you need fresh data immediately
 */
export function invalidateTreasuryCache(): void {
  multisigsCache = null;
  primaryWalletsCache = null;
  ethPriceCache = null;
}
