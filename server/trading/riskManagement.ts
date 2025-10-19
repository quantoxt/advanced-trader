/**
 * Advanced Risk Management System
 * Implements comprehensive risk controls and position sizing
 */

export interface RiskParameters {
  maxPositionSize: number; // Maximum position size as % of portfolio
  maxDailyLoss: number; // Maximum daily loss as % of portfolio
  maxDrawdown: number; // Maximum drawdown as % of portfolio
  riskPerTrade: number; // Risk per trade as % of portfolio
  stopLossPercent: number; // Stop loss as % from entry
  takeProfitPercent: number; // Take profit as % from entry
}

export interface PortfolioState {
  balance: number;
  equity: number;
  openPositions: number;
  dailyPnl: number;
  totalPnl: number;
  maxDrawdown: number;
}

export interface PositionSizeResult {
  allowed: boolean;
  size: number;
  reason: string;
  stopLoss: number;
  takeProfit: number;
}

/**
 * Calculate optimal position size based on risk parameters
 */
export function calculatePositionSize(
  entryPrice: number,
  stopLossPrice: number,
  riskAmount: number,
  maxPositionValue: number
): number {
  const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
  if (riskPerUnit === 0) return 0;

  const positionSize = riskAmount / riskPerUnit;
  const positionValue = positionSize * entryPrice;

  // Cap at maximum position value
  if (positionValue > maxPositionValue) {
    return maxPositionValue / entryPrice;
  }

  return positionSize;
}

/**
 * Calculate stop loss and take profit levels
 */
export function calculateLevels(
  entryPrice: number,
  action: "buy" | "sell",
  stopLossPercent: number,
  takeProfitPercent: number
): { stopLoss: number; takeProfit: number } {
  if (action === "buy") {
    return {
      stopLoss: entryPrice * (1 - stopLossPercent / 100),
      takeProfit: entryPrice * (1 + takeProfitPercent / 100),
    };
  } else {
    return {
      stopLoss: entryPrice * (1 + stopLossPercent / 100),
      takeProfit: entryPrice * (1 - takeProfitPercent / 100),
    };
  }
}

/**
 * Check if trade meets risk management criteria
 */
export function validateTrade(
  action: "buy" | "sell",
  price: number,
  portfolio: PortfolioState,
  riskParams: RiskParameters
): PositionSizeResult {
  // Check daily loss limit
  const dailyLossLimit = portfolio.balance * (riskParams.maxDailyLoss / 100);
  if (Math.abs(portfolio.dailyPnl) >= dailyLossLimit) {
    return {
      allowed: false,
      size: 0,
      reason: `Daily loss limit reached (${riskParams.maxDailyLoss}%)`,
      stopLoss: 0,
      takeProfit: 0,
    };
  }

  // Check maximum drawdown
  if (portfolio.maxDrawdown >= riskParams.maxDrawdown) {
    return {
      allowed: false,
      size: 0,
      reason: `Maximum drawdown limit reached (${riskParams.maxDrawdown}%)`,
      stopLoss: 0,
      takeProfit: 0,
    };
  }

  // Calculate position size
  const { stopLoss, takeProfit } = calculateLevels(
    price,
    action,
    riskParams.stopLossPercent,
    riskParams.takeProfitPercent
  );

  const riskAmount = portfolio.balance * (riskParams.riskPerTrade / 100);
  const maxPositionValue = portfolio.balance * (riskParams.maxPositionSize / 100);

  const positionSize = calculatePositionSize(
    price,
    stopLoss,
    riskAmount,
    maxPositionValue
  );

  if (positionSize === 0) {
    return {
      allowed: false,
      size: 0,
      reason: "Position size too small or invalid stop loss",
      stopLoss,
      takeProfit,
    };
  }

  const positionValue = positionSize * price;
  if (positionValue > portfolio.balance) {
    return {
      allowed: false,
      size: 0,
      reason: "Insufficient balance for position",
      stopLoss,
      takeProfit,
    };
  }

  return {
    allowed: true,
    size: positionSize,
    reason: "Trade approved",
    stopLoss,
    takeProfit,
  };
}

/**
 * Calculate portfolio metrics
 */
