import { NextResponse } from "next/server";
import { fetchMultisigData, calculateTotalBalance } from "@/shared/lib/safe/client";
import { getMultisigInfo, type MultisigAddress } from "@/shared/config/multisigs";

export const revalidate = 30; // 30 second cache

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { success: false, error: "Invalid address format" },
        { status: 400 }
      );
    }

    const data = await fetchMultisigData(address as MultisigAddress);
    const info = getMultisigInfo(address);
    const balances = calculateTotalBalance(data.balances);

    return NextResponse.json({
      success: true,
      data: {
        address: data.address,
        name: info?.name || "Unknown Multisig",
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
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching multisig data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch multisig data" },
      { status: 500 }
    );
  }
}
