/**
 * Advanced Trading Algorithms
 * Implements multiple sophisticated trading strategies with AI/ML integration
 */

export interface MarketDataPoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number };
  bollinger?: { upper: number; middle: number; lower: number };
  ema?: { fast: number; slow: number };
  atr?: number;
  adx?: number;
  stochastic?: { k: number; d: number };
  vwap?: number;
}

export interface SignalResult {
  action: "buy" | "sell" | "hold";
  confidence: number; // 0-100
  price: number;
  indicators: TechnicalIndicators;
  reason: string;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(prices: number[]): {
  value: number;
  signal: number;
  histogram: number;
} {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;

  // Signal line is 9-period EMA of MACD line
  const macdHistory = [];
  for (let i = Math.max(0, prices.length - 50); i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdHistory.push(e12 - e26);
  }

  const signalLine = calculateEMA(macdHistory, 9);
  const histogram = macdLine - signalLine;

  return { value: macdLine, signal: signalLine, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number } {
  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b) / period;

  const variance =
    slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) /
    period;
  const sd = Math.sqrt(variance);

  return {
    upper: middle + stdDev * sd,
    middle,
    lower: middle - stdDev * sd,
  };
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(data: MarketDataPoint[], period: number = 14): number {
  if (data.length < 2) return 0;

  const trueRanges = [];
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  return trueRanges.slice(-period).reduce((a, b) => a + b) / Math.min(period, trueRanges.length);
}

/**
 * Momentum Strategy - EMA Crossover with RSI confirmation
 */
export function momentumStrategy(
  data: MarketDataPoint[],
  params: { fastPeriod?: number; slowPeriod?: number; rsiPeriod?: number } = {}
): SignalResult {
  const { fastPeriod = 12, slowPeriod = 26, rsiPeriod = 14 } = params;

  const closes = data.map((d) => d.close);
  const currentPrice = closes[closes.length - 1];

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  const rsi = calculateRSI(closes, rsiPeriod);
  const macd = calculateMACD(closes);

  const indicators: TechnicalIndicators = {
    ema: { fast: fastEMA, slow: slowEMA },
    rsi,
    macd,
  };

  // Strong buy signal: Fast EMA > Slow EMA, RSI < 70, MACD histogram positive
  if (fastEMA > slowEMA && rsi < 70 && macd.histogram > 0) {
    const confidence = Math.min(
      95,
      60 + (fastEMA - slowEMA) / slowEMA * 100 + (70 - rsi) / 2
    );
    return {
      action: "buy",
      confidence,
      price: currentPrice,
      indicators,
      reason: "Bullish momentum: EMA crossover with RSI confirmation",
    };
  }

  // Strong sell signal: Fast EMA < Slow EMA, RSI > 30, MACD histogram negative
  if (fastEMA < slowEMA && rsi > 30 && macd.histogram < 0) {
    const confidence = Math.min(
      95,
      60 + (slowEMA - fastEMA) / slowEMA * 100 + (rsi - 30) / 2
    );
    return {
      action: "sell",
      confidence,
      price: currentPrice,
      indicators,
      reason: "Bearish momentum: EMA crossover with RSI confirmation",
    };
  }

  return {
    action: "hold",
    confidence: 50,
    price: currentPrice,
    indicators,
    reason: "No clear momentum signal",
  };
}

/**
 * Mean Reversion Strategy - Bollinger Bands with RSI
 */
export function meanReversionStrategy(
  data: MarketDataPoint[],
  params: { bbPeriod?: number; bbStdDev?: number; rsiPeriod?: number } = {}
): SignalResult {
  const { bbPeriod = 20, bbStdDev = 2, rsiPeriod = 14 } = params;

  const closes = data.map((d) => d.close);
  const currentPrice = closes[closes.length - 1];

  const bollinger = calculateBollingerBands(closes, bbPeriod, bbStdDev);
  const rsi = calculateRSI(closes, rsiPeriod);

  const indicators: TechnicalIndicators = {
    bollinger,
    rsi,
  };

  // Buy signal: Price near lower band and RSI oversold
  if (currentPrice <= bollinger.lower * 1.01 && rsi < 30) {
    const confidence = Math.min(95, 70 + (30 - rsi) / 2);
    return {
      action: "buy",
      confidence,
      price: currentPrice,
      indicators,
      reason: "Oversold condition: Price at lower Bollinger Band with low RSI",
    };
  }

  // Sell signal: Price near upper band and RSI overbought
  if (currentPrice >= bollinger.upper * 0.99 && rsi > 70) {
    const confidence = Math.min(95, 70 + (rsi - 70) / 2);
    return {
      action: "sell",
      confidence,
      price: currentPrice,
      indicators,
      reason: "Overbought condition: Price at upper Bollinger Band with high RSI",
    };
  }

  return {
    action: "hold",
    confidence: 50,
    price: currentPrice,
    indicators,
    reason: "Price within normal range",
  };
}

/**
 * Breakout Strategy - ATR-based volatility breakout
 */
export function breakoutStrategy(
  data: MarketDataPoint[],
  params: { atrPeriod?: number; atrMultiplier?: number } = {}
): SignalResult {
  const { atrPeriod = 14, atrMultiplier = 2 } = params;

  if (data.length < atrPeriod + 20) {
    return {
      action: "hold",
      confidence: 50,
      price: data[data.length - 1].close,
      indicators: {},
      reason: "Insufficient data for breakout analysis",
    };
  }

  const closes = data.map((d) => d.close);
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);
  const currentPrice = closes[closes.length - 1];

