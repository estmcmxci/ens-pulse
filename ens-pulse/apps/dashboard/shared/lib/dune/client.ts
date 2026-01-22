import { DuneClient, QueryParameter } from "@duneanalytics/client-sdk";
import { DUNE_QUERIES, type DuneQueryKey } from "@/shared/config/dune-queries";

let client: DuneClient | null = null;

function getDuneClient(): DuneClient {
  if (!client) {
    const apiKey = process.env.DUNE_API_KEY;
    if (!apiKey) {
      throw new Error("DUNE_API_KEY environment variable is not set");
    }
    client = new DuneClient(apiKey);
  }
  return client;
}

export interface DuneQueryResult<T = Record<string, unknown>> {
  rows: T[];
  metadata: {
    column_names: string[];
    result_set_bytes: number;
    total_row_count: number;
  };
  execution_id: string;
}

export interface DuneExecutionStatus {
  execution_id: string;
  query_id: number;
  state: "QUERY_STATE_PENDING" | "QUERY_STATE_EXECUTING" | "QUERY_STATE_COMPLETED" | "QUERY_STATE_FAILED";
  submitted_at: string;
  expires_at: string;
  execution_started_at?: string;
  execution_ended_at?: string;
}

export async function runDuneQuery<T = Record<string, unknown>>(
  queryId: number,
  parameters?: QueryParameter[]
): Promise<DuneQueryResult<T>> {
  const duneClient = getDuneClient();

  const execution = await duneClient.runQuery({
    queryId,
    query_parameters: parameters,
  });

  if (!execution.result) {
    throw new Error(`No results returned for query ${queryId}`);
  }

  return {
    rows: execution.result.rows as T[],
    metadata: {
      column_names: execution.result.metadata.column_names,
      result_set_bytes: execution.result.metadata.result_set_bytes,
      total_row_count: execution.result.metadata.total_row_count,
    },
    execution_id: execution.execution_id,
  };
}

export async function getLatestQueryResults<T = Record<string, unknown>>(
  queryId: number
): Promise<DuneQueryResult<T> | null> {
  const duneClient = getDuneClient();

  try {
    const result = await duneClient.getLatestResult({ queryId });

    if (!result.result) {
      return null;
    }

    return {
      rows: result.result.rows as T[],
      metadata: {
        column_names: result.result.metadata.column_names,
        result_set_bytes: result.result.metadata.result_set_bytes,
        total_row_count: result.result.metadata.total_row_count,
      },
      execution_id: result.execution_id,
    };
  } catch {
    return null;
  }
}

export async function fetchDuneQueryByKey<T = Record<string, unknown>>(
  key: DuneQueryKey
): Promise<DuneQueryResult<T> | null> {
  const queryId = DUNE_QUERIES[key];
  // Runtime check in case a query ID is set to 0 in the future
  if (!queryId || queryId <= 0) {
    console.warn(`Query ${key} has no ID configured`);
    return null;
  }
  return getLatestQueryResults<T>(queryId);
}

// Governance-specific query types
export interface GovernanceOverviewRow {
  total_proposals: number;
  active_proposals: number;
  passed_proposals: number;
  total_delegates: number;
  total_voting_power: string;
  participation_rate: number;
}

export interface VotingPowerRow {
  address: string;
  ens_name: string | null;
  voting_power: string;
  voting_power_pct: number;
  delegators_count: number;
}

export interface ProposalHistoryRow {
  proposal_id: string;
  title: string;
  status: string;
  votes_for: string;
  votes_against: string;
  votes_abstain: string;
  created_at: string;
  ended_at: string | null;
}

// Typed query functions
export async function fetchGovernanceOverview(): Promise<GovernanceOverviewRow | null> {
  const result = await fetchDuneQueryByKey<GovernanceOverviewRow>("GOVERNANCE_OVERVIEW");
  return result?.rows[0] ?? null;
}

export async function fetchVotingPowerDistribution(): Promise<VotingPowerRow[]> {
  const result = await fetchDuneQueryByKey<VotingPowerRow>("VOTING_POWER_DISTRIBUTION");
  return result?.rows ?? [];
}

export async function fetchProposalHistory(): Promise<ProposalHistoryRow[]> {
  const result = await fetchDuneQueryByKey<ProposalHistoryRow>("PROPOSAL_HISTORY");
  return result?.rows ?? [];
}
