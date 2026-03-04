/**
 * Full Automation Engine
 * Automatically generates strategies, signals, and executes trades
 * Runs continuously with high-frequency signal generation (1-5 minutes)
 */

import { getDb } from "../db";
import { generateIndividualPairStrategies } from "./pairStrategyGenerator";
import { generateTradingSignals } from "./autoTrader";
import { getMT5Instance } from "./mt5Integration";
import { isMarketOpen, getMarketStatus } from "./marketHours";

export class AutomationEngine {
  private isRunning: boolean = false;
  private signalInterval: NodeJS.Timeout | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    // Use the shared MT5 instance instead of creating a new wrapper
  }

  /**
   * Get the shared MT5 instance
   */
  private getMT5() {
    return getMT5Instance();
  }

  /**
   * Start full automation
   */
  async start(accountBalance: number, riskTolerance: "conservative" | "moderate" | "aggressive" = "moderate") {
    if (this.isRunning) {
      console.log('[Automation] Already running');
      return { success: false, message: "Automation already running" };
    }

    console.log('[Automation] Starting full automation engine...');
    this.isRunning = true;

    try {
      // Step 1: Auto-generate risk rules
      await this.autoGenerateRiskRules(accountBalance, riskTolerance);
      
      // Step 2: Auto-generate 15 individual strategies
      const strategies = await this.autoGenerateStrategies(accountBalance, riskTolerance);
      
      // Step 3: Start high-frequency signal generation (every 1-5 minutes)
      this.startSignalGeneration(strategies);
      
      console.log('[Automation] Full automation started successfully');
      return { 
        success: true, 
        message: "Full automation started",
        strategiesCount: strategies.length 
      };
    } catch (error) {
      console.error('[Automation] Failed to start:', error);
      this.isRunning = false;
      return { success: false, message: "Failed to start automation" };
    }
  }

  /**
   * Stop automation
   */
  stop() {
    console.log('[Automation] Stopping automation engine...');
    this.isRunning = false;
    
    if (this.signalInterval) {
      clearInterval(this.signalInterval);
      this.signalInterval = null;
    }
    
    return { success: true, message: "Automation stopped" };
  }

  /**
   * Auto-generate risk rules based on account balance
   */
  private async autoGenerateRiskRules(accountBalance: number, riskTolerance: string) {
    console.log('[Automation] Auto-generating risk rules...');
    
    const db = await getDb();
    if (!db) return;

    const { riskRules } = await import("../../drizzle/schema");
    
    // Check if risk rules already exist
    const { eq } = await import("drizzle-orm");
    const existing = await db.select().from(riskRules).where(eq(riskRules.userId, this.userId)).limit(1);
    
    if (existing.length > 0) {
      console.log('[Automation] Risk rules already exist');
      return;
    }

    // Generate optimal risk rules based on tolerance
    const riskParams: Record<string, any> = {
      conservative: {
        maxPositionSize: "0.02", // 2% per trade
        maxDailyLoss: "0.05",    // 5% daily loss limit
        maxDrawdown: "0.10",     // 10% max drawdown
        riskPerTrade: "0.01",    // 1% risk per trade
        stopLossPercent: "0.02", // 2% stop loss
        takeProfitPercent: "0.04", // 4% take profit (2:1 ratio)
      },
      moderate: {
        maxPositionSize: "0.03",
        maxDailyLoss: "0.08",
        maxDrawdown: "0.15",
        riskPerTrade: "0.02",
        stopLossPercent: "0.03",
        takeProfitPercent: "0.06",
      },
      aggressive: {
        maxPositionSize: "0.05",
        maxDailyLoss: "0.12",
        maxDrawdown: "0.20",
        riskPerTrade: "0.03",
        stopLossPercent: "0.04",
        takeProfitPercent: "0.08",
      },
    };

    const id = `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const selectedParams: any = riskParams[riskTolerance] || riskParams["moderate"];
    
    await db.insert(riskRules).values({
      id,
      userId: this.userId,
      maxPositionSize: selectedParams.maxPositionSize,
      maxDailyLoss: selectedParams.maxDailyLoss,
      maxDrawdown: selectedParams.maxDrawdown,
      riskPerTrade: selectedParams.riskPerTrade,
      stopLossPercent: selectedParams.stopLossPercent,
      takeProfitPercent: selectedParams.takeProfitPercent,
      enabled: "yes",
    });

    console.log('[Automation] Risk rules created successfully');
  }

  /**
   * Auto-generate 15 individual strategies
   */
  private async autoGenerateStrategies(accountBalance: number, riskTolerance: string) {
    console.log('[Automation] Auto-generating 15 individual strategies...');
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { tradingStrategies } = await import("../../drizzle/schema");
    
    // Check if strategies already exist
    const { eq } = await import("drizzle-orm");
    const existing = await db.select().from(tradingStrategies).where(eq(tradingStrategies.userId, this.userId));
    
    if (existing.length >= 15) {
      console.log('[Automation] Strategies already exist, using existing ones');
      return existing;
    }

    // Generate individual strategies for each pair
    const strategies = await generateIndividualPairStrategies(
      accountBalance,
      riskTolerance as "conservative" | "moderate" | "aggressive"
    );

    // Save to database
    const typeMapping: Record<string, "momentum" | "mean_reversion" | "breakout" | "ml_based" | "sentiment" | "arbitrage" | "scalping" | "swing"> = {
      momentum: "momentum",
      meanReversion: "mean_reversion",
      breakout: "breakout",
      scalping: "scalping",
      swing: "swing",
      mlBased: "ml_based",
    };

    for (const strategy of strategies) {
      await db.insert(tradingStrategies).values({
        id: strategy.id,
        userId: this.userId,
        name: strategy.name,
        type: typeMapping[strategy.algorithm] || "momentum",
        algorithm: strategy.algorithm,
        symbols: strategy.symbol,
        timeframe: strategy.timeframe,
        parameters: JSON.stringify(strategy.parameters),
        status: "active",
      });
    }

    console.log(`[Automation] Created ${strategies.length} strategies`);
    return strategies;
  }

  /**
   * Start high-frequency signal generation
   * Generates signals every 1-5 minutes for all strategies
   */
  private startSignalGeneration(strategies: any[]) {
    console.log('[Automation] Starting high-frequency signal generation...');
    
    // Generate signals immediately
    this.generateSignalsForAllStrategies(strategies);
    
    // Then generate every 2 minutes (balanced between 1-5 min range)
    this.signalInterval = setInterval(() => {
      if (this.isRunning) {
        this.generateSignalsForAllStrategies(strategies);
      }
    }, 2 * 60 * 1000); // 2 minutes
    
    console.log('[Automation] Signal generation started (every 2 minutes)');
  }

  /**
   * Generate signals for all strategies
   */
  private async generateSignalsForAllStrategies(strategies: any[]) {
    console.log(`[Automation] Generating signals for ${strategies.length} strategies...`);
    
    const db = await getDb();
    if (!db) return;

    const { tradingSignals } = await import("../../drizzle/schema");
    let signalsGenerated = 0;
    let tradesExecuted = 0;

    for (const strategy of strategies) {
      try {
        // Check if market is open for this symbol
        const symbols = strategy.symbol ? [strategy.symbol] : (strategy.symbols ? strategy.symbols.split(',') : []);
        const symbol = symbols[0];
        
        const marketStatus = isMarketOpen(symbol);
        if (!marketStatus.isOpen) {
          console.log(`[Automation] ⏸️  Skipping ${symbol} - ${marketStatus.reason}`);
          continue;
        }
        
        // Generate signal for this strategy
        const params = JSON.parse(strategy.parameters || "{}");
        const signals = await generateTradingSignals(strategy.id, symbols, strategy.algorithm || 'momentum', params);
        
        if (signals.length === 0) continue;
        const signal = signals[0];
        
        // Only save and execute high-confidence signals (50%+)
        if (signal.confidence >= 50) {
          const id = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Determine execution status
          const isConnected = this.getMT5().isConnected();
          let executionStatus: "pending" | "executed" | "cancelled" = "pending";
          if (signal.confidence >= 80 && isConnected) {
            executionStatus = "executed";
          }
          
          // Save signal to database
          await db.insert(tradingSignals).values({
            id,
            strategyId: strategy.id,
            symbol: strategy.symbol || strategy.symbols,
            action: signal.action,
            price: signal.price.toString(),
            confidence: Math.round(signal.confidence).toString(),
            indicators: JSON.stringify(signal.indicators),
            sentiment: "0",
            executed: executionStatus,
          });
          
          signalsGenerated++;
          
          // Auto-execute if confidence >= 80%
          if (signal.confidence >= 80) {
            await this.autoExecuteTrade(strategy, signal);
            tradesExecuted++;
          }
        }
      } catch (error) {
        console.error(`[Automation] Failed to generate signal for ${strategy.name}:`, error);
      }
    }

    console.log(`[Automation] Generated ${signalsGenerated} signals, executed ${tradesExecuted} trades`);
  }

  /**
   * Calculate pip value for a symbol based on its price structure
   */
  private getPipValue(symbol: string): number {
    // Returns the value of 1 pip for the symbol
    const lowerSymbol = symbol.toLowerCase();

    // JPY pairs (XXXJPY): 3 decimal places, 1 pip = 0.01
    if (lowerSymbol.includes('jpy')) {
      return 0.01;
    }

    // Crypto and indices: varies, typically 2 decimal places
    if (lowerSymbol.includes('btc') || lowerSymbol.includes('eth') || lowerSymbol.includes('crypto')) {
      return 1.0; // For crypto, 1 point = 1 unit
    }

    // Most forex pairs (EURUSD, GBPUSD, etc.): 5 decimal places, 1 pip = 0.0001
    if (lowerSymbol.includes('usd') || lowerSymbol.includes('eur') || lowerSymbol.includes('gbp') ||
        lowerSymbol.includes('chf') || lowerSymbol.includes('aud') || lowerSymbol.includes('cad') ||
        lowerSymbol.includes('nzd')) {
      return 0.0001;
    }

    // Default for others
    return 0.0001;
  }

  /**
   * Calculate stop loss and take profit based on current price and pips
   */
  private calculateStops(action: 'buy' | 'sell', currentPrice: number, stopLossPips: number, takeProfitPips: number) {
    const pipValue = this.getPipValue(action === 'buy' ? this.currentSymbol || 'EURUSD' : this.currentSymbol || 'EURUSD');

    if (action === 'buy') {
      return {
        stopLoss: currentPrice - (stopLossPips * pipValue),
        takeProfit: currentPrice + (takeProfitPips * pipValue),
      };
    } else {
      return {
        stopLoss: currentPrice + (stopLossPips * pipValue),
        takeProfit: currentPrice - (takeProfitPips * pipValue),
      };
    }
  }

  // Store current symbol for pip calculation
  private currentSymbol: string = '';

  /**
   * Auto-execute trade on MT5
   */
  private async autoExecuteTrade(strategy: any, signal: any) {
    try {
      const mt5 = this.getMT5();

      console.log(`[Automation] Checking MT5 connection before trade...`);
      if (!mt5.isConnected()) {
        console.warn('[Automation] MT5 not connected, skipping trade execution');
        return;
      }
      console.log(`[Automation] MT5 connected, proceeding with trade execution`);

      const params = JSON.parse(strategy.parameters || "{}");
      const positionSize = params.positionSize || 0.01;
      const symbol = strategy.symbol || strategy.symbols;
      this.currentSymbol = symbol;

      // Get current price for dynamic SL/TP calculation
      const priceData = await mt5.getPrice(symbol);
      if (!priceData.success || !priceData.bid) {
        console.error(`[Automation] Could not get current price for ${symbol}, skipping trade`);
        return;
      }

      const currentPrice = priceData.ask || priceData.bid || signal.price;

      // Convert pips to actual price values
      const stopLossPips = params.stopLoss * 1000; // Convert to pips (e.g., 0.001 → 1 pip for most pairs)
      const takeProfitPips = params.takeProfit * 1000;

      const stops = this.calculateStops(signal.action as 'buy' | 'sell', currentPrice, stopLossPips, takeProfitPips);

      console.log(`[Automation] Dynamic stops for ${symbol} @ ${currentPrice}: SL=${stops.stopLoss.toFixed(5)}, TP=${stops.takeProfit.toFixed(5)}`);

      const tradeRequest = {
        action: signal.action as "buy" | "sell",
        symbol: symbol,
        volume: positionSize,
        stopLoss: stops.stopLoss,
        takeProfit: stops.takeProfit,
        comment: `Auto: ${strategy.name} (${Math.round(signal.confidence)}%)`,
      };

      console.log(`[Automation] Executing trade: ${signal.action} ${symbol} x${positionSize} lots`);

      const result = await mt5.executeTrade(tradeRequest);

      console.log(`[Automation] Trade result:`, result);

      if (result.success) {
        console.log(`[Automation] ✓ Trade executed: ${signal.action} ${tradeRequest.symbol} @ ${result.price} (ticket: ${result.ticket})`);

        // Save trade to database
        const db = await getDb();
        if (db) {
          const { trades } = await import("../../drizzle/schema");
          const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          await db.insert(trades).values({
            id: tradeId,
            userId: this.userId,
            symbol: tradeRequest.symbol,
            action: signal.action,
            quantity: tradeRequest.volume.toString(),
            entryPrice: result.price?.toString() || signal.price.toString(),
            stopLoss: tradeRequest.stopLoss?.toString(),
            takeProfit: tradeRequest.takeProfit?.toString(),
            status: "open",
          });
        }
      } else {
        console.error(`[Automation] ✗ Trade failed: ${result.error} (code: ${result.errorCode})`);
      }
    } catch (error) {
      console.error('[Automation] Failed to execute trade:', error);
    }
  }

  /**
   * Connect to MT5 broker
   */
  async connectMT5(credentials: { login: number; password: string; server: string; broker?: string }) {
    const connected = await this.getMT5().connect({
      login: credentials.login.toString(),
      password: credentials.password,
      server: credentials.server,
    });
    if (connected) {
      console.log('[Automation] MT5 connected successfully');
    }
    return connected;
  }

  /**
   * Get automation status
   */
  getStatus() {
    try {
      return {
        isRunning: this.isRunning,
        mt5Connected: this.getMT5().isConnected(),
      };
    } catch (error: any) {
      console.error('[Automation] Error getting status:', error?.message || error);
      return {
        isRunning: this.isRunning,
        mt5Connected: false,
        error: error?.message || 'Unknown error',
      };
    }
  }
}

// Global automation instance per user
const automationInstances = new Map<string, AutomationEngine>();

export function getAutomationEngine(userId: string): AutomationEngine {
  if (!automationInstances.has(userId)) {
    automationInstances.set(userId, new AutomationEngine(userId));
  }
  return automationInstances.get(userId)!;
}