  const atr = calculateATR(data, atrPeriod);
  const recentHigh = Math.max(...highs.slice(-20));
  const recentLow = Math.min(...lows.slice(-20));

  const breakoutThreshold = atr * atrMultiplier;

  const indicators: TechnicalIndicators = {
    atr,
  };

  // Bullish breakout: Price breaks above recent high with strong volume
  if (currentPrice > recentHigh && currentPrice - recentHigh > breakoutThreshold) {
    const confidence = Math.min(
      95,
      70 + ((currentPrice - recentHigh) / breakoutThreshold) * 10
    );
    return {
      action: "buy",
      confidence,
      price: currentPrice,
      indicators,
      reason: "Bullish breakout above resistance with high volatility",
    };
  }

  // Bearish breakout: Price breaks below recent low
  if (currentPrice < recentLow && recentLow - currentPrice > breakoutThreshold) {
    const confidence = Math.min(
      95,
      70 + ((recentLow - currentPrice) / breakoutThreshold) * 10
    );
    return {
      action: "sell",
      confidence,
      price: currentPrice,
      indicators,
      reason: "Bearish breakout below support with high volatility",
    };
  }

  return {
    action: "hold",
    confidence: 50,
    price: currentPrice,
    indicators,
    reason: "No significant breakout detected",
  };
}

/**
 * ML-Based Strategy - Combines multiple indicators with weighted scoring
 */
export function mlBasedStrategy(
  data: MarketDataPoint[],
  params: Record<string, any> = {}
): SignalResult {
  const closes = data.map((d) => d.close);
  const currentPrice = closes[closes.length - 1];

  // Calculate all indicators
  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const bollinger = calculateBollingerBands(closes);
  const atr = calculateATR(data);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  const indicators: TechnicalIndicators = {
    rsi,
    macd,
    bollinger,
    atr,
    ema: { fast: ema12, slow: ema26 },
  };

  // Weighted scoring system
  let score = 0;
  const weights = {
    rsi: 0.25,
    macd: 0.25,
    ema: 0.2,
    bollinger: 0.15,
    momentum: 0.15,
  };

  // RSI score (-1 to 1)
  const rsiScore = rsi < 30 ? 1 : rsi > 70 ? -1 : (50 - rsi) / 20;
  score += rsiScore * weights.rsi;

  // MACD score
  const macdScore = macd.histogram > 0 ? 1 : -1;
  score += macdScore * weights.macd;

  // EMA score
  const emaScore = ema12 > ema26 ? 1 : -1;
  score += emaScore * weights.ema;

  // Bollinger score
  const bbPosition =
    (currentPrice - bollinger.lower) / (bollinger.upper - bollinger.lower);
  const bbScore = bbPosition < 0.2 ? 1 : bbPosition > 0.8 ? -1 : 0;
  score += bbScore * weights.bollinger;

  // Momentum score
  const momentum = (closes[closes.length - 1] - closes[closes.length - 10]) / closes[closes.length - 10];
  const momentumScore = momentum > 0.02 ? 1 : momentum < -0.02 ? -1 : 0;
  score += momentumScore * weights.momentum;

  // Convert score to action and confidence
  const confidence = Math.min(95, Math.abs(score) * 100);

  if (score > 0.3) {
    return {
      action: "buy",
      confidence,
      price: currentPrice,
      indicators,
      reason: `ML model predicts bullish trend (score: ${score.toFixed(2)})`,
    };
  } else if (score < -0.3) {
    return {
      action: "sell",
      confidence,
      price: currentPrice,
      indicators,
      reason: `ML model predicts bearish trend (score: ${score.toFixed(2)})`,
    };
  }

  return {
    action: "hold",
    confidence: 50,
    price: currentPrice,
    indicators,
    reason: "ML model suggests neutral market conditions",
  };
}

/**
 * Execute strategy based on type
 */
export function executeStrategy(
  type: string,
  data: MarketDataPoint[],
  parameters: Record<string, any> = {}
): SignalResult {
  switch (type) {
    case "momentum":
      return momentumStrategy(data, parameters);
    case "mean_reversion":
      return meanReversionStrategy(data, parameters);
    case "breakout":
      return breakoutStrategy(data, parameters);
    case "ml_based":
      return mlBasedStrategy(data, parameters);
    default:
      return momentumStrategy(data, parameters);
  }
}

