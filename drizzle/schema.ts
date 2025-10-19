import { mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Trading Strategies Table
export const tradingStrategies = mysqlTable("tradingStrategies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["momentum", "mean_reversion", "breakout", "ml_based", "sentiment", "arbitrage"]).notNull(),
  status: mysqlEnum("status", ["active", "paused", "backtesting"]).default("paused").notNull(),
  parameters: text("parameters").notNull(), // JSON string
  performance: text("performance"), // JSON string with metrics
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type TradingStrategy = typeof tradingStrategies.$inferSelect;
export type InsertTradingStrategy = typeof tradingStrategies.$inferInsert;

// Trading Signals Table
export const tradingSignals = mysqlTable("tradingSignals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  strategyId: varchar("strategyId", { length: 64 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  action: mysqlEnum("action", ["buy", "sell", "hold"]).notNull(),
  price: varchar("price", { length: 20 }).notNull(),
  confidence: varchar("confidence", { length: 10 }).notNull(), // 0-100
  indicators: text("indicators"), // JSON string
  sentiment: varchar("sentiment", { length: 10 }), // -100 to 100
  timestamp: timestamp("timestamp").defaultNow(),
  executed: mysqlEnum("executed", ["pending", "executed", "cancelled"]).default("pending").notNull(),
});

export type TradingSignal = typeof tradingSignals.$inferSelect;
export type InsertTradingSignal = typeof tradingSignals.$inferInsert;

// Trades Table
export const trades = mysqlTable("trades", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  signalId: varchar("signalId", { length: 64 }),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  action: mysqlEnum("action", ["buy", "sell"]).notNull(),
  quantity: varchar("quantity", { length: 20 }).notNull(),
  entryPrice: varchar("entryPrice", { length: 20 }).notNull(),
  exitPrice: varchar("exitPrice", { length: 20 }),
  stopLoss: varchar("stopLoss", { length: 20 }),
  takeProfit: varchar("takeProfit", { length: 20 }),
  pnl: varchar("pnl", { length: 20 }),
  status: mysqlEnum("status", ["open", "closed", "cancelled"]).default("open").notNull(),
  openedAt: timestamp("openedAt").defaultNow(),
  closedAt: timestamp("closedAt"),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

// Portfolio Table
export const portfolios = mysqlTable("portfolios", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  balance: varchar("balance", { length: 20 }).notNull(),
  equity: varchar("equity", { length: 20 }).notNull(),
  totalPnl: varchar("totalPnl", { length: 20 }).notNull(),
  winRate: varchar("winRate", { length: 10 }).notNull(),
  sharpeRatio: varchar("sharpeRatio", { length: 10 }),
  maxDrawdown: varchar("maxDrawdown", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

// Market Data Cache Table
export const marketData = mysqlTable("marketData", {
  id: varchar("id", { length: 64 }).primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  timeframe: varchar("timeframe", { length: 10 }).notNull(),
  open: varchar("open", { length: 20 }).notNull(),
  high: varchar("high", { length: 20 }).notNull(),
  low: varchar("low", { length: 20 }).notNull(),
  close: varchar("close", { length: 20 }).notNull(),
  volume: varchar("volume", { length: 20 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = typeof marketData.$inferInsert;

// Risk Management Rules Table
export const riskRules = mysqlTable("riskRules", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  maxPositionSize: varchar("maxPositionSize", { length: 10 }).notNull(),
  maxDailyLoss: varchar("maxDailyLoss", { length: 10 }).notNull(),
  maxDrawdown: varchar("maxDrawdown", { length: 10 }).notNull(),
  riskPerTrade: varchar("riskPerTrade", { length: 10 }).notNull(),
  stopLossPercent: varchar("stopLossPercent", { length: 10 }).notNull(),
  takeProfitPercent: varchar("takeProfitPercent", { length: 10 }).notNull(),
  enabled: mysqlEnum("enabled", ["yes", "no"]).default("yes").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type RiskRule = typeof riskRules.$inferSelect;
export type InsertRiskRule = typeof riskRules.$inferInsert;

// Broker Connections Table
export const brokerConnections = mysqlTable("brokerConnections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  broker: mysqlEnum("broker", ["mt4", "mt5", "interactive_brokers", "alpaca", "binance", "coinbase"]).notNull(),
  accountId: varchar("accountId", { length: 255 }).notNull(),
  apiKey: text("apiKey"),
  apiSecret: text("apiSecret"),
  status: mysqlEnum("status", ["connected", "disconnected", "error"]).default("disconnected").notNull(),
  lastSync: timestamp("lastSync"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type BrokerConnection = typeof brokerConnections.$inferSelect;
export type InsertBrokerConnection = typeof brokerConnections.$inferInsert;
