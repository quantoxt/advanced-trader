[Automation] Checking MT5 connection before trade...
[Automation] MT5 connected, proceeding with trade execution
[Automation] Executing trade: sell USDJPY x200 lots
[MT5] Executing sell order for USDJPY, volume: 200
[MT5] Request details: {
  action: 'sell',
  symbol: 'USDJPY',
  volume: 200,
  stopLoss: 0.001,
  takeProfit: 0.002,
  comment: 'Auto: USDJPY scalping Strategy (83%)'
}
[MT5 Python] Calling: execute_trade [
  'sell',
  'USDJPY',
  '200',
  '0.001',
  '0.002',
  'Auto: USDJPY scalping Strategy (83%)',
  '103899532',
  'Iu@5OgUd',
  'MetaQuotes-Demo'
]
[MT5 Python] Exit code: 0, output length: 88
[MT5 Python] Raw output: {"success": false, "error": "Order send failed: (-2, 'Invalid \"comment\" argument')"}
[MT5] Python trade response: {
  success: false,
  error: `Order send failed: (-2, 'Invalid "comment" argument')`
}
[MT5] ✗ Trade failed: Order send failed: (-2, 'Invalid "comment" argument') (code: undefined)
[Automation] Trade result: {
  success: false,
  error: `Order send failed: (-2, 'Invalid "comment" argument')`,
  errorCode: -3
}
[Automation] ✗ Trade failed: Order send failed: (-2, 'Invalid "comment" argument') (code: -3)
[Yahoo Finance API Error] HTTP 404
[Market Data] No data found for XRPUSD
[Price] No real data for XRPUSD, using fallback
[Automation] Checking MT5 connection before trade...
[Automation] MT5 connected, proceeding with trade execution
[Automation] Executing trade: buy AUDUSD x200 lots
[MT5] Executing buy order for AUDUSD, volume: 200
[MT5] Request details: {
  action: 'buy',
  symbol: 'AUDUSD',
  volume: 200,
  stopLoss: 0.02,
  takeProfit: 0.04,
  comment: 'Auto: AUDUSD swing Strategy (87%)'
}
[MT5 Python] Calling: execute_trade [
  'buy',
  'AUDUSD',
  '200',
  '0.02',
  '0.04',
  'Auto: AUDUSD swing Strategy (87%)',
  '103899532',
  'Iu@5OgUd',
  'MetaQuotes-Demo'
]
[MT5 Python] Exit code: 0, output length: 88
[MT5 Python] Raw output: {"success": false, "error": "Order send failed: (-2, 'Invalid \"comment\" argument')"}
[MT5] Python trade response: {
  success: false,
  error: `Order send failed: (-2, 'Invalid "comment" argument')`
}
[MT5] ✗ Trade failed: Order send failed: (-2, 'Invalid "comment" argument') (code: undefined)
[Automation] Trade result: {
  success: false,
  error: `Order send failed: (-2, 'Invalid "comment" argument')`,
  errorCode: -3
}
[Automation] ✗ Trade failed: Order send failed: (-2, 'Invalid "comment" argument') (code: -3)
[Yahoo Finance API Error] HTTP 404