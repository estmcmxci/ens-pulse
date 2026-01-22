import { NextResponse } from "next/server";

export const revalidate = 60; // 1 minute cache

interface StatusComponent {
  name: string;
  status: "operational" | "degraded" | "outage" | "unknown";
  description?: string;
}

interface StatusData {
  overall: "operational" | "degraded" | "outage" | "unknown";
  components: StatusComponent[];
  lastUpdated: string;
}

async function fetchCloudflareStatus(): Promise<StatusComponent> {
  try {
    const response = await fetch("https://www.cloudflarestatus.com/api/v2/status.json");
    if (!response.ok) throw new Error("Failed to fetch");

    const data = await response.json();
    const indicator = data.status?.indicator || "unknown";

    return {
      name: "Cloudflare",
      status:
        indicator === "none"
          ? "operational"
          : indicator === "minor"
            ? "degraded"
            : indicator === "major"
              ? "outage"
              : "unknown",
      description: data.status?.description,
    };
  } catch {
    return { name: "Cloudflare", status: "unknown" };
  }
}

async function fetchEthereumStatus(): Promise<StatusComponent> {
  try {
    // Check if we can reach an Ethereum RPC endpoint
    const response = await fetch("https://eth.llamarpc.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    });

    if (!response.ok) throw new Error("RPC not responding");

    const data = await response.json();
    if (data.result) {
      return {
        name: "Ethereum Network",
        status: "operational",
        description: `Block #${parseInt(data.result, 16)}`,
      };
    }
    throw new Error("Invalid response");
  } catch {
    return { name: "Ethereum Network", status: "unknown" };
  }
}

async function fetchENSResolverStatus(): Promise<StatusComponent> {
  try {
    // Try to resolve a known ENS name
    const response = await fetch(
      "https://ens.eth.limo/.well-known/ens/vitalik.eth",
      { method: "HEAD" }
    );

    return {
      name: "ENS Gateway",
      status: response.ok ? "operational" : "degraded",
    };
  } catch {
    return { name: "ENS Gateway", status: "unknown" };
  }
}

export async function GET() {
  try {
    const [cloudflare, ethereum, ensResolver] = await Promise.all([
      fetchCloudflareStatus(),
      fetchEthereumStatus(),
      fetchENSResolverStatus(),
    ]);

    const components = [cloudflare, ethereum, ensResolver];

    // Determine overall status
    let overall: StatusData["overall"] = "operational";
    if (components.some((c) => c.status === "outage")) {
      overall = "outage";
    } else if (components.some((c) => c.status === "degraded")) {
      overall = "degraded";
    } else if (components.every((c) => c.status === "unknown")) {
      overall = "unknown";
    }

    return NextResponse.json({
      success: true,
      data: {
        overall,
        components,
        lastUpdated: new Date().toISOString(),
      } satisfies StatusData,
    });
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
