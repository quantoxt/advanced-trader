/**
 * Dynamic Position Sizing with ATR-based Stops
 *
 * Calculates optimal lot sizes based on:
 * - Current account equity (not balance - reflects open P&L)
 * - Signal confidence (only trades 80%+ confidence)
 * - ATR-based volatility adjustment
 * - Total exposure limit (max 20% of account)
 */

import { getMarketDataService } from "./realMarketData";

export interface PositionSizeResult {
  lotSize: number;
  stopLoss: number;
  takeProfit: number;
  atr: number;
  riskAmount: number;
  exposurePercent: number;
  reason: string;
}

export interface MarketData {
  currentPrice: number;
  high: number;
  low: number;
  close: number;
  // Previous candles for ATR calculation
  history?: Array<{ high: number; low: number; close: number }>;
}

/**
 * Calculate ATR (Average True Range) for volatility measurement
 * Uses Wilder's smoothing method
 */
export function calculateATR(
  period: number,
  candles: Array<{ high: number; low: number; close: number }>
): number {
  if (candles.length < period + 1) {
    // Fallback to simple high-low range if not enough data
    let sumRange = 0;
    for (const candle of candles) {
      sumRange += candle.high - candle.low;
    }
    return sumRange / candles.length;
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    const highLow = current.high - current.low;
    const highClose = Math.abs(current.high - previous.close);
    const lowClose = Math.abs(current.low - previous.close);

    const trueRange = Math.max(highLow, highClose, lowClose);
    trueRanges.push(trueRange);
  }

  // Calculate ATR using Wilder's smoothing
  let atr = trueRanges[0];
  for (let i = 1; i < Math.min(period, trueRanges.length); i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }

  return atr;
}

/**
 * Generate synthetic historical data for ATR calculation
 * In production, this would fetch real historical candles from MT5 or an API
 */
async function generateHistoricalData(symbol: string, period: number = 14): Promise<Array<{ high: number; low: number; close: number }>> {
  const marketService = getMarketDataService();
  const currentData = await marketService.getPrice(symbol);

  if (!currentData) {
    // Return dummy data if price fetch fails
    const basePrice = symbol.includes('JPY') ? 150.0 : 1.1;
    return Array.from({ length: period + 5 }, () => ({
      high: basePrice * (1 + Math.random() * 0.01),
      low: basePrice * (1 - Math.random() * 0.01),
      close: basePrice,
    }));
  }

  const currentPrice = currentData.price;
  const volatility = symbol.includes('BTC') || symbol.includes('ETH') ? 0.02 : 0.005;

  // Generate synthetic candles based on current price and historical volatility
  return Array.from({ length: period + 5 }, (_, i) => {
    const offset = (period + 5 - i) * volatility * 0.5;
    const base = currentPrice * (1 - offset);
    const range = base * volatility;

    return {
      high: base + range * Math.random(),
      low: base - range * Math.random(),
      close: base + (Math.random() - 0.5) * range,
    };
  });
}

/**
 * Calculate ATR-based stop loss distance
 * Higher ATR (volatility) = wider stops to avoid being stopped out by noise
 */
function calculateATRStops(
  atr: number,
  currentPrice: number,
  action: 'buy' | 'sell',
  atrMultiplier: number = 1.5,
  riskRewardRatio: number = 2.0
): { stopLoss: number; takeProfit: number; atrDistance: number } {
  const atrDistance = atr * atrMultiplier;

  let stopLoss: number;
  let takeProfit: number;

  if (action === 'buy') {
    stopLoss = currentPrice - atrDistance;
    takeProfit = currentPrice + (atrDistance * riskRewardRatio);
  } else {
    stopLoss = currentPrice + atrDistance;
    takeProfit = currentPrice - (atrDistance * riskRewardRatio);
  }

  return { stopLoss, takeProfit, atrDistance };
}

/**
 * Get pip value for a symbol
 */
function getPipValue(symbol: string): number {
  const lowerSymbol = symbol.toLowerCase();

  if (lowerSymbol.includes('jpy')) {
    return 0.01; // JPY pairs: 3 decimals
  }
  if (lowerSymbol.includes('btc') || lowerSymbol.includes('eth')) {
    return 1.0; // Crypto: whole numbers
  }
  return 0.0001; // Most forex pairs: 5 decimals
}

/**
 * Calculate optimal lot size based on multiple factors
 *
 * @param accountEquity - Current account equity (balance + unrealized P&L)
 * @param riskPercent - Risk per trade as percentage (e.g., 1 for 1%)
 * @param signalConfidence - Signal confidence (50-100), only 80+ trades
 * @param symbol - Trading symbol
 * @param currentPrice - Current market price
 * @param atr - Current ATR value
 * @param stopDistance - Stop loss distance in price units
 * @param totalOpenExposure - Total value of all open positions
 * @param maxTotalExposurePercent - Maximum total exposure (e.g., 20 for 20%)
 */
