import { NextResponse } from "next/server";
import { getLatestQueryResults, runDuneQuery } from "@/shared/lib/dune/client";
import { DUNE_QUERY_CONFIGS } from "@/shared/config/dune-queries";

export const revalidate = 3600; // 1 hour cache

export async function GET(
  request: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    const { queryId: queryIdStr } = await params;
    const queryId = parseInt(queryIdStr, 10);

    if (isNaN(queryId) || queryId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid query ID" },
        { status: 400 }
      );
    }

    // Security: Only allow queries that are configured and active
    const config = DUNE_QUERY_CONFIGS.find((c) => c.id === queryId && c.isActive);
    if (!config) {
      return NextResponse.json(
        { success: false, error: "Query not allowed. Only configured active queries can be executed." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    let result;
    if (refresh) {
      // Force re-run the query (only allowed for active queries)
      result = await runDuneQuery(queryId);
    } else {
      // Get latest cached results
      result = await getLatestQueryResults(queryId);
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: "No results available for this query" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        queryId,
        name: config.name,
        category: config.category,
        description: config.description,
        rows: result.rows,
        metadata: result.metadata,
        executionId: result.execution_id,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching Dune query:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch Dune query results" },
      { status: 500 }
    );
  }
}
