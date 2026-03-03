[Automation] Checking MT5 connection before trade...
[Automation] MT5 connected, proceeding with trade execution
[Automation] Executing trade: buy NZDUSD x3 lots
[MT5] Executing buy order for NZDUSD, volume: 3
[MT5] Request details: {
  action: 'buy',
  symbol: 'NZDUSD',
  volume: 3,
  stopLoss: 0.02,
  takeProfit: 0.04,
  comment: 'Auto: NZDUSD swing Strategy (89%)'
}
[MT5 Python] Calling: execute_trade [
  'buy',
  'NZDUSD',
  '3',
  '0.02',
  '0.04',
  'Auto: NZDUSD swing Strategy (89%)',
  '103899532',
  'Iu@5OgUd',
  'MetaQuotes-Demo'
]
[MT5 Python] Exit code: 1, output length: 96
[MT5 Python] Error output:
[MT5] Python trade response: { success: false, error: 'Python script failed with code 1' }
[MT5] ✗ Trade failed: Python script failed with code 1 (code: undefined)
[Automation] Trade result: {
  success: false,
  error: 'Python script failed with code 1',
  errorCode: -3
}
[Automation] ✗ Trade failed: Python script failed with code 1 (code: -3)
[Automation] Generated 3 signals, executed 3 trades