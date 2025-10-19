# MT5 Integration Guide for ACY Securities

## Overview

This trading bot now supports full integration with MetaTrader 5 (MT5) platform, allowing you to connect your ACY Securities account for automated trading. The system can read your account balance, monitor open positions, and execute trades automatically based on your configured strategies.

## Features

✅ **Real-Time Account Monitoring**
- View live balance, equity, margin, and P&L
- Track all open positions with real-time updates
- Monitor account leverage and free margin

✅ **Automated Trade Execution**
- Execute trades directly through MT5
- Automatic position sizing based on risk rules
- Stop-loss and take-profit management

✅ **Multi-Account Support**
- Connect both demo and live accounts
- Switch between accounts seamlessly
- Secure credential storage

## Prerequisites

### 1. MT5 Platform Installation

You need to have MetaTrader 5 installed on your system:

**For Windows:**
- Download MT5 from ACY Securities website or MetaQuotes
- Install and launch the platform
- Ensure MT5 is running when connecting the bot

**For Linux/Mac:**
- Use Wine to run MT5, or
- Use a Windows VPS with MT5 installed
- The Python bridge requires MT5 to be accessible

### 2. Python MT5 Package

The bot uses a Python bridge to communicate with MT5. Install the required package:

```bash
pip install MetaTrader5
```

### 3. ACY Securities Account

You need an active ACY Securities account:
- **Demo Account**: For testing (recommended to start)
- **Live Account**: For real trading

## Connection Setup

### Step 1: Find Your MT5 Credentials

You'll need three pieces of information:

#### 1. **Login Number**
- Found in your MT5 platform: Navigator → Accounts
- Also in your ACY Securities welcome email
- Example: `12345678`

#### 2. **Password**
- The password you set when creating your MT5 account
- If forgotten, contact ACY Securities support to reset
- **Important**: Use the main account password, not investor password

#### 3. **Server Name**
- Found in MT5: Tools → Options → Server tab
- Common ACY Securities servers:
  - `ACYSecurities-Live` (live accounts)
  - `ACYSecurities-Demo` (demo accounts)
  - `ACYSecurities-Live01` or `ACYSecurities-Live02` (alternative live servers)

### Step 2: Connect Through the Web Interface

1. **Navigate to Broker Connection Page**
   - Click "Connect Broker" in the main navigation
   - Or click "Connect Broker" in the Quick Actions

2. **Select Account Type**
   - Choose "Demo Account" for testing
   - Choose "Live Account" for real trading

3. **Enter Your Credentials**
   - MT5 Login Number: Your account number
   - MT5 Password: Your account password
   - MT5 Server: Select your ACY Securities server

4. **Click "Connect MT5 Account"**
   - The system will validate your credentials
   - Connection typically takes 2-5 seconds
   - You'll see a success message with your account balance

### Step 3: Verify Connection

After connecting, you should see:

- ✅ Green "Connected" status badge
- 💰 Your current account balance
- 📊 Equity and free margin
- 📈 Any open positions (if you have any)
- 🏢 Broker name and account details

## Using MT5 Integration

### Viewing Account Information

Once connected, the dashboard automatically displays:

- **Balance**: Total account balance
- **Equity**: Balance + floating P&L
- **Free Margin**: Available margin for new trades
- **Current P&L**: Profit/loss from open positions
- **Leverage**: Your account leverage (e.g., 1:500)

### Executing Automated Trades

The bot can execute trades automatically when:

1. **Strategy Generates Signal**
   - Your configured strategies analyze the market
   - When conditions are met, a trading signal is generated
   - The signal includes action (buy/sell), symbol, and confidence

2. **Risk Rules Are Checked**
   - Position size is calculated based on your risk rules
   - Stop-loss and take-profit levels are determined
   - Maximum drawdown and daily loss limits are verified

3. **Trade Is Executed**
   - If all checks pass, the trade is sent to MT5
   - MT5 executes the trade at current market price
   - You receive confirmation with ticket number

### Manual Trade Execution

You can also execute trades manually:

1. Go to the Signals page
2. Generate a signal from a strategy
3. The system will execute the trade through your connected MT5 account
4. View the result in your MT5 platform

## Security & Best Practices

### Security Measures

✅ **Encrypted Storage**
- Credentials are encrypted before storage
- Never stored in plain text
- Secure transmission over HTTPS

✅ **Session Management**
- MT5 connection is session-based
- Automatic disconnection on logout
- No persistent connections when not in use

### Recommended Practices

1. **Start with Demo Account**
   - Test all strategies on demo first
   - Verify signal accuracy and execution
   - Understand the system before going live

2. **Set Conservative Risk Rules**
   - Start with small position sizes (0.01-0.1 lots)
   - Set maximum daily loss limits
   - Use stop-loss on every trade

3. **Monitor Regularly**
   - Check the dashboard daily
   - Review executed trades in MT5
   - Adjust strategies based on performance

4. **Keep MT5 Running**
   - The Python bridge requires MT5 to be running
   - Use a VPS for 24/7 operation
   - Ensure stable internet connection

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to MT5"

