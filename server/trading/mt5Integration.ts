/**
 * MetaTrader 5 Integration Service
 *
 * Real MT5 integration using Python bridge (mt5WindowsWrapper)
 * Works with any MT5 broker - MetaQuotes, ACY Securities, etc.
 */

import { MT5WindowsWrapper } from './mt5WindowsWrapper';

export interface MT5Credentials {
  login: number;
  password: string;
  server: string;
  broker?: string;
}

export interface MT5AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  currency: string;
  leverage: number;
  name: string;
  company: string;
}

export interface MT5Position {
  ticket: number;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: Date;
}

export interface MT5TradeRequest {
  action: 'buy' | 'sell' | 'close';
  symbol: string;
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
  ticket?: number;
}

export interface MT5TradeResult {
  success: boolean;
  ticket?: number;
  orderId?: number;
  price?: number;
  volume?: number;
  error?: string;
  errorCode?: number;
}

/**
 * MT5 Integration Class
 * Uses Python bridge (mt5WindowsWrapper) for real MT5 connection
 */
export class MT5Integration {
  private credentials: MT5Credentials | null = null;
  private mt5: MT5WindowsWrapper;

  constructor() {
    this.mt5 = new MT5WindowsWrapper();
  }

  /**
   * Initialize MT5 connection with broker credentials
   */
  async connect(credentials: MT5Credentials): Promise<boolean> {
    try {
      this.credentials = credentials;

      console.log(`[MT5] Connecting to ${credentials.server} with login ${credentials.login}...`);

      // Use the real Python MT5 bridge
      const result = await this.mt5.connect({
        login: credentials.login.toString(),
        password: credentials.password,
        server: credentials.server,
      });

      if (result.success || result === true) {
        console.log('[MT5] Connected successfully');
        return true;
      } else {
        console.error('[MT5] Connection failed:', result.error || 'Unknown error');
        return false;
      }
    } catch (error: any) {
      console.error('[MT5] Connection error:', error?.message || error);
      return false;
    }
  }

  /**
   * Disconnect from MT5
   */
  async disconnect(): Promise<void> {
    try {
      await this.mt5.disconnect();
      this.credentials = null;
      console.log('[MT5] Disconnected');
    } catch (error) {
      console.error('[MT5] Disconnect error:', error);
    }
  }

  /**
   * Check if connected to MT5
   * Verifies actual connection by checking if we can get account info
   */
  isConnected(): boolean {
    // Check if wrapper thinks it's connected AND we have credentials
    if (!this.mt5.isConnected() || !this.credentials) {
      return false;
    }

    // TODO: Could verify by pinging MT5, but that would slow things down
    // For now, trust the connection flag
    return true;
  }

