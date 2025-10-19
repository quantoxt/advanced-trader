# Windows Deployment Guide - Advanced AI Trading Bot

## 🎯 Overview

This guide will help you run the Advanced AI Trading Bot on your Windows PC with **REAL** MetaTrader 5 integration.

## ✅ Prerequisites

Before you begin, ensure you have:

1. **Windows 10/11** (64-bit)
2. **MetaTrader 5** installed and running
3. **ACY Securities MT5 account** (Demo or Live)
4. **Python 3.11+** installed
5. **Node.js 18+** installed
6. **Git** (optional, for cloning)

---

## 📦 Step 1: Install Required Software

### 1.1 Install Python

1. Download Python from: https://www.python.org/downloads/
2. **IMPORTANT:** Check "Add Python to PATH" during installation
3. Verify installation:
   ```cmd
   python --version
   ```

### 1.2 Install Node.js

1. Download Node.js from: https://nodejs.org/
2. Install with default settings
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

### 1.3 Install MetaTrader 5

1. Download MT5 from ACY Securities website
2. Install and login with your credentials:
   - Login: 843153
   - Password: [your password]
   - Server: ACYSecurities-Demo
3. Keep MT5 running in the background

---

## 🚀 Step 2: Setup the Trading Bot

### 2.1 Download the Project

**Option A: Download from GitHub**
```cmd
git clone https://github.com/Samerabualsoud/advanced-trading-bot.git
cd advanced-trading-bot
```

**Option B: Download ZIP**
1. Download the project ZIP file
2. Extract to a folder (e.g., `C:\TradingBot`)
3. Open Command Prompt in that folder

### 2.2 Run Setup Script

Double-click `WINDOWS_SETUP.bat` or run:
```cmd
WINDOWS_SETUP.bat
```

This will:
- Install Python dependencies (MetaTrader5, requests, etc.)
- Install Node.js dependencies
- Create `.env` configuration file
- Build the project

### 2.3 Configure Environment

Edit `.env` file with your settings:

```env
# Database (use local SQLite for testing)
DATABASE_URL=mysql://user:password@localhost:3306/trading_bot

# MT5 Configuration (will be set via UI)
MT5_LOGIN=843153
MT5_PASSWORD=your_password
MT5_SERVER=ACYSecurities-Demo

# Application Settings
PORT=3000
NODE_ENV=production
```

---

## 🎮 Step 3: Start the Trading Bot

### 3.1 Start the Bot

Double-click `START_BOT.bat` or run:
```cmd
START_BOT.bat
```

This will:
1. Check if MT5 is running
2. Start the development server
3. Open your browser to http://localhost:3000

### 3.2 Connect MT5 Account

1. Click **"Connect Broker"** in the dashboard
2. Enter your MT5 credentials:
   - Login: `843153`
   - Password: `[your password]`
   - Server: `ACYSecurities-Demo`
3. Click **"Connect MT5"**
4. You should see: ✅ **Connected** with your real $100,000 balance

---

## 🤖 Step 4: Enable Automated Trading

### 4.1 Auto-Generate Strategies

1. Click **"Auto Trading"** in the navigation
2. Click **"Generate 15 Strategies"**
3. Bot will create optimized strategies for:
   - Major forex pairs (EURUSD, GBPUSD, USDJPY, etc.)
   - High-volatility crypto (BTC, ETH, SOL, DOGE)

### 4.2 Start Auto Trading

1. Click **"Start Auto Trading"**
2. Bot will:
   - Generate signals every 2 minutes
   - Execute trades with 80%+ confidence
   - Monitor market hours (no forex trading on weekends)
   - Track P&L in real-time

### 4.3 Monitor Performance

- **Dashboard**: View portfolio balance, P&L, recent signals
- **Signals**: See all generated signals with confidence scores
- **Strategies**: View and manage your 15 active strategies
- **Portfolio**: Track open positions and trade history
- **Risk**: Configure risk management rules

---

## 🔧 Troubleshooting

### MT5 Connection Failed

**Problem:** "MT5 not connected" error

**Solutions:**
1. Make sure MT5 is running (check system tray)
2. Verify you're logged into your MT5 account
3. Check credentials are correct
4. Restart MT5 and try again

### Balance Shows $10,000 Instead of $100,000

**Problem:** Incorrect balance displayed

**Solution:**
1. Disconnect and reconnect MT5
2. Refresh the browser page
3. Check MT5 is showing correct balance

### Signals Not Executing

**Problem:** Signals show "pending" but don't execute

**Solutions:**
1. Verify MT5 connection is active (green checkmark)
2. Check "Auto Trading" is enabled in MT5 (Tools → Options → Expert Advisors → Allow automated trading)
3. Ensure market is open (no forex trading on weekends)

### Python MetaTrader5 Import Error

**Problem:** `ModuleNotFoundError: No module named 'MetaTrader5'`

**Solution:**
```cmd
pip install --upgrade MetaTrader5
```

---

## 📊 How It Works

### Real MT5 Integration

The bot uses the official `MetaTrader5` Python library to:

1. **Connect** to your MT5 terminal running on Windows
2. **Fetch** real account balance, equity, and positions
3. **Execute** trades directly through MT5 API
4. **Monitor** open positions and P&L

### Trading Flow

```
1. Market Data → Yahoo Finance API (real-time prices)
2. Signal Generation → AI algorithms analyze 15 pairs every 2 min
3. Confidence Check → Only execute signals ≥80% confidence
4. Market Hours Check → Skip forex if market closed
5. MT5 Execution → Place real trade via MetaTrader5 library
6. Position Tracking → Monitor P&L and auto-close if needed
```

### Market Hours

- **Forex**: Sunday 5pm EST - Friday 5pm EST (24/5)
- **Crypto**: 24/7 (always trading)

Bot automatically pauses forex signals on weekends.

---

## 🛡️ Security Best Practices

1. **Use Demo Account First**: Test with demo before going live
2. **Set Stop Losses**: Always configure risk management rules
3. **Monitor Regularly**: Check bot performance daily
4. **Start Small**: Begin with micro lots (0.01)
5. **Keep MT5 Running**: Bot needs MT5 terminal active

---

## 🆘 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| MT5 not detected | Ensure `terminal64.exe` is running |
| Wrong balance | Disconnect/reconnect MT5 |
| No signals | Check market hours and strategies |
| Trades not executing | Enable "Allow automated trading" in MT5 |

### Getting Help

1. Check MT5 "Experts" tab for error messages
2. Check browser console (F12) for errors
3. Review server logs in the terminal window

---

## 📈 Performance Tips

1. **Optimize Strategies**: Review and adjust parameters based on performance
2. **Risk Management**: Set appropriate position sizes (1-3% per trade)
3. **Diversification**: Let bot trade multiple pairs simultaneously
4. **Market Conditions**: Bot performs best in trending markets
5. **Regular Monitoring**: Check daily for any issues or opportunities

---

## 🎉 You're Ready!

Your Advanced AI Trading Bot is now fully configured and ready to trade with **REAL** MT5 integration.

**Next Steps:**
1. ✅ MT5 connected with real balance
2. ✅ 15 strategies auto-generated
3. ✅ Auto trading enabled
4. ✅ Signals generating every 2 minutes
5. ✅ Trades executing automatically

**Happy Trading! 🚀**

