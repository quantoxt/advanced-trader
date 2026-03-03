/**
 * Windows MT5 Integration Wrapper
 * Calls Python MT5 script for real MetaTrader 5 integration on Windows
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface MT5ConnectionConfig {
  login: string;
  password: string;
  server: string;
}

export interface MT5AccountInfo {
  success: boolean;
  balance?: number;
  equity?: number;
  margin?: number;
  freeMargin?: number;
  profit?: number;
  leverage?: number;
  currency?: string;
  name?: string;
  server?: string;
  login?: number;
  error?: string;
}

export interface MT5TradeResult {
  success: boolean;
  ticket?: number;
  volume?: number;
  price?: number;
  comment?: string;
  error?: string;
}

export class MT5WindowsWrapper {
  private pythonScript: string;
  private isWindows: boolean;
  private connected: boolean = false;
  private credentials: MT5ConnectionConfig | null = null;

  constructor() {
    this.pythonScript = path.join(__dirname, 'mt5Windows.py');
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Call Python MT5 script
   */
  private async callPython(command: string, ...args: string[]): Promise<any> {
    if (!this.isWindows) {
      return {
        success: false,
        error: 'MT5 Python integration only works on Windows. Please run this bot on Windows with MT5 installed.',
      };
    }

    console.log(`[MT5 Python] Calling: ${command}`, args);

    return new Promise((resolve) => {
      // Use 'python' on Windows (not 'python3')
      const python = spawn('python', [this.pythonScript, command, ...args]);
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        const errMsg = data.toString();
        error += errMsg;
        console.error(`[MT5 Python stderr]: ${errMsg}`);
      });

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        python.kill();
        console.error('[MT5 Python] Timeout (10s)');
        resolve({ success: false, error: 'Python script timeout (10s)' });
      }, 10000);

      python.on('close', (code) => {
        clearTimeout(timeout);
        console.log(`[MT5 Python] Exit code: ${code}, output length: ${output.length}`);

        if (code !== 0) {
          console.error(`[MT5 Python] Error output: ${error}`);
          resolve({ success: false, error: error || `Python script failed with code ${code}` });
        } else {
          try {
            const trimmed = output.trim();
            console.log(`[MT5 Python] Raw output: ${trimmed.substring(0, 200)}`);
            const result = JSON.parse(trimmed);
            resolve(result);
          } catch (e: any) {
            console.error(`[MT5 Python] JSON parse error: ${e.message}`);
            resolve({ success: false, error: `Invalid JSON response: ${output}` });
          }
        }
      });

      python.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`[MT5 Python] Process error: ${err.message}`);
        resolve({ success: false, error: `Failed to start Python: ${err.message}` });
      });
    });
  }

  /**
   * Connect to MT5
   */
  async connect(config: MT5ConnectionConfig): Promise<{ success: boolean; message?: string; error?: string }> {
    const result = await this.callPython('initialize', config.login, config.password, config.server);
    
    if (result.success) {
      this.connected = true;
      this.credentials = config;
    }
    
    return result;
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<MT5AccountInfo> {
    if (!this.connected || !this.credentials) {
      return { success: false, error: 'MT5 not connected. Please connect your broker account first.' };
    }

    // Pass credentials to account_info for re-login if needed
    return await this.callPython('account_info', this.credentials.login, this.credentials.password, this.credentials.server);
  }

  /**
   * Get current price for a symbol
   */
  async getPrice(symbol: string): Promise<any> {
    if (!this.connected || !this.credentials) {
      return { success: false, error: 'MT5 not connected' };
    }

    // Pass credentials to ensure we're logged in (get_price, login, password, server)
    return await this.callPython('get_price', symbol, this.credentials.login, this.credentials.password, this.credentials.server);
  }

  /**
   * Execute a trade
   */
  async executeTrade(params: {
    action: 'buy' | 'sell';
    symbol: string;
    volume: number;
    stopLoss?: number;
    takeProfit?: number;
    comment?: string;
  }): Promise<MT5TradeResult> {
    if (!this.connected || !this.credentials) {
      return { success: false, error: 'MT5 not connected' };
    }

    // Pass credentials to ensure we're logged in (execute_trade, action, symbol, volume, sl, tp, comment, login, password, server)
    return await this.callPython(
      'execute_trade',
      params.action,
      params.symbol,
      params.volume.toString(),
      (params.stopLoss || 0).toString(),
      (params.takeProfit || 0).toString(),
      params.comment || '',
      this.credentials.login,
      this.credentials.password,
      this.credentials.server
    );
  }

  /**
   * Get open positions
   */
  async getPositions(): Promise<any> {
    if (!this.connected || !this.credentials) {
      return { success: false, error: 'MT5 not connected' };
    }

    // Pass credentials to ensure we're logged in (get_positions, login, password, server)
    return await this.callPython('get_positions', this.credentials.login, this.credentials.password, this.credentials.server);
  }

  /**
   * Close a position
   */
  async closePosition(ticket: number): Promise<any> {
    if (!this.connected || !this.credentials) {
      return { success: false, error: 'MT5 not connected' };
    }

    // Pass credentials to ensure we're logged in (close_position, ticket, login, password, server)
    return await this.callPython('close_position', ticket.toString(), this.credentials.login, this.credentials.password, this.credentials.server);
  }

  /**
   * Disconnect from MT5
   */
  async disconnect(): Promise<any> {
    const result = await this.callPython('shutdown');
    this.connected = false;
    this.credentials = null;
    return result;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check if running on Windows
   */
  isWindowsPlatform(): boolean {
    return this.isWindows;
  }
}

