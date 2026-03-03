import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Auto Strategy Generation
  autoGenerate: router({
    generateStrategies: protectedProcedure
      .input(z.object({
        riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { generateIndividualPairStrategies } = await import("./trading/pairStrategyGenerator");
        
        // Get account balance from portfolio or MT5
        const db = await getDb();
        let accountBalance = 10000; // Default
        
        if (db) {
          const { portfolios } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const portfolio = await db.select().from(portfolios).where(eq(portfolios.userId, ctx.user.id)).limit(1);
          if (portfolio.length > 0) {
            accountBalance = parseFloat(portfolio[0].balance);
          }
        }
        
        // Generate individual strategies for each pair
        const strategies = await generateIndividualPairStrategies(accountBalance, input.riskTolerance);
        
        // Save strategies to database
        if (db) {
          const { tradingStrategies } = await import("../drizzle/schema");
          for (const strategy of strategies) {
            const typeMapping: Record<string, any> = {
              momentum: "momentum",
              meanReversion: "mean_reversion",
              breakout: "breakout",
              scalping: "scalping",
              swing: "swing",
              mlBased: "ml_based",
            };
            await db.insert(tradingStrategies).values({
              id: strategy.id,
              userId: ctx.user.id,
              name: strategy.name,
              type: typeMapping[strategy.algorithm] || "momentum",
              algorithm: strategy.algorithm,
              symbols: strategy.symbol,
              timeframe: strategy.timeframe,
              parameters: JSON.stringify(strategy.parameters),
              status: "active",
            });
          }
        }
        
        return {
          success: true,
          strategies,
          message: `Generated ${strategies.length} optimal trading strategies`,
        };
      }),

    autoGenerateSignals: protectedProcedure
      .input(z.object({
        strategyId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { generateTradingSignals } = await import("./trading/autoTrader");
        
        // Get strategy from database
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { tradingStrategies } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const strategyResult = await db.select().from(tradingStrategies)
          .where(eq(tradingStrategies.id, input.strategyId)).limit(1);
        
        if (strategyResult.length === 0) {
          throw new Error("Strategy not found");
        }
        
        const strategy = strategyResult[0];
        const symbols = strategy.symbols ? strategy.symbols.split(",") : [];
        const parameters = JSON.parse(strategy.parameters);
        const algorithm = strategy.algorithm || strategy.type;
        
        // Generate signals
        const signals = await generateTradingSignals(
          strategy.id,
          symbols,
          algorithm,
          parameters
        );
        
        // Save signals to database
        const { tradingSignals } = await import("../drizzle/schema");
        for (const signal of signals) {
          await db.insert(tradingSignals).values({
            id: signal.id,
            strategyId: signal.strategyId,
            symbol: signal.symbol,
            action: signal.action,
            price: signal.price.toString(),
            confidence: signal.confidence.toString(),
            indicators: JSON.stringify(signal.indicators),
            executed: signal.confidence >= 80 ? "executed" : "pending",
          });
        }
        
        return {
          success: true,
          signals,
          highConfidenceCount: signals.filter(s => s.confidence >= 80).length,
        };
      }),

    startAutoTrading: protectedProcedure.mutation(async ({ ctx }) => {
      const { autoTradingEngine } = await import("./trading/autoTrader");
      const { getMT5Instance } = await import("./trading/mt5Integration");
      
      const mt5 = getMT5Instance();
      const mt5Connected = mt5.isConnected();
      
      // Get active strategies
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { tradingStrategies } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const strategies = await db.select().from(tradingStrategies)
        .where(and(
          eq(tradingStrategies.userId, ctx.user.id),
          eq(tradingStrategies.status, "active")
        ));
      
      const result = await autoTradingEngine.start(strategies, mt5Connected);
      return result;
    }),

    stopAutoTrading: protectedProcedure.mutation(async () => {
      const { autoTradingEngine } = await import("./trading/autoTrader");
      return autoTradingEngine.stop();
    }),

    getAutoTradingStatus: protectedProcedure.query(async () => {
      const { autoTradingEngine } = await import("./trading/autoTrader");
      return autoTradingEngine.getStatus();
    }),
  }),

  // Trading Strategies
  strategies: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const { tradingStrategies } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      return db.select().from(tradingStrategies).where(eq(tradingStrategies.userId, ctx.user.id));
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["momentum", "mean_reversion", "breakout", "ml_based", "sentiment", "arbitrage"]),
        parameters: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { tradingStrategies } = await import("../drizzle/schema");
        const id = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(tradingStrategies).values({
          id,
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          parameters: JSON.stringify(input.parameters),
          status: "paused",
        });
        return { id, success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        status: z.enum(["active", "paused", "backtesting"]).optional(),
        parameters: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { tradingStrategies } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.status) updateData.status = input.status;
        if (input.parameters) updateData.parameters = JSON.stringify(input.parameters);
        updateData.updatedAt = new Date();
        
        await db.update(tradingStrategies)
          .set(updateData)
          .where(and(
            eq(tradingStrategies.id, input.id),
            eq(tradingStrategies.userId, ctx.user.id)
          ));
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { tradingStrategies } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        await db.delete(tradingStrategies).where(and(
          eq(tradingStrategies.id, input.id),
          eq(tradingStrategies.userId, ctx.user.id)
        ));
        return { success: true };
      }),
  }),
  
  // Trading Signals
  signals: router({
    list: protectedProcedure
      .input(z.object({
        strategyId: z.string().optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const { tradingSignals } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        let query = db.select().from(tradingSignals);
        if (input.strategyId) {
          query = query.where(eq(tradingSignals.strategyId, input.strategyId)) as any;
        }
        return query.orderBy(desc(tradingSignals.timestamp)).limit(input.limit);
      }),
    
    generate: protectedProcedure
      .input(z.object({
        strategyId: z.string(),
        symbol: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Get strategy
        const { tradingStrategies, tradingSignals } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const strategies = await db.select().from(tradingStrategies).where(and(
          eq(tradingStrategies.id, input.strategyId),
          eq(tradingStrategies.userId, ctx.user.id)
        ));
        
        if (strategies.length === 0) {
          throw new Error("Strategy not found");
        }
        
        const strategy = strategies[0];
        
        // Get market data
        const { getHistoricalData, getMarketSentiment } = await import("./trading/marketData");
        const marketData = await getHistoricalData(input.symbol, "1h", 100);
        
        // Execute strategy
        const { executeStrategy } = await import("./trading/algorithms");
        const parameters = JSON.parse(strategy.parameters);
        const signal = executeStrategy(strategy.type, marketData, parameters);
        
        // Get sentiment
        const sentiment = await getMarketSentiment(input.symbol);
        
        // Save signal
        const id = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(tradingSignals).values({
          id,
          strategyId: input.strategyId,
          symbol: input.symbol,
          action: signal.action,
          price: signal.price.toString(),
          confidence: Math.round(signal.confidence).toString(),
          indicators: JSON.stringify(signal.indicators),
          sentiment: Math.round(sentiment.score).toString(),
          executed: "pending",
        });
        
        return { ...signal, sentiment: sentiment.score, id };
      }),
  }),
  
  // Market Data
  market: router({
    symbols: publicProcedure.query(async () => {
      const { getSupportedSymbols } = await import("./trading/marketData");
      return getSupportedSymbols();
    }),
    
    data: publicProcedure
      .input(z.object({
        symbol: z.string(),
        timeframe: z.string().default("1h"),
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        const { getHistoricalData } = await import("./trading/marketData");
        return getHistoricalData(input.symbol, input.timeframe, input.limit);
      }),
    
    sentiment: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const { getMarketSentiment } = await import("./trading/marketData");
        return getMarketSentiment(input.symbol);
      }),
    
    regime: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const { getHistoricalData, detectMarketRegime } = await import("./trading/marketData");
        const data = await getHistoricalData(input.symbol, "1h", 100);
        return detectMarketRegime(data);
      }),
  }),
  
  // Portfolio Management
  portfolio: router({
    syncWithMT5: protectedProcedure.mutation(async ({ ctx }) => {
      const { getMT5Instance } = await import("./trading/mt5Integration");
      const mt5 = getMT5Instance();
      
      if (!mt5.isConnected()) {
        throw new Error("MT5 not connected. Please connect your broker account first.");
      }
      
      const accountInfo = await mt5.getAccountInfo();
      if (!accountInfo) {
        throw new Error("Failed to retrieve MT5 account information");
      }
      
      // Update portfolio with MT5 balance
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { portfolios } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const existingPortfolio = await db.select().from(portfolios)
        .where(eq(portfolios.userId, ctx.user.id)).limit(1);
      
      if (existingPortfolio.length > 0) {
        // Update existing portfolio
        await db.update(portfolios)
          .set({
            balance: accountInfo.balance.toString(),
            equity: accountInfo.equity.toString(),
            updatedAt: new Date(),
          })
          .where(eq(portfolios.userId, ctx.user.id));
      } else {
        // Create new portfolio
        const id = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(portfolios).values({
          id,
          userId: ctx.user.id,
          balance: accountInfo.balance.toString(),
          equity: accountInfo.equity.toString(),
          totalPnl: accountInfo.profit.toString(),
          winRate: "0",
        });
      }
      
      return {
        success: true,
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        profit: accountInfo.profit,
      };
    }),

    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const { portfolios } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const results = await db.select().from(portfolios).where(eq(portfolios.userId, ctx.user.id)).limit(1);
      
      if (results.length === 0) {
        // Create default portfolio
        const id = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(portfolios).values({
          id,
          userId: ctx.user.id,
          balance: "10000",
          equity: "10000",
          totalPnl: "0",
          winRate: "0",
        });
        return { id, balance: "10000", equity: "10000", totalPnl: "0", winRate: "0" };
      }
      
      return results[0];
    }),
    
    update: protectedProcedure
      .input(z.object({
        balance: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { portfolios } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        await db.update(portfolios)
          .set({ balance: input.balance, equity: input.balance, updatedAt: new Date() })
          .where(eq(portfolios.userId, ctx.user.id));
        return { success: true };
      }),
  }),
  
  // Risk Management
  risk: router({
    getRules: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const { riskRules } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const results = await db.select().from(riskRules).where(eq(riskRules.userId, ctx.user.id)).limit(1);
      
      if (results.length === 0) {
        // Create default rules
        const id = `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(riskRules).values({
          id,
          userId: ctx.user.id,
          maxPositionSize: "10",
          maxDailyLoss: "5",
          maxDrawdown: "20",
          riskPerTrade: "2",
          stopLossPercent: "2",
          takeProfitPercent: "4",
          enabled: "yes",
        });
        return { id, maxPositionSize: "10", maxDailyLoss: "5", maxDrawdown: "20", riskPerTrade: "2", stopLossPercent: "2", takeProfitPercent: "4", enabled: "yes" };
      }
      
      return results[0];
    }),
    
    updateRules: protectedProcedure
      .input(z.object({
        maxPositionSize: z.string().optional(),
        maxDailyLoss: z.string().optional(),
        maxDrawdown: z.string().optional(),
        riskPerTrade: z.string().optional(),
        stopLossPercent: z.string().optional(),
        takeProfitPercent: z.string().optional(),
        enabled: z.enum(["yes", "no"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { riskRules } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const updateData: any = { ...input, updatedAt: new Date() };
        await db.update(riskRules)
          .set(updateData)
          .where(eq(riskRules.userId, ctx.user.id));
        return { success: true };
      }),
  }),
  
  // Broker Connections (MT5 Integration)
  brokers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const { brokerConnections } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      return db.select().from(brokerConnections).where(eq(brokerConnections.userId, ctx.user.id));
    }),

    // Connect to MT5 broker account
    connectMT5: protectedProcedure
      .input(z.object({
        login: z.number(),
        password: z.string(),
        server: z.string(),
        broker: z.string().default("MT5"),
        accountType: z.enum(["demo", "live"]).default("demo"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getMT5Instance, validateMT5Credentials } = await import("./trading/mt5Integration");

        // Validate credentials
        const validation = validateMT5Credentials({
          login: input.login,
          password: input.password,
          server: input.server,
          broker: input.broker,
        });

        if (!validation.valid) {
          throw new Error(validation.error || "Invalid MT5 credentials");
        }

        // Connect to MT5
        const mt5 = getMT5Instance();
        const connected = await mt5.connect({
          login: input.login,
          password: input.password,
          server: input.server,
          broker: input.broker,
        });

        if (!connected) {
          throw new Error("Failed to connect to MT5. Please check your credentials and ensure MT5 is running.");
        }

        // Get account info with fallback
        let accountInfo = await mt5.getAccountInfo();

        // If account info failed, return a fallback response
        if (!accountInfo) {
          console.warn('[MT5] Could not retrieve account info, using fallback');
          accountInfo = {
            balance: 0,
            equity: 0,
            margin: 0,
            freeMargin: 0,
            marginLevel: 0,
            profit: 0,
            currency: 'USD',
            leverage: 100,
            name: `MT5 Account (${input.login})`,
            company: input.server,
          };
        }

        // Save connection to database
        const db = await getDb();
        if (db) {
          const { brokerConnections } = await import("../drizzle/schema");
          const id = `broker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          await db.insert(brokerConnections).values({
            id,
            userId: ctx.user.id,
            broker: "mt5" as const,
            accountId: input.login.toString(),
            status: "connected",
          });
        }

        return {
          success: true,
          connected: true,
          account: accountInfo,
        };
      }),

    // Get MT5 account status and balance
    getMT5Status: protectedProcedure.query(async ({ ctx }) => {
      const { getMT5Instance } = await import("./trading/mt5Integration");
      const mt5 = getMT5Instance();
      
      if (!mt5.isConnected()) {
        return {
          connected: false,
          message: "Not connected to MT5. Please connect your account first.",
        };
      }
      
      const accountInfo = await mt5.getAccountInfo();
      const positions = await mt5.getPositions();
      
      return {
        connected: true,
        account: accountInfo,
        positions: positions,
        positionCount: positions.length,
      };
    }),

    // Execute trade via MT5
    executeMT5Trade: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        action: z.enum(["buy", "sell"]),
        volume: z.number(),
        stopLoss: z.number().optional(),
        takeProfit: z.number().optional(),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getMT5Instance } = await import("./trading/mt5Integration");
        const mt5 = getMT5Instance();
        
        if (!mt5.isConnected()) {
          throw new Error("Not connected to MT5. Please connect your account first.");
        }
        
        const result = await mt5.executeTrade({
          action: input.action,
          symbol: input.symbol,
          volume: input.volume,
          stopLoss: input.stopLoss,
          takeProfit: input.takeProfit,
          comment: input.comment || "Auto trading bot",
        });
        
        if (!result.success) {
          throw new Error(result.error || "Trade execution failed");
        }
        
        // Log trade to database
        const db = await getDb();
        if (db) {
          const { tradingSignals } = await import("../drizzle/schema");
          const id = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          await db.insert(tradingSignals).values({
            id,
            strategyId: "mt5_manual",
            symbol: input.symbol,
            action: input.action,
            price: result.price?.toString() || "0",
            confidence: "100",
            executed: "executed",
          });
        }
        
        return result;
      }),

    // Disconnect from MT5
    disconnectMT5: protectedProcedure.mutation(async ({ ctx }) => {
      const { getMT5Instance } = await import("./trading/mt5Integration");
      const mt5 = getMT5Instance();
      await mt5.disconnect();
      
      return { success: true, message: "Disconnected from MT5" };
    }),
    
    add: protectedProcedure
      .input(z.object({
        broker: z.enum(["mt4", "mt5", "interactive_brokers", "alpaca", "binance", "coinbase"]),
        accountId: z.string(),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { brokerConnections } = await import("../drizzle/schema");
        const id = `broker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(brokerConnections).values({
          id,
          userId: ctx.user.id,
          broker: input.broker,
          accountId: input.accountId,
          apiKey: input.apiKey || null,
          apiSecret: input.apiSecret || null,
          status: "connected",
        });
        return { id, success: true };
      }),
  }),
  
  // Automation Engine
  automation: router({
    start: protectedProcedure
      .input(z.object({
        accountBalance: z.number().optional(),
        riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getAutomationEngine } = await import("./trading/automationEngine");
        const engine = getAutomationEngine(ctx.user.id);
        
        const accountBalance = input.accountBalance || 100000; // Default to demo balance
        const result = await engine.start(accountBalance, input.riskTolerance);
        
        return result;
      }),
    
    stop: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { getAutomationEngine } = await import("./trading/automationEngine");
        const engine = getAutomationEngine(ctx.user.id);
        
        return engine.stop();
      }),
    
    status: protectedProcedure
      .query(async ({ ctx }) => {
        const { getAutomationEngine } = await import("./trading/automationEngine");
        const engine = getAutomationEngine(ctx.user.id);
        
        return engine.getStatus();
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
