const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  price_change_percentage_30d?: number;
  last_updated: string;
}

export interface GasPrice {
  low: number;
  average: number;
  high: number;
  baseFee: number;
  lastBlock: number;
  timestamp: string;
}

export interface MarketData {
  prices: {
    eth: TokenPrice | null;
    ens: TokenPrice | null;
    btc: TokenPrice | null;
  };
  gas: GasPrice | null;
  lastUpdated: string;
}

async function fetchWithApiKey(url: string): Promise<Response> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }

  return fetch(url, { headers });
}

export async function fetchTokenPrices(): Promise<{
  eth: TokenPrice | null;
  ens: TokenPrice | null;
  btc: TokenPrice | null;
}> {
  try {
    const response = await fetchWithApiKey(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=ethereum,ethereum-name-service,bitcoin&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d,30d`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: TokenPrice[] = await response.json();

    return {
      eth: data.find((t) => t.id === "ethereum") || null,
      ens: data.find((t) => t.id === "ethereum-name-service") || null,
      btc: data.find((t) => t.id === "bitcoin") || null,
    };
  } catch (error) {
    console.error("Error fetching token prices:", error);
    return { eth: null, ens: null, btc: null };
  }
}

export async function fetchGasPrices(): Promise<GasPrice | null> {
  try {
    // Using Etherscan Gas Tracker API as fallback
    const apiKey = process.env.ETHERSCAN_API_KEY || "";
    const response = await fetch(
      `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "1") {
      // If Etherscan fails, return mock data for development
      return {
        low: 15,
        average: 20,
        high: 30,
        baseFee: 15,
        lastBlock: 0,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      low: parseFloat(data.result.SafeGasPrice),
      average: parseFloat(data.result.ProposeGasPrice),
      high: parseFloat(data.result.FastGasPrice),
      baseFee: parseFloat(data.result.suggestBaseFee),
      lastBlock: parseInt(data.result.LastBlock),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching gas prices:", error);
    return null;
  }
}

export async function fetchMarketData(): Promise<MarketData> {
  const [prices, gas] = await Promise.all([fetchTokenPrices(), fetchGasPrices()]);

  return {
    prices,
    gas,
    lastUpdated: new Date().toISOString(),
  };
}

export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

export function getPriceChangeColor(change: number): string {
  if (change > 0) return "success";
  if (change < 0) return "danger";
  return "muted";
}
