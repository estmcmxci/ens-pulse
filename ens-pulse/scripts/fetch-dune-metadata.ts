/**
 * Script to fetch Dune query metadata via results inspection
 * Run with: npx tsx scripts/fetch-dune-metadata.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env from project root
config({ path: resolve(__dirname, "../.env") });

import { DuneClient } from "@duneanalytics/client-sdk";

// Deduplicated list of query IDs from ENS dashboards
const QUERY_IDS = [
  3522362, // Already configured
  2687659,
  2776350,
  2772373,
  2673729,
  2772488,
  3235182,
  2673903,
  2750116,
  3223327,
  2749453,
  2677569,
  2677413,
  2756190,
  2759082,
  5768,
  6491,
  2101527,
  5676,
  650661,
  675116,
  675898,
  675909,
  675916,
  3613359,
  3690384,
];

interface QueryMetadata {
  queryId: number;
  columns: string[];
  rowCount: number;
  sampleRow: Record<string, unknown> | null;
  suggestedCategory: string;
  suggestedName: string;
  error?: string;
}

function categorizeFromColumns(columns: string[], sampleRow: Record<string, unknown> | null): { category: string; name: string } {
  const colStr = columns.join(" ").toLowerCase();

  // Check sample row values for additional context
  const rowStr = sampleRow ? JSON.stringify(sampleRow).toLowerCase() : "";

  // Delegates category
  if (
    colStr.includes("delegate") ||
    colStr.includes("delegator") ||
    colStr.includes("voting_power") ||
    colStr.includes("votingpower") ||
    colStr.includes("delegation")
  ) {
    if (colStr.includes("concentration") || colStr.includes("top") || colStr.includes("rank")) {
      return { category: "delegates", name: "Delegate Concentration" };
    }
    if (colStr.includes("activity") || colStr.includes("vote_count") || colStr.includes("participation")) {
      return { category: "delegates", name: "Delegate Activity" };
    }
    return { category: "delegates", name: "Voting Power Distribution" };
  }

  // Governance category
  if (
    colStr.includes("proposal") ||
    colStr.includes("quorum") ||
    colStr.includes("governance") ||
    colStr.includes("vote_for") ||
    colStr.includes("vote_against") ||
    colStr.includes("votes_for") ||
    colStr.includes("votes_against")
  ) {
    if (colStr.includes("proposal_id") || colStr.includes("proposalid") || colStr.includes("title")) {
      return { category: "governance", name: "Proposal History" };
    }
    if (colStr.includes("risk") || colStr.includes("attack") || colStr.includes("threshold")) {
      return { category: "governance", name: "Governance Risk" };
    }
    return { category: "governance", name: "Governance Overview" };
  }

  // Treasury category
  if (
    colStr.includes("treasury") ||
    colStr.includes("revenue") ||
    colStr.includes("balance") ||
    colStr.includes("spending") ||
    colStr.includes("token_holder") ||
    colStr.includes("eth_balance") ||
    colStr.includes("usd_value") ||
    colStr.includes("wallet") ||
    colStr.includes("income")
  ) {
    if (colStr.includes("revenue") || colStr.includes("income") || colStr.includes("amount")) {
      return { category: "treasury", name: "ENS Revenue" };
    }
    if (colStr.includes("holder") || colStr.includes("distribution")) {
      return { category: "treasury", name: "Token Holder Distribution" };
    }
    return { category: "treasury", name: "Treasury Balance History" };
  }

  // Registrations category
  if (
    colStr.includes("registration") ||
    colStr.includes("domain") ||
    colStr.includes("renewal") ||
    colStr.includes("ens_name") ||
    colStr.includes("expir") ||
    colStr.includes("names_registered") ||
    colStr.includes("primary_name") ||
    colStr.includes("register") ||
    colStr.includes("label") ||
    colStr.includes("resolver")
  ) {
    if (colStr.includes("registration") || colStr.includes("register") || colStr.includes("new_")) {
      return { category: "registrations", name: "ENS Registrations" };
    }
    return { category: "registrations", name: "Domain Statistics" };
  }

  // Check for time-series financial data (likely treasury/revenue)
  if (colStr.includes("amount") && colStr.includes("period")) {
    return { category: "treasury", name: "ENS Revenue" };
  }

  // Check for ENS-specific patterns
  if (colStr.includes("ens") || colStr.includes("name") || colStr.includes(".eth")) {
    return { category: "registrations", name: "Domain Statistics" };
  }

  // Check row values for ENS patterns
  if (rowStr.includes(".eth") || rowStr.includes("ens")) {
    return { category: "registrations", name: "Domain Statistics" };
  }

  return { category: "unknown", name: "Unknown Query" };
}

async function main() {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    console.error("DUNE_API_KEY environment variable not set");
    process.exit(1);
  }

  const client = new DuneClient(apiKey);
  const results: QueryMetadata[] = [];

  console.log(`Fetching results for ${QUERY_IDS.length} queries...\n`);

  for (const queryId of QUERY_IDS) {
    try {
      const result = await client.getLatestResult({ queryId });

      if (!result.result) {
        results.push({
          queryId,
          columns: [],
          rowCount: 0,
          sampleRow: null,
          suggestedCategory: "unknown",
          suggestedName: "No Results Available",
          error: "No cached results",
        });
        console.log(`[${queryId}] No cached results available`);
        console.log();
        continue;
      }

      const columns = result.result.metadata.column_names;
      const rowCount = result.result.metadata.total_row_count;
      const sampleRow = result.result.rows[0] as Record<string, unknown> || null;
      const { category, name } = categorizeFromColumns(columns, sampleRow);

      const metadata: QueryMetadata = {
        queryId,
        columns,
        rowCount,
        sampleRow,
        suggestedCategory: category,
        suggestedName: name,
      };

      results.push(metadata);
      console.log(`[${queryId}] ${name}`);
      console.log(`  Category: ${category}`);
      console.log(`  Columns: ${columns.join(", ")}`);
      console.log(`  Rows: ${rowCount}`);
      console.log();
    } catch (error) {
      const errorMsg = String(error);
      results.push({
        queryId,
        columns: [],
        rowCount: 0,
        sampleRow: null,
        suggestedCategory: "error",
        suggestedName: "Error",
        error: errorMsg,
      });

      // Shorter error output
      if (errorMsg.includes("not found")) {
        console.log(`[${queryId}] Query not found or no results`);
      } else {
        console.log(`[${queryId}] Error: ${errorMsg.slice(0, 100)}`);
      }
      console.log();
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Output summary by category
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY BY CATEGORY");
  console.log("=".repeat(60) + "\n");

  const categories = ["governance", "delegates", "treasury", "registrations", "unknown", "error"];
  for (const category of categories) {
    const queries = results.filter((r) => r.suggestedCategory === category);
    if (queries.length > 0) {
      console.log(`\n${category.toUpperCase()} (${queries.length}):`);
      console.log("-".repeat(40));
      for (const q of queries) {
        console.log(`  ${q.queryId}: ${q.suggestedName}`);
        if (q.columns.length > 0) {
          console.log(`    └─ [${q.columns.slice(0, 6).join(", ")}${q.columns.length > 6 ? ", ..." : ""}]`);
        }
        if (q.error) {
          console.log(`    └─ Error: ${q.error.slice(0, 60)}`);
        }
      }
    }
  }

  // Output config mapping suggestion
  console.log("\n" + "=".repeat(60));
  console.log("SUGGESTED CONFIG UPDATE");
  console.log("=".repeat(60) + "\n");

  const validResults = results.filter(r => !r.error && r.suggestedCategory !== "unknown");

  const byCategory: Record<string, QueryMetadata[]> = {};
  for (const r of validResults) {
    if (!byCategory[r.suggestedCategory]) {
      byCategory[r.suggestedCategory] = [];
    }
    byCategory[r.suggestedCategory].push(r);
  }

  console.log("export const DUNE_QUERIES = {");

  // Governance
  const gov = byCategory["governance"] || [];
  console.log("  // Governance");
  console.log(`  GOVERNANCE_OVERVIEW: ${gov.find(q => q.suggestedName.includes("Overview"))?.queryId || gov[0]?.queryId || 0},`);
  console.log(`  GOVERNANCE_RISK: ${gov.find(q => q.suggestedName.includes("Risk"))?.queryId || 0},`);
  console.log(`  PROPOSAL_HISTORY: ${gov.find(q => q.suggestedName.includes("Proposal"))?.queryId || 0},`);
  console.log(`  DAO_GOVERNANCE_SUMMARY: ${gov[1]?.queryId || 0},`);

  // Delegates
  const del = byCategory["delegates"] || [];
  console.log("\n  // Delegates");
  console.log(`  VOTING_POWER_DISTRIBUTION: ${del.find(q => q.suggestedName.includes("Voting Power"))?.queryId || del[0]?.queryId || 0},`);
  console.log(`  DELEGATE_CONCENTRATION: ${del.find(q => q.suggestedName.includes("Concentration"))?.queryId || 0},`);
  console.log(`  DELEGATE_ACTIVITY: ${del.find(q => q.suggestedName.includes("Activity"))?.queryId || 0},`);

  // Treasury
  const trs = byCategory["treasury"] || [];
  console.log("\n  // Treasury");
  console.log(`  ENS_REVENUE: ${trs.find(q => q.suggestedName.includes("Revenue"))?.queryId || trs[0]?.queryId || 0},`);
  console.log(`  TREASURY_BALANCE_HISTORY: ${trs.find(q => q.suggestedName.includes("Balance"))?.queryId || 0},`);
  console.log(`  TOKEN_HOLDER_DISTRIBUTION: ${trs.find(q => q.suggestedName.includes("Holder"))?.queryId || 0},`);

  // Registrations
  const reg = byCategory["registrations"] || [];
  console.log("\n  // Registrations");
  console.log(`  ENS_REGISTRATIONS: ${reg.find(q => q.suggestedName.includes("Registrations"))?.queryId || reg[0]?.queryId || 0},`);
  console.log(`  DOMAIN_STATISTICS: ${reg.find(q => q.suggestedName.includes("Statistics"))?.queryId || reg[1]?.queryId || 0},`);

  console.log("} as const;");

  // Full JSON for reference
  console.log("\n" + "=".repeat(60));
  console.log("FULL RESULTS (JSON)");
  console.log("=".repeat(60) + "\n");

  const summary = results.map(r => ({
    queryId: r.queryId,
    category: r.suggestedCategory,
    name: r.suggestedName,
    columns: r.columns,
    rowCount: r.rowCount,
    error: r.error,
  }));

  console.log(JSON.stringify(summary, null, 2));
}

main().catch(console.error);
