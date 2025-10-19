/**
 * Market Data Service
 * Handles real-time and historical market data from multiple sources
 */

import type { MarketDataPoint } from "./algorithms";

export interface MarketDataSource {
  name: string;
  supports: string[]; // Asset types: forex, crypto, stocks, indices
  rateLimit: number; // Requests per minute
}

/**
 * Generate realistic mock market data for testing
 * In production, this would connect to real APIs
 */
export function generateMockMarketData(
  symbol: string,
  timeframe: string,
  count: number = 100
): MarketDataPoint[] {
  const data: MarketDataPoint[] = [];
  const now = new Date();
  let basePrice = 100;

  // Determine base price based on symbol
  if (symbol.includes("BTC")) basePrice = 45000;
  else if (symbol.includes("ETH")) basePrice = 2500;
  else if (symbol.includes("EUR")) basePrice = 1.08;
  else if (symbol.includes("GBP")) basePrice = 1.25;
  else if (symbol.includes("SPX")) basePrice = 4500;

  // Generate data with realistic patterns
  for (let i = count; i > 0; i--) {
    const timestamp = new Date(now.getTime() - i * getTimeframeMs(timeframe));

    // Add trend and noise
    const trend = Math.sin(i / 20) * 0.02;
    const noise = (Math.random() - 0.5) * 0.01;
    const change = trend + noise;

    basePrice = basePrice * (1 + change);

    const volatility = basePrice * 0.005;
    const open = basePrice + (Math.random() - 0.5) * volatility;
    const close = basePrice + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    const volume = Math.random() * 1000000 + 500000;

    data.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return data;
}

function getTimeframeMs(timeframe: string): number {
  const map: Record<string, number> = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
  };
  return map[timeframe] || 60 * 60 * 1000;
}

/**
 * Get current market price
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  // In production, this would fetch from real API
  const mockData = generateMockMarketData(symbol, "1m", 1);
  return mockData[0].close;
}

/**
 * Get historical market data
 */
export async function getHistoricalData(
  symbol: string,
  timeframe: string,
  limit: number = 100
): Promise<MarketDataPoint[]> {
  // In production, this would fetch from real API
  return generateMockMarketData(symbol, timeframe, limit);
}

/**
 * Calculate market sentiment from multiple sources
 */
export async function getMarketSentiment(symbol: string): Promise<{
  score: number; // -100 to 100
  sources: Array<{ name: string; sentiment: number }>;
}> {
  // Mock sentiment data
  // In production, this would aggregate from news, social media, etc.
  const sources = [
    { name: "News Sentiment", sentiment: Math.random() * 200 - 100 },
    { name: "Social Media", sentiment: Math.random() * 200 - 100 },
    { name: "Technical Analysis", sentiment: Math.random() * 200 - 100 },
    { name: "Market Momentum", sentiment: Math.random() * 200 - 100 },
  ];

  const score =
    sources.reduce((sum, s) => sum + s.sentiment, 0) / sources.length;

  return { score, sources };
}

/**
 * Get supported trading symbols
 */