**Solutions**:
1. Verify MT5 is running on your system
2. Check login number, password, and server are correct
3. Ensure MetaTrader5 Python package is installed: `pip install MetaTrader5`
4. Try restarting MT5 platform
5. Check if your account is active (not expired or suspended)

**Problem**: "Invalid credentials"

**Solutions**:
1. Double-check your login number (should be numbers only)
2. Verify you're using the main password, not investor password
3. Ensure you selected the correct server
4. Contact ACY Securities if password is forgotten

**Problem**: "Cannot retrieve account information"

**Solutions**:
1. Check your internet connection
2. Verify MT5 platform is logged in
3. Ensure account has trading permissions
4. Try disconnecting and reconnecting

### Trade Execution Issues

**Problem**: "Trade execution failed"

**Solutions**:
1. Check if market is open (forex markets closed on weekends)
2. Verify you have sufficient margin
3. Ensure symbol is available on your account
4. Check if trading is enabled in MT5 (Tools → Options → Expert Advisors)

**Problem**: "Insufficient margin"

**Solutions**:
1. Reduce position size in risk rules
2. Close some open positions to free margin
3. Deposit more funds to your account

## Advanced Configuration

### Running on VPS (Recommended for 24/7 Trading)

For continuous automated trading, use a VPS:

1. **Setup Windows VPS**
   - Choose a VPS provider (AWS, Azure, or Forex VPS)
   - Install Windows Server
   - Ensure good latency to broker servers

2. **Install MT5 on VPS**
   - Download and install MT5
   - Login to your ACY Securities account
   - Keep MT5 running 24/7

3. **Deploy Trading Bot**
   - Install Node.js and Python on VPS
   - Clone the trading bot repository
   - Install dependencies
   - Configure environment variables
   - Run the bot as a service

4. **Access Remotely**
   - Use the web interface from any device
   - Monitor trades and performance
   - Adjust strategies as needed

### Python Bridge Configuration

The MT5 integration uses a Python bridge (`mt5_bridge.py`). Advanced users can modify this for custom functionality:

```python
# Location: server/trading/mt5_bridge.py

# Customize trade execution
def execute_trade(symbol, trade_type, volume, sl=None, tp=None, comment=""):
    # Add custom logic here
    # Example: Add slippage control, retry logic, etc.
    pass
```

### API Integration

For programmatic access, use the tRPC API:

```typescript
// Connect to MT5
const result = await trpc.brokers.connectMT5.mutate({
  login: 12345678,
  password: "your_password",
  server: "ACYSecurities-Live",
  broker: "ACY Securities",
  accountType: "demo"
});

// Get account status
const status = await trpc.brokers.getMT5Status.query();

// Execute trade
const trade = await trpc.brokers.executeMT5Trade.mutate({
  symbol: "EURUSD",
  action: "buy",
  volume: 0.01,
  stopLoss: 1.0800,
  takeProfit: 1.0900,
  comment: "Automated trade"
});
```

## Supported Brokers

Currently optimized for:
- ✅ **ACY Securities** (fully tested)

The system can work with any MT5 broker, but server names may differ. Common formats:
- `BrokerName-Live`
- `BrokerName-Demo`
- `BrokerName-Server01`

## Limitations

⚠️ **Current Limitations**:

1. **Platform Dependency**
   - Requires MT5 platform to be running
   - Python bridge needs to be on same machine as MT5
   - Not suitable for mobile-only setups

2. **Operating System**
   - Best on Windows (native MT5 support)
   - Linux/Mac requires Wine or VPS

3. **Connection**
   - Single MT5 account per session
   - Reconnection required after MT5 restart
   - No offline trading queue

## Future Enhancements

🚀 **Planned Features**:

- [ ] Multi-account support (connect multiple MT5 accounts)
- [ ] MT4 integration
- [ ] Mobile app for iOS/Android
- [ ] Advanced order types (pending orders, trailing stops)
- [ ] Copy trading functionality
- [ ] Social trading features
- [ ] Backtesting with MT5 historical data

## Support

### Getting Help

1. **Check Documentation**
   - Review this guide thoroughly
   - Check the main README.md

2. **ACY Securities Support**
   - For account issues: contact ACY Securities
   - For platform issues: MT5 support

3. **Trading Bot Issues**
   - Check server logs for errors
   - Verify all dependencies are installed
   - Ensure environment is configured correctly

### Important Contacts

- **ACY Securities Support**: support@acysecurities.com
- **MT5 Technical Support**: https://www.metatrader5.com/en/support

## Disclaimer

⚠️ **Risk Warning**:

Trading forex and CFDs involves significant risk of loss. This automated trading bot is a tool to assist your trading decisions, but it does not guarantee profits. You should:

- Only trade with money you can afford to lose
- Understand the risks involved in forex trading
- Test thoroughly on demo accounts before live trading
- Monitor your account regularly
- Set appropriate risk limits

The developers of this bot are not responsible for any trading losses incurred through its use. Past performance does not guarantee future results.

## License

This MT5 integration is part of the Advanced AI Trading Bot project. All rights reserved.

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Compatible MT5 Build**: 3661+

