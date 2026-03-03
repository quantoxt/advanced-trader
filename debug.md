[Automation] MT5 connected, proceeding with trade execution
[Automation] Executing trade: buy USDJPY x3 lots
[MT5] Executing buy order for USDJPY, volume: 3
[MT5] Request details: {
  action: 'buy',
  symbol: 'USDJPY',
  volume: 3,
  stopLoss: 0.001,
  takeProfit: 0.002,
  comment: 'Auto: USDJPY scalping Strategy (89%)'
}
[MT5 Python] Calling: execute_trade [
  'buy',
  'USDJPY',
  '3',
  '0.001',
  '0.002',
  'Auto: USDJPY scalping Strategy (89%)',
  '103899532',
  'Iu@5OgUd',
  'MetaQuotes-Demo'
]
[MT5 Python] Exit code: 0, output length: 89
[MT5 Python] Raw output: {"success": false, "error": "Order failed: Unsupported filling mode", "retcode": 10030}
[MT5] Python trade response: {
  success: false,
  error: 'Order failed: Unsupported filling mode',
  retcode: 10030
}
[MT5] ✗ Trade failed: Order failed: Unsupported filling mode (code: undefined)
[Automation] Trade result: {
  success: false,
  error: 'Order failed: Unsupported filling mode',
  errorCode: -3
}
[Automation] ✗ Trade failed: Order failed: Unsupported filling mode (code: -3)
[Automation] Generated 3 signals, executed 3 trades