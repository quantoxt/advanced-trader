ALTER TABLE `tradingStrategies` MODIFY COLUMN `type` enum('momentum','mean_reversion','breakout','ml_based','sentiment','arbitrage','scalping','swing') NOT NULL;--> statement-breakpoint
ALTER TABLE `tradingStrategies` ADD `algorithm` varchar(100);--> statement-breakpoint
ALTER TABLE `tradingStrategies` ADD `symbols` text;--> statement-breakpoint
ALTER TABLE `tradingStrategies` ADD `timeframe` varchar(10);