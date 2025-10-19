/**
 * Real-Time Market Data Service
 * 
 * Fetches actual live prices from Yahoo Finance API for accurate trading signals
 */

import { callDataApi } from "../_core/dataApi";

export interface MarketPrice {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

export interface MarketDataService {
  getPrice(symbol: string): Promise<MarketPrice | null>;
  getPrices(symbols: string[]): Promise<Map<string, MarketPrice>>;
}

/**
 * Real Market Data Service using Yahoo Finance
 */
export class RealMarketDataService implements MarketDataService {
  private cache: Map<string, { price: MarketPrice; timestamp: number }> = new Map();
  private cacheDuration = 5000; // 5 seconds cache for forex, 0 for crypto

  /**
   * Convert trading symbol to Yahoo Finance format
   */
  private convertSymbol(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'EURUSD': 'EURUSD=X',
      'GBPUSD': 'GBPUSD=X',
      'USDJPY': 'USDJPY=X',
      'USDCHF': 'USDCHF=X',
      'AUDUSD': 'AUDUSD=X',
      'USDCAD': 'USDCAD=X',
      'NZDUSD': 'NZDUSD=X',
      'BTCUSD': 'BTC-USD',
      'ETHUSD': 'ETH-USD',
      'SOLUSD': 'SOL-USD',
      'DOGEUSD': 'DOGE-USD',
      'DOGEFUSD': 'DOGE-USD',
      'MATICUSD': 'MATIC-USD',
      'ADAUSD': 'ADA-USD',
    };

    return symbolMap[symbol] || symbol;
  }

  /**
   * Get real-time price for a single symbol
   */
  async getPrice(symbol: string): Promise<MarketPrice | null> {
    try {
      // For crypto, always fetch fresh data (no cache)
      const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL') || 
                       symbol.includes('DOGE') || symbol.includes('ADA') || symbol.includes('MATIC');
      
      if (!isCrypto) {
        // Check cache for forex only
        const cached = this.cache.get(symbol);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
          return cached.price;
        }
      }

      const yahooSymbol = this.convertSymbol(symbol);
      
      console.log(`[Market Data] Fetching real price for ${symbol} (${yahooSymbol})`);

      const response = await callDataApi("YahooFinance/get_stock_chart", {
        query: {
          symbol: yahooSymbol,
          region: 'US',
          interval: '1m',
          range: '1d',
        },
      });

      if (response && (response as any).chart && (response as any).chart.result && (response as any).chart.result.length > 0) {
        const result = (response as any).chart.result[0];
        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0];

        if (meta && meta.regularMarketPrice) {
          const marketPrice: MarketPrice = {
            symbol,
            price: meta.regularMarketPrice,
            bid: meta.bid || meta.regularMarketPrice - 0.0002,
            ask: meta.ask || meta.regularMarketPrice + 0.0002,
            high: meta.regularMarketDayHigh || meta.regularMarketPrice,
            low: meta.regularMarketDayLow || meta.regularMarketPrice,
            volume: meta.regularMarketVolume || 0,
            timestamp: new Date(),
          };

          // Cache the result
          this.cache.set(symbol, {
            price: marketPrice,
            timestamp: Date.now(),
          });

          console.log(`[Market Data] ${symbol}: $${marketPrice.price.toFixed(2)}`);
          return marketPrice;
        }
      }

      console.warn(`[Market Data] No data found for ${symbol}`);
      return null;
    } catch (error: any) {
      console.error(`[Market Data] Error fetching ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get real-time prices for multiple symbols
   */
  async getPrices(symbols: string[]): Promise<Map<string, MarketPrice>> {
    const prices = new Map<string, MarketPrice>();

    // Fetch prices in parallel
    const results = await Promise.allSettled(
      symbols.map(symbol => this.getPrice(symbol))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        prices.set(symbols[index], result.value);
      }
    });

    return prices;
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let marketDataService: RealMarketDataService | null = null;

export function getMarketDataService(): RealMarketDataService {
  if (!marketDataService) {
    marketDataService = new RealMarketDataService();
  }
  return marketDataService;
}

