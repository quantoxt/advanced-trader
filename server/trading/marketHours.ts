/**
 * Market Hours Checker
 * Prevents trading when markets are closed
 */

export interface MarketHours {
  isOpen: boolean;
  reason?: string;
  nextOpen?: Date;
}

/**
 * Check if forex market is currently open
 * Forex market is open 24/5: Sunday 5pm EST - Friday 5pm EST
 */
export function isForexMarketOpen(): MarketHours {
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const utcHour = now.getUTCHours();
  
  // Convert to EST (UTC-5, or UTC-4 during DST)
  // For simplicity, using UTC-5
  const estHour = (utcHour - 5 + 24) % 24;
  
  // Saturday - Market closed all day
  if (utcDay === 6) {
    return {
      isOpen: false,
      reason: 'Forex market closed on Saturday',
      nextOpen: getNextSundayOpen(now),
    };
  }
  
  // Sunday - Opens at 5pm EST (22:00 UTC)
  if (utcDay === 0) {
    if (utcHour < 22) {
      return {
        isOpen: false,
        reason: 'Forex market opens Sunday 5pm EST (22:00 UTC)',
        nextOpen: getNextSundayOpen(now),
      };
    }
    return { isOpen: true };
  }
  
  // Friday - Closes at 5pm EST (22:00 UTC)
  if (utcDay === 5) {
    if (utcHour >= 22) {
      return {
        isOpen: false,
        reason: 'Forex market closed for weekend',
        nextOpen: getNextSundayOpen(now),
      };
    }
    return { isOpen: true };
  }
  
  // Monday-Thursday - Always open
  return { isOpen: true };
}

/**
 * Check if crypto market is open (24/7)
 */
export function isCryptoMarketOpen(): MarketHours {
  return { isOpen: true }; // Crypto trades 24/7
}

/**
 * Check if a specific symbol's market is open
 */
export function isMarketOpen(symbol: string): MarketHours {
  // Crypto symbols
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL') ||
      symbol.includes('DOGE') || symbol.includes('ADA') || symbol.includes('MATIC') ||
      symbol.includes('BNB') || symbol.includes('XRP')) {
    return isCryptoMarketOpen();
  }
  
  // Forex symbols
  return isForexMarketOpen();
}

/**
 * Get next Sunday 5pm EST opening time
 */
function getNextSundayOpen(now: Date): Date {
  const nextSunday = new Date(now);
  const daysUntilSunday = (7 - now.getUTCDay()) % 7;
  nextSunday.setUTCDate(now.getUTCDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
  nextSunday.setUTCHours(22, 0, 0, 0); // 5pm EST = 22:00 UTC
  return nextSunday;
}

/**
 * Get human-readable market status
 */
export function getMarketStatus(symbol: string): string {
  const status = isMarketOpen(symbol);
  
  if (status.isOpen) {
    return '🟢 Market Open';
  }
  
  if (status.reason) {
    return `🔴 ${status.reason}`;
  }
  
  return '🔴 Market Closed';
}