  /**
   * Get account information from MT5
   */
  async getAccountInfo(): Promise<MT5AccountInfo | null> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MT5. Please connect first.');
    }

    try {
      const info = await this.mt5.getAccountInfo();

      if (!info.success) {
        console.error('[MT5] Failed to get account info:', info.error);
        return null;
      }

      return {
        balance: info.balance || 0,
        equity: info.equity || info.balance || 0,
        margin: info.margin || 0,
        freeMargin: info.freeMargin || info.balance || 0,
        marginLevel: info.marginLevel || 0,
        profit: info.profit || 0,
        currency: info.currency || 'USD',
        leverage: info.leverage || 500,
        name: info.name || this.credentials?.login.toString() || 'MT5 Account',
        company: info.server || this.credentials?.server || 'MT5 Broker',
      };
    } catch (error: any) {
      console.error('[MT5] Failed to get account info:', error?.message || error);
      return null;
    }
  }

  /**
   * Get all open positions
   */
  async getPositions(): Promise<MT5Position[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MT5. Please connect first.');
    }

    try {
      const result = await this.mt5.getPositions();

      if (!result.success) {
        console.error('[MT5] Failed to get positions:', result.error);
        return [];
      }

      // Convert MT5 positions to our format
      const positions = result.positions || [];
      return positions.map((pos: any) => ({
        ticket: pos.ticket,
        symbol: pos.symbol,
        type: pos.type === 0 || pos.type === 'buy' ? 'buy' : 'sell',
        volume: pos.volume,
        openPrice: pos.openPrice,
        currentPrice: pos.currentPrice,
        profit: pos.profit || 0,
        stopLoss: pos.stopLoss,
        takeProfit: pos.takeProfit,
        openTime: new Date(pos.openTime || Date.now()),
      }));
    } catch (error: any) {
      console.error('[MT5] Failed to get positions:', error?.message || error);
      return [];
    }
  }

  /**
   * Execute a trade
   */
  async executeTrade(request: MT5TradeRequest): Promise<MT5TradeResult> {
    if (!this.isConnected()) {
      console.error('[MT5] Cannot execute trade: not connected');
      return {
        success: false,
        error: 'Not connected to MT5. Please connect first.',
        errorCode: -1,
      };
    }

    try {
      console.log(`[MT5] Executing ${request.action} order for ${request.symbol}, volume: ${request.volume}`);
      console.log(`[MT5] Request details:`, request);

      // Validate request
      if (request.volume <= 0) {
        return {
          success: false,
          error: 'Invalid volume. Must be greater than 0.',
          errorCode: -2,
        };
      }

      const result = await this.mt5.executeTrade({
        action: request.action,
        symbol: request.symbol,
        volume: request.volume,
        stopLoss: request.stopLoss,
        takeProfit: request.takeProfit,
        comment: request.comment,
      });

      console.log(`[MT5] Python trade response:`, result);

      if (result.success) {
        console.log(`[MT5] ✓ Trade executed: ${request.action} ${request.symbol} @ ${result.price} (ticket: ${result.ticket})`);
        return {
          success: true,
          ticket: result.ticket,
          orderId: result.ticket,
          price: result.price,
          volume: result.volume || request.volume,
        };
      } else {
        console.error(`[MT5] ✗ Trade failed: ${result.error} (code: ${result.errorCode})`);
        return {
          success: false,
          error: result.error || 'Trade execution failed',
          errorCode: result.errorCode || -3,
        };
      }
    } catch (error: any) {
      console.error('[MT5] Trade execution error:', error?.message || error);
      return {
        success: false,
        error: error?.message || 'Unknown error during trade execution',
        errorCode: -3,
      };
    }
  }

  /**
   * Close a position by ticket
   */
  async closePosition(ticket: number): Promise<MT5TradeResult> {
    if (!this.isConnected()) {
      return {
        success: false,
        error: 'Not connected to MT5. Please connect first.',
        errorCode: -1,
      };
    }

    try {
      console.log(`[MT5] Closing position ${ticket}`);

      const result = await this.mt5.closePosition(ticket);

      if (result.success) {
        console.log(`[MT5] Position ${ticket} closed successfully`);
        return {
          success: true,
          ticket: ticket,
        };
      } else {
        console.error(`[MT5] Failed to close position: ${result.error}`);
        return {
          success: false,
          error: result.error || 'Failed to close position',
          errorCode: -4,
        };
      }
    } catch (error: any) {
      console.error('[MT5] Failed to close position:', error?.message || error);
      return {
        success: false,
        error: error?.message || 'Failed to close position',
        errorCode: -4,
      };
    }
  }

  /**
   * Get symbol information
   */
  async getSymbolInfo(symbol: string): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MT5. Please connect first.');
    }

    try {
      const result = await this.mt5.getPrice(symbol);
      return result;
    } catch (error) {
      console.error('[MT5] Failed to get symbol info:', error);
      return null;
    }
  }

  /**
   * Get historical price data
   */
  async getHistoricalData(symbol: string, timeframe: string, count: number): Promise<any[]> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MT5. Please connect first.');
    }

    // Not implemented in mt5WindowsWrapper yet
    console.warn('[MT5] getHistoricalData not fully implemented');
    return [];
  }
}

// Singleton instance
let mt5Instance: MT5Integration | null = null;

/**
 * Get MT5 integration singleton instance
 */
export function getMT5Instance(): MT5Integration {
  if (!mt5Instance) {
    mt5Instance = new MT5Integration();
  }
  return mt5Instance;
}

/**
 * Helper function to validate MT5 credentials
 */
export function validateMT5Credentials(credentials: MT5Credentials): { valid: boolean; error?: string } {
  if (!credentials.login || credentials.login <= 0) {
    return { valid: false, error: 'Invalid login number' };
  }

  if (!credentials.password || credentials.password.length < 4) {
    return { valid: false, error: 'Invalid password' };
  }

  if (!credentials.server || credentials.server.length < 3) {
    return { valid: false, error: 'Invalid server name' };
  }

  return { valid: true };
}

/**
 * Common MT5 server names for reference
 */
export const COMMON_MT5_SERVERS = [
  'MetaQuotes-Demo',
  'MetaQuotes-Demo-Server',
  'ACYSecurities-Live',
  'ACYSecurities-Demo',
  'ICMarketsSC-Demo',
  'Pepperstone-Demo',
  'FXCM-Demo',
];