export function calculateDynamicLotSize(params: {
  accountEquity: number;
  riskPercent: number;
  signalConfidence: number;
  symbol: string;
  currentPrice: number;
  atr: number;
  stopDistance: number;
  totalOpenExposure: number;
  maxTotalExposurePercent: number;
}): PositionSizeResult {
  const {
    accountEquity,
    riskPercent,
    signalConfidence,
    symbol,
    currentPrice,
    atr,
    stopDistance,
    totalOpenExposure,
    maxTotalExposurePercent,
  } = params;

  // Skip if confidence is below 80%
  if (signalConfidence < 80) {
    return {
      lotSize: 0,
      stopLoss: 0,
      takeProfit: 0,
      atr,
      riskAmount: 0,
      exposurePercent: 0,
      reason: `Confidence too low (${signalConfidence}% < 80%)`,
    };
  }

  // Calculate base risk amount from account equity
  const baseRiskAmount = accountEquity * (riskPercent / 100);

  // Confidence scaling: 80% = 0.8x, 90% = 1.0x, 100% = 1.1x (max 1.1)
  const confidenceMultiplier = Math.min(1.1, Math.max(0.8, signalConfidence / 90));

  // ATR volatility adjustment: higher ATR = smaller position
  // Normalize ATR to roughly 0.0001 for EURUSD as baseline
  const pipValue = getPipValue(symbol);
  const normalizedATR = atr / pipValue;
  const atrMultiplier = Math.max(0.5, Math.min(1.5, 20 / (normalizedATR + 10)));

  // Calculate adjusted risk amount
  const adjustedRisk = baseRiskAmount * confidenceMultiplier * atrMultiplier;

  // Calculate lot size based on stop distance
  // Formula: Lot Size = Risk Amount / (Stop Distance × Contract Size)
  // For forex: 1 lot = 100,000 units, so pip value is ~$10/pip for EURUSD
  const contractSize = 100000; // Standard lot
  const pipValuePerLot = contractSize * pipValue;
  const stopLossInPips = stopDistance / pipValue;

  // Lot size calculation
  let lotSize = adjustedRisk / (stopLossInPips * pipValuePerLot / pipValue);

  // Calculate what this trade's exposure would be
  const tradeExposure = lotSize * contractSize * currentPrice;
  const newTotalExposure = totalOpenExposure + tradeExposure;
  const newExposurePercent = (newTotalExposure / accountEquity) * 100;

  // Check if we'd exceed max exposure
  if (newExposurePercent > maxTotalExposurePercent) {
    // Reduce lot size to fit within exposure limit
    const maxAllowedExposure = (maxTotalExposurePercent / 100) * accountEquity - totalOpenExposure;
    lotSize = maxAllowedExposure / (contractSize * currentPrice);

    if (lotSize <= 0) {
      return {
        lotSize: 0,
        stopLoss: 0,
        takeProfit: 0,
        atr,
        riskAmount: 0,
        exposurePercent: (totalOpenExposure / accountEquity) * 100,
        reason: `Max exposure reached (${((totalOpenExposure / accountEquity) * 100).toFixed(1)}% / ${maxTotalExposurePercent}%)`,
      };
    }
  }

  // Clamp to broker min/max
  const minLot = 0.01;
  const maxLot = 100; // Most brokers cap at 100 lots
  lotSize = Math.max(minLot, Math.min(maxLot, lotSize));

  // Calculate ATR-based stops
  const { stopLoss, takeProfit, atrDistance } = calculateATRStops(
    atr,
    currentPrice,
    'buy', // Will be set by caller based on actual direction
    1.5, // 1.5x ATR for stop
    2.0  // 2:1 risk-reward
  );

  return {
    lotSize: Math.round(lotSize * 100) / 100, // Round to 2 decimal places
    stopLoss,
    takeProfit,
    atr,
    riskAmount: adjustedRisk,
    exposurePercent: newExposurePercent,
    reason: `Calculated from equity ($${accountEquity.toFixed(2)}), confidence ${signalConfidence}%, ATR ${atr.toFixed(5)}`,
  };
}

/**
 * Main function to calculate dynamic position size for a trade
 */
export async function calculateOptimalPosition(params: {
  accountEquity: number;
  accountBalance: number;
  riskPercent: number;
  signalConfidence: number;
  symbol: string;
  action: 'buy' | 'sell';
  totalOpenExposure: number;
  maxTotalExposurePercent: number;
  atrPeriod?: number;
  atrMultiplier?: number;
  riskRewardRatio?: number;
}): Promise<PositionSizeResult> {
  const {
    symbol,
    action,
    atrPeriod = 14,
    atrMultiplier = 1.5,
    riskRewardRatio = 2.0,
  } = params;

  // Get current price
  const marketService = getMarketDataService();
  const priceData = await marketService.getPrice(symbol);

  if (!priceData) {
    return {
      lotSize: 0,
      stopLoss: 0,
      takeProfit: 0,
      atr: 0,
      riskAmount: 0,
      exposurePercent: 0,
      reason: 'Failed to fetch current price',
    };
  }

  const currentPrice = priceData.price;

  // Generate historical data for ATR calculation
  const historicalData = await generateHistoricalData(symbol, atrPeriod);

  // Calculate ATR
  const atr = calculateATR(atrPeriod, historicalData);

  // Calculate ATR-based stops for the specific direction
  const { stopLoss, takeProfit, atrDistance } = calculateATRStops(
    atr,
    currentPrice,
    action,
    atrMultiplier,
    riskRewardRatio
  );

  // Calculate stop distance
  const stopDistance = Math.abs(currentPrice - stopLoss);

  // Calculate lot size
  const result = calculateDynamicLotSize({
    ...params,
    currentPrice,
    atr,
    stopDistance,
  });

  // Override SL/TP with direction-specific values
  return {
    ...result,
    stopLoss,
    takeProfit,
  };
}
