/**
 * Real-Time Market Data Service
 *
 * Fetches actual live prices from Yahoo Finance public API (FREE)
 */

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
 * Real Market Data Service using FREE Yahoo Finance public API
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
      'XAUUSD': 'GC=F',      // Gold Futures
      'XAGUSD': 'SI=F',      // Silver Futures
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
   * Fetch data from Yahoo Finance public API (FREE)
   */
  private async fetchYahooData(yahooSymbol: string): Promise<any | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // console.error(`[Yahoo Finance API Error] ${error.message}`);
      return null;
    }
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

      // console.log(`[Market Data] Fetching FREE real price for ${symbol} (${yahooSymbol})`);

      const data = await this.fetchYahooData(yahooSymbol);

      if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0];

        if (meta && meta.regularMarketPrice) {
          const regularPrice = meta.regularMarketPrice;
          const previousClose = meta.previousClose || regularPrice;

          // Estimate bid/ask spread
          const spread = isCrypto ? regularPrice * 0.001 : 0.0002;

          const marketPrice: MarketPrice = {
            symbol,
            price: regularPrice,
            bid: meta.bid || regularPrice - spread,
            ask: meta.ask || regularPrice + spread,
            high: meta.regularMarketDayHigh || regularPrice,
            low: meta.regularMarketDayLow || regularPrice,
            volume: meta.regularMarketVolume || 0,
            timestamp: new Date(),
          };

          // Cache the result
          this.cache.set(symbol, {
            price: marketPrice,
            timestamp: Date.now(),
          });

          // console.log(`[Market Data] ${symbol}: ${isCrypto ? '$' : ''}${marketPrice.price.toFixed(isCrypto ? 2 : 5)}`);
          return marketPrice;
        }
      }

      // console.warn(`[Market Data] No data found for ${symbol}`);
      return null;
    } catch (error: any) {
      // console.error(`[Market Data] Error fetching ${symbol}:`, error.message);
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

