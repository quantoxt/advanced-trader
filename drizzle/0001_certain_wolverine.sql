CREATE TABLE `brokerConnections` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`broker` enum('mt4','mt5','interactive_brokers','alpaca','binance','coinbase') NOT NULL,
	`accountId` varchar(255) NOT NULL,
	`apiKey` text,
	`apiSecret` text,
	`status` enum('connected','disconnected','error') NOT NULL DEFAULT 'disconnected',
	`lastSync` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `brokerConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketData` (
	`id` varchar(64) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`timeframe` varchar(10) NOT NULL,
	`open` varchar(20) NOT NULL,
	`high` varchar(20) NOT NULL,
	`low` varchar(20) NOT NULL,
	`close` varchar(20) NOT NULL,
	`volume` varchar(20) NOT NULL,
	`timestamp` timestamp NOT NULL,
	CONSTRAINT `marketData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`balance` varchar(20) NOT NULL,
	`equity` varchar(20) NOT NULL,
	`totalPnl` varchar(20) NOT NULL,
	`winRate` varchar(10) NOT NULL,
	`sharpeRatio` varchar(10),
	`maxDrawdown` varchar(10),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskRules` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`maxPositionSize` varchar(10) NOT NULL,
	`maxDailyLoss` varchar(10) NOT NULL,
	`maxDrawdown` varchar(10) NOT NULL,
	`riskPerTrade` varchar(10) NOT NULL,
	`stopLossPercent` varchar(10) NOT NULL,
	`takeProfitPercent` varchar(10) NOT NULL,
	`enabled` enum('yes','no') NOT NULL DEFAULT 'yes',
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `riskRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`signalId` varchar(64),
	`symbol` varchar(20) NOT NULL,
	`action` enum('buy','sell') NOT NULL,
	`quantity` varchar(20) NOT NULL,
	`entryPrice` varchar(20) NOT NULL,
	`exitPrice` varchar(20),
	`stopLoss` varchar(20),
	`takeProfit` varchar(20),
	`pnl` varchar(20),
	`status` enum('open','closed','cancelled') NOT NULL DEFAULT 'open',
	`openedAt` timestamp DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tradingSignals` (
	`id` varchar(64) NOT NULL,
	`strategyId` varchar(64) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`action` enum('buy','sell','hold') NOT NULL,
	`price` varchar(20) NOT NULL,
	`confidence` varchar(10) NOT NULL,
	`indicators` text,
	`sentiment` varchar(10),
	`timestamp` timestamp DEFAULT (now()),
	`executed` enum('pending','executed','cancelled') NOT NULL DEFAULT 'pending',
	CONSTRAINT `tradingSignals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tradingStrategies` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('momentum','mean_reversion','breakout','ml_based','sentiment','arbitrage') NOT NULL,
	`status` enum('active','paused','backtesting') NOT NULL DEFAULT 'paused',
	`parameters` text NOT NULL,
	`performance` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `tradingStrategies_id` PRIMARY KEY(`id`)
);
