import { createPublicClient, http, erc20Abi, type Address } from "viem";
import { mainnet } from "viem/chains";
import {
  ENS_MULTISIGS,
  type MultisigAddress,
  getMultisigInfo,
  getPrimaryWallets,
} from "@/shared/config/multisigs";

// Token addresses on mainnet
const ENS_TOKEN_ADDRESS = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72" as const;
const USDC_TOKEN_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const;

// Chainlink ETH/USD price feed
const CHAINLINK_ETH_USD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419" as const;

// Safe contract ABIs for reading multisig info
const safeGetOwnersAbi = [
  {
    inputs: [],
    name: "getOwners",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const safeGetThresholdAbi = [
  {
    inputs: [],
    name: "getThreshold",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const chainlinkLatestRoundDataAbi = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Create viem client with multicall batching for efficiency
const viemClient = createPublicClient({
  batch: {
    multicall: true,
  },
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL || undefined),
});

export interface SafeBalance {
  tokenAddress: string | null;
  token: {
    name: string;
    symbol: string;
    decimals: number;
    logoUri: string;
  } | null;
  balance: string;
}

export interface SafeInfo {
  address: string;
  nonce: number;
  threshold: number;
  owners: string[];
  isMultisig: boolean;
}

export interface MultisigData {
  address: MultisigAddress;
  info: SafeInfo;
  balances: SafeBalance[];
  pendingTransactionCount: number;
}

/**
 * Fetch Safe info directly from the blockchain
 * Reads getOwners() and getThreshold() from the Safe contract
 */
export async function fetchSafeInfo(address: string): Promise<SafeInfo> {
  const safeAddress = address as Address;
  const multisigInfo = getMultisigInfo(address);
  const isMultisig = multisigInfo?.isMultisig ?? true;

  // Non-multisig contracts (like Controller) don't have getOwners/getThreshold
  if (!isMultisig) {
    return {
      address,
      nonce: 0,
      threshold: 0,
      owners: [],
      isMultisig: false,
    };
  }

  try {
    const [owners, threshold] = await Promise.all([
      viemClient.readContract({
        address: safeAddress,
        abi: safeGetOwnersAbi,
        functionName: "getOwners",
      }),
      viemClient.readContract({
        address: safeAddress,
        abi: safeGetThresholdAbi,
        functionName: "getThreshold",
      }),
    ]);

    return {
      address,
      nonce: 0, // We don't need nonce for display purposes
      threshold: Number(threshold),
      owners: [...owners],
      isMultisig: true,
    };
  } catch (error) {
    console.warn(`Failed to read Safe contract at ${address}:`, (error as Error).message);
    return {
      address,
      nonce: 0,
      threshold: 0,
      owners: [],
      isMultisig: false,
    };
  }
}

/**
 * Fetch token balances directly from the blockchain
 * Uses multicall for efficiency
 */
export async function fetchSafeBalances(address: string): Promise<SafeBalance[]> {
  const safeAddress = address as Address;

  try {
    const [ethBalance, ensBalance, usdcBalance] = await Promise.all([
      viemClient.getBalance({ address: safeAddress }),
      viemClient.readContract({
        address: ENS_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [safeAddress],
      }),
      viemClient.readContract({
        address: USDC_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [safeAddress],
      }),
    ]);

    const balances: SafeBalance[] = [
      {
        tokenAddress: null,
        token: null,
        balance: ethBalance.toString(),
      },
      {
        tokenAddress: ENS_TOKEN_ADDRESS,
        token: {
          name: "Ethereum Name Service",
          symbol: "ENS",
          decimals: 18,
          logoUri: "https://assets.coingecko.com/coins/images/19785/small/acatxTm8_400x400.jpg",
        },
        balance: ensBalance.toString(),
      },
      {
        tokenAddress: USDC_TOKEN_ADDRESS,
        token: {
          name: "USD Coin",
          symbol: "USDC",
          decimals: 6,
          logoUri: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
        },
        balance: usdcBalance.toString(),
      },
    ];

    return balances;
  } catch (error) {
    console.warn(`Failed to fetch balances for ${address}:`, (error as Error).message);
    return [];
  }
}

/**
 * Fetch ETH price from Chainlink oracle
 * Returns price in USD with 8 decimals
 */
export async function fetchEthPrice(): Promise<bigint | null> {
  try {
    const [, answer] = await viemClient.readContract({
      address: CHAINLINK_ETH_USD,
      abi: chainlinkLatestRoundDataAbi,
      functionName: "latestRoundData",
    });
    return answer;
  } catch (error) {
    console.warn("Failed to fetch ETH price from Chainlink:", (error as Error).message);
    return null;
  }
}

/**
 * Fetch all data for a single multisig
 */
export async function fetchMultisigData(address: MultisigAddress): Promise<MultisigData> {
  const [info, balances] = await Promise.all([
    fetchSafeInfo(address),
    fetchSafeBalances(address),
  ]);

  return {
    address,
    info,
    balances,
    pendingTransactionCount: 0, // We don't track pending txs without Safe API
  };
}

/**
 * Fetch data for all configured multisigs
 * Uses parallel requests since we're hitting RPC, not rate-limited API
 */
export async function fetchAllMultisigsData(): Promise<MultisigData[]> {
  const addresses = Object.values(ENS_MULTISIGS) as MultisigAddress[];

  const results = await Promise.all(
    addresses.map(async (address) => {
      try {
        return await fetchMultisigData(address);
      } catch (error) {
        console.warn(`Failed to fetch data for ${address}:`, error);
        return null;
      }
    })
  );

  return results.filter((r): r is MultisigData => r !== null);
}

/**
 * Fetch data for primary wallets only (5 key wallets)
 * These are: DAO Wallet, Endowment, Ecosystem WG, Metagov WG, Public Goods WG
 */
export async function fetchPrimaryWalletsData(): Promise<MultisigData[]> {
  const primaryWallets = getPrimaryWallets();
  const addresses = primaryWallets.map((w) => w.address);

  const results = await Promise.all(
    addresses.map(async (address) => {
      try {
        return await fetchMultisigData(address);
      } catch (error) {
        console.warn(`Failed to fetch data for ${address}:`, error);
        return null;
      }
    })
  );

  return results.filter((r): r is MultisigData => r !== null);
}

/**
 * Calculate total balances across all provided balance arrays
 */
export function calculateTotalBalance(balances: SafeBalance[]): {
  ethBalance: bigint;
  ensBalance: bigint;
  usdcBalance: bigint;
} {
  let ethBalance = 0n;
  let ensBalance = 0n;
  let usdcBalance = 0n;

  for (const balance of balances) {
    const value = BigInt(balance.balance);

    if (balance.tokenAddress === null) {
      ethBalance += value;
    } else if (
      balance.token?.symbol === "ENS" ||
      balance.tokenAddress?.toLowerCase() === ENS_TOKEN_ADDRESS.toLowerCase()
    ) {
      ensBalance += value;
    } else if (
      balance.token?.symbol === "USDC" ||
      balance.tokenAddress?.toLowerCase() === USDC_TOKEN_ADDRESS.toLowerCase()
    ) {
      usdcBalance += value;
    }
  }

  return { ethBalance, ensBalance, usdcBalance };
}

/**
 * Get the current block timestamp
 */
export async function getBlockTimestamp(): Promise<bigint> {
  const block = await viemClient.getBlock();
  return block.timestamp * 1000n; // Convert to milliseconds
}
