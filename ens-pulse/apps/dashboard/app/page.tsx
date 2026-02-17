import WorldMonitorClient from "./WorldMonitorClient";

/* ═══════════════════════════════════════════════════════════════════════════
   ENS PULSE — DAO Monitor

   Client-side data fetching with SWR for optimal UX when consuming
   slow external APIs (Coingecko, Tally, Dune, Safe, etc.)

   Benefits:
   - Instant UI with loading skeletons
   - Data streams in as each API responds
   - SWR handles caching, deduplication, and background refresh
   - Better UX than waiting for all APIs server-side
   ═══════════════════════════════════════════════════════════════════════════ */

export default function WorldMonitor() {
  return <WorldMonitorClient />;
}