export function calculatePortfolioMetrics(
  trades: Array<{
    pnl: number;
    status: string;
    openedAt: Date;
    closedAt?: Date;
  }>,
  balance: number
): {
  totalPnl: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
} {
  const closedTrades = trades.filter((t) => t.status === "closed");

  if (closedTrades.length === 0) {
    return {
      totalPnl: 0,
      winRate: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      profitFactor: 0,
    };
  }

  // Total P&L
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);

  // Win rate
  const winners = closedTrades.filter((t) => t.pnl > 0);
  const winRate = (winners.length / closedTrades.length) * 100;

  // Profit factor
  const grossProfit = winners.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(
    closedTrades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0)
  );
  const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

  // Sharpe ratio (simplified)
  const returns = closedTrades.map((t) => (t.pnl / balance) * 100);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
      returns.length
  );
  const sharpeRatio = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252);

  // Maximum drawdown
  let peak = balance;
  let maxDrawdown = 0;
  let runningBalance = balance;

  for (const trade of closedTrades) {
    runningBalance += trade.pnl;
    if (runningBalance > peak) {
      peak = runningBalance;
    }
    const drawdown = ((peak - runningBalance) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return {
    totalPnl,
    winRate,
    sharpeRatio,
    maxDrawdown,
    profitFactor,
  };
}

/**
 * Dynamic position sizing based on Kelly Criterion
 */
export function kellyPositionSize(
  winRate: number,
  avgWin: number,
  avgLoss: number,
  balance: number,
  maxRisk: number = 0.25
): number {
  if (avgLoss === 0 || winRate === 0) return 0;

  const winLossRatio = avgWin / Math.abs(avgLoss);
  const kellyPercent = (winRate * winLossRatio - (1 - winRate)) / winLossRatio;

  // Use fractional Kelly (typically 0.25 to 0.5 of full Kelly)
  const fractionalKelly = Math.max(0, Math.min(kellyPercent * 0.25, maxRisk));

  return balance * fractionalKelly;
}

/**
 * Volatility-adjusted position sizing
 */
export function volatilityAdjustedSize(
  baseSize: number,
  currentVolatility: number,
  avgVolatility: number
): number {
  if (avgVolatility === 0) return baseSize;

  const volatilityRatio = currentVolatility / avgVolatility;

  // Reduce size when volatility is high, increase when low
  const adjustmentFactor = 1 / volatilityRatio;

  // Cap adjustment between 0.5x and 2x
  const cappedFactor = Math.max(0.5, Math.min(2, adjustmentFactor));

  return baseSize * cappedFactor;
}

/**
 * Check correlation between positions to avoid overexposure
 */
export function checkCorrelation(
  existingSymbols: string[],
  newSymbol: string
): { correlated: boolean; reason: string } {
  // Simplified correlation check based on asset classes
  const forexPairs = ["EUR", "GBP", "JPY", "CHF", "AUD", "NZD", "CAD"];
  const cryptos = ["BTC", "ETH", "BNB", "ADA", "SOL", "DOT"];
  const indices = ["SPX", "DJI", "NDX", "DAX", "FTSE"];

  const getAssetClass = (symbol: string): string => {
    if (forexPairs.some((pair) => symbol.includes(pair))) return "forex";
    if (cryptos.some((crypto) => symbol.includes(crypto))) return "crypto";
    if (indices.some((index) => symbol.includes(index))) return "index";
    return "other";
  };

  const newAssetClass = getAssetClass(newSymbol);
  const existingClasses = existingSymbols.map(getAssetClass);

  const sameClassCount = existingClasses.filter(
    (c) => c === newAssetClass
  ).length;

  if (sameClassCount >= 3) {
    return {
      correlated: true,
      reason: `Too many positions in ${newAssetClass} asset class`,
    };
  }

  // Check for direct currency pair correlation
  if (newAssetClass === "forex") {
    const newCurrencies = forexPairs.filter((pair) => newSymbol.includes(pair));
    for (const existing of existingSymbols) {
      const existingCurrencies = forexPairs.filter((pair) =>
        existing.includes(pair)
      );
      const overlap = newCurrencies.filter((c) =>
        existingCurrencies.includes(c)
      );
      if (overlap.length > 0) {
        return {
          correlated: true,
          reason: `Correlated forex pairs: ${overlap.join(", ")}`,
        };
      }
    }
  }

  return {
    correlated: false,
    reason: "No significant correlation detected",
  };
}

/**
 * Emergency stop-loss check
 */
export function shouldTriggerEmergencyStop(
  portfolio: PortfolioState,
  riskParams: RiskParameters
): { stop: boolean; reason: string } {
  // Check daily loss
  const dailyLossPercent = (Math.abs(portfolio.dailyPnl) / portfolio.balance) * 100;
  if (dailyLossPercent >= riskParams.maxDailyLoss) {
    return {
      stop: true,
      reason: `Daily loss limit exceeded: ${dailyLossPercent.toFixed(2)}%`,
    };
  }

  // Check drawdown
  if (portfolio.maxDrawdown >= riskParams.maxDrawdown) {
    return {
      stop: true,
      reason: `Maximum drawdown exceeded: ${portfolio.maxDrawdown.toFixed(2)}%`,
    };
  }

  // Check equity vs balance
  const equityDrawdown = ((portfolio.balance - portfolio.equity) / portfolio.balance) * 100;
  if (equityDrawdown >= riskParams.maxDrawdown * 0.8) {
    return {
      stop: true,
      reason: `Equity drawdown critical: ${equityDrawdown.toFixed(2)}%`,
    };
  }

  return {
    stop: false,
    reason: "All risk parameters within limits",
  };
}