export function getSupportedSymbols(): Array<{
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}> {
  return [
    // Forex
    { symbol: "EURUSD", name: "Euro / US Dollar", type: "forex", exchange: "FX" },
    { symbol: "GBPUSD", name: "British Pound / US Dollar", type: "forex", exchange: "FX" },
    { symbol: "USDJPY", name: "US Dollar / Japanese Yen", type: "forex", exchange: "FX" },
    { symbol: "AUDUSD", name: "Australian Dollar / US Dollar", type: "forex", exchange: "FX" },
    { symbol: "USDCAD", name: "US Dollar / Canadian Dollar", type: "forex", exchange: "FX" },

    // Crypto
    { symbol: "BTCUSD", name: "Bitcoin / US Dollar", type: "crypto", exchange: "Crypto" },
    { symbol: "ETHUSD", name: "Ethereum / US Dollar", type: "crypto", exchange: "Crypto" },
    { symbol: "BNBUSD", name: "Binance Coin / US Dollar", type: "crypto", exchange: "Crypto" },
    { symbol: "SOLUSD", name: "Solana / US Dollar", type: "crypto", exchange: "Crypto" },
    { symbol: "ADAUSD", name: "Cardano / US Dollar", type: "crypto", exchange: "Crypto" },

    // Indices
    { symbol: "SPX", name: "S&P 500 Index", type: "index", exchange: "US" },
    { symbol: "DJI", name: "Dow Jones Industrial Average", type: "index", exchange: "US" },
    { symbol: "NDX", name: "NASDAQ 100", type: "index", exchange: "US" },
    { symbol: "DAX", name: "DAX Index", type: "index", exchange: "DE" },
    { symbol: "FTSE", name: "FTSE 100", type: "index", exchange: "UK" },

    // Stocks
    { symbol: "AAPL", name: "Apple Inc.", type: "stock", exchange: "NASDAQ" },
    { symbol: "MSFT", name: "Microsoft Corporation", type: "stock", exchange: "NASDAQ" },
    { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", exchange: "NASDAQ" },
    { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", exchange: "NASDAQ" },
    { symbol: "TSLA", name: "Tesla Inc.", type: "stock", exchange: "NASDAQ" },
  ];
}

/**
 * Get market status
 */
export function getMarketStatus(symbol: string): {
  isOpen: boolean;
  nextOpen?: Date;
  nextClose?: Date;
} {
  // Simplified market hours check
  const now = new Date();
  const hour = now.getUTCHours();
  const day = now.getUTCDay();

  // Crypto markets are always open
  if (symbol.includes("BTC") || symbol.includes("ETH")) {
    return { isOpen: true };
  }

  // Forex markets (Sunday 5pm - Friday 5pm EST)
  if (symbol.includes("USD") || symbol.includes("EUR") || symbol.includes("GBP")) {
    const isWeekend = day === 0 || (day === 6 && hour >= 22) || (day === 1 && hour < 22);
    return { isOpen: !isWeekend };
  }

  // Stock markets (9:30am - 4pm EST, weekdays)
  const isStockHours = hour >= 14 && hour < 21 && day >= 1 && day <= 5;
  return { isOpen: isStockHours };
}

/**
 * Calculate volatility metrics
 */
export function calculateVolatility(data: MarketDataPoint[]): {
  current: number;
  average: number;
  percentile: number;
} {
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    const ret = (data[i].close - data[i - 1].close) / data[i - 1].close;
    returns.push(ret);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
    returns.length;
  const stdDev = Math.sqrt(variance);

  // Annualized volatility
  const current = stdDev * Math.sqrt(252) * 100;

  // Calculate historical average
  const historicalVols = [];
  const windowSize = 20;
  for (let i = windowSize; i < returns.length; i++) {
    const window = returns.slice(i - windowSize, i);
    const windowMean = window.reduce((a, b) => a + b, 0) / window.length;
    const windowVar =
      window.reduce((sum, ret) => sum + Math.pow(ret - windowMean, 2), 0) /
      window.length;
    historicalVols.push(Math.sqrt(windowVar) * Math.sqrt(252) * 100);
  }

  const average =
    historicalVols.reduce((a, b) => a + b, 0) / historicalVols.length;

  // Calculate percentile
  const sorted = [...historicalVols].sort((a, b) => a - b);
  const rank = sorted.findIndex((v) => v >= current);
  const percentile = (rank / sorted.length) * 100;

  return { current, average, percentile };
}

/**
 * Detect market regime
 */
export function detectMarketRegime(data: MarketDataPoint[]): {
  regime: "trending" | "ranging" | "volatile" | "calm";
  confidence: number;
  description: string;
} {
  if (data.length < 50) {
    return {
      regime: "ranging",
      confidence: 50,
      description: "Insufficient data for regime detection",
    };
  }

  const closes = data.map((d) => d.close);
  const volatility = calculateVolatility(data);

  // Calculate trend strength
  const firstHalf = closes.slice(0, Math.floor(closes.length / 2));
  const secondHalf = closes.slice(Math.floor(closes.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trendStrength = Math.abs((secondAvg - firstAvg) / firstAvg) * 100;

  // Determine regime
  if (volatility.current > volatility.average * 1.5) {
    return {
      regime: "volatile",
      confidence: 80,
      description: "High volatility detected, use caution with position sizing",
    };
  } else if (volatility.current < volatility.average * 0.5) {
    return {
      regime: "calm",
      confidence: 75,
      description: "Low volatility period, potential for breakout",
    };
  } else if (trendStrength > 3) {
    return {
      regime: "trending",
      confidence: 85,
      description: "Strong directional movement detected",
    };
  } else {
    return {
      regime: "ranging",
      confidence: 70,
      description: "Market consolidating in range",
    };
  }
}

