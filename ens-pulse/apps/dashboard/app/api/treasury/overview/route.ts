import { NextResponse } from "next/server";
import { calculateTotalBalance } from "@/shared/lib/safe/client";
import { getCachedPrimaryWalletsData, getCachedEthPrice } from "@/shared/lib/cache/treasury-cache";
import { MULTISIG_INFO } from "@/shared/config/multisigs";
import { formatUnits } from "viem";

export const revalidate = 30; // 30 second cache

export async function GET() {
  try {
    // Fetch only primary wallets (5 key wallets)
    const [multisigsData, ethPriceRaw] = await Promise.all([
      getCachedPrimaryWalletsData(),
      getCachedEthPrice(),
    ]);

    // Parse ETH price (8 decimals from Chainlink)
    const ethPrice = ethPriceRaw ? Number(formatUnits(ethPriceRaw, 8)) : 0;

    // Calculate totals across all multisigs
    let totalEth = 0n;
    let totalEns = 0n;
    let totalUsdc = 0n;

    const enrichedData = multisigsData.map((data) => {
      const info = MULTISIG_INFO.find(
        (m) => m.address.toLowerCase() === data.address.toLowerCase()
      );
      const balances = calculateTotalBalance(data.balances);

      totalEth += balances.ethBalance;
      totalEns += balances.ensBalance;
      totalUsdc += balances.usdcBalance;

      return {
        address: data.address,
        name: info?.name || "Unknown",
        workingGroup: info?.workingGroup || "Unknown",
        description: info?.description || "",
        isMultisig: info?.isMultisig ?? true,
        threshold: data.info.threshold,
        owners: data.info.owners,
        ownerCount: data.info.owners.length,
        calculatedBalances: {
          ethBalance: balances.ethBalance.toString(),
          ensBalance: balances.ensBalance.toString(),
          usdcBalance: balances.usdcBalance.toString(),
        },
        rawBalances: data.balances,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        multisigs: enrichedData,
        totals: {
          ethBalance: totalEth.toString(),
          ensBalance: totalEns.toString(),
          usdcBalance: totalUsdc.toString(),
          multisigCount: multisigsData.length,
        },
        ethPrice,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching treasury overview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch treasury data" },
      { status: 500 }
    );
  }
}
