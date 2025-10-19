#!/usr/bin/env python3
"""
MetaTrader 5 Python Bridge
This script provides a bridge between Node.js and the MetaTrader 5 Python API.
It accepts commands via stdin and returns results via stdout in JSON format.

Installation:
    pip install MetaTrader5

Usage:
    python mt5_bridge.py

Commands (JSON format):
    {"action": "connect", "login": 12345, "password": "password", "server": "ACYSecurities-Live"}
    {"action": "disconnect"}
    {"action": "get_account_info"}
    {"action": "get_positions"}
    {"action": "execute_trade", "symbol": "EURUSD", "type": "buy", "volume": 0.01, "sl": 1.08, "tp": 1.10}
    {"action": "close_position", "ticket": 123456}
"""

import sys
import json
import MetaTrader5 as mt5
from datetime import datetime

def connect(login, password, server):
    """Connect to MT5 terminal"""
    try:
        # Initialize MT5
        if not mt5.initialize():
            return {"success": False, "error": "MT5 initialization failed", "error_code": mt5.last_error()}
        
        # Login to account
        authorized = mt5.login(login=login, password=password, server=server)
        
        if authorized:
            account_info = mt5.account_info()
            return {
                "success": True,
                "account": {
                    "login": account_info.login,
                    "balance": account_info.balance,
                    "equity": account_info.equity,
                    "margin": account_info.margin,
                    "free_margin": account_info.margin_free,
                    "margin_level": account_info.margin_level,
                    "profit": account_info.profit,
                    "currency": account_info.currency,
                    "leverage": account_info.leverage,
                    "name": account_info.name,
                    "company": account_info.company,
                }
            }
        else:
            error = mt5.last_error()
            return {"success": False, "error": f"Login failed: {error}", "error_code": error}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def disconnect():
    """Disconnect from MT5"""
    try:
        mt5.shutdown()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_account_info():
    """Get account information"""
    try:
        account_info = mt5.account_info()
        if account_info is None:
            return {"success": False, "error": "Failed to get account info"}
        
        return {
            "success": True,
            "account": {
                "login": account_info.login,
                "balance": account_info.balance,
                "equity": account_info.equity,
                "margin": account_info.margin,
                "free_margin": account_info.margin_free,
                "margin_level": account_info.margin_level,
                "profit": account_info.profit,
                "currency": account_info.currency,
                "leverage": account_info.leverage,
                "name": account_info.name,
                "company": account_info.company,
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_positions():
    """Get all open positions"""
    try:
        positions = mt5.positions_get()
        if positions is None:
            return {"success": True, "positions": []}
        
        positions_list = []
        for pos in positions:
            positions_list.append({
                "ticket": pos.ticket,
                "symbol": pos.symbol,
                "type": "buy" if pos.type == mt5.ORDER_TYPE_BUY else "sell",
                "volume": pos.volume,
                "open_price": pos.price_open,
                "current_price": pos.price_current,
                "profit": pos.profit,
                "stop_loss": pos.sl,
                "take_profit": pos.tp,
                "open_time": pos.time,
                "comment": pos.comment,
            })
        
        return {"success": True, "positions": positions_list}
    except Exception as e:
        return {"success": False, "error": str(e)}

def execute_trade(symbol, trade_type, volume, sl=None, tp=None, comment=""):
    """Execute a trade"""
    try:
        # Prepare request
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": mt5.ORDER_TYPE_BUY if trade_type == "buy" else mt5.ORDER_TYPE_SELL,
            "deviation": 20,
            "magic": 234000,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        # Get current price
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            return {"success": False, "error": f"Symbol {symbol} not found"}
        
        if not symbol_info.visible:
            if not mt5.symbol_select(symbol, True):
                return {"success": False, "error": f"Failed to select symbol {symbol}"}
        
        # Set price
        if trade_type == "buy":
            request["price"] = mt5.symbol_info_tick(symbol).ask
        else:
            request["price"] = mt5.symbol_info_tick(symbol).bid
        
        # Add SL and TP if provided
        if sl is not None:
            request["sl"] = sl
        if tp is not None:
            request["tp"] = tp
        
        # Send order
        result = mt5.order_send(request)
        
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return {
                "success": False,
                "error": f"Order failed: {result.comment}",
                "error_code": result.retcode
            }
        
        return {
            "success": True,
            "ticket": result.order,
            "volume": result.volume,
            "price": result.price,
            "comment": result.comment,
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def close_position(ticket):
    """Close a position by ticket"""
    try:
        # Get position info
        positions = mt5.positions_get(ticket=ticket)
        if positions is None or len(positions) == 0:
            return {"success": False, "error": f"Position {ticket} not found"}
        
        position = positions[0]
        
        # Prepare close request
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": position.symbol,
            "volume": position.volume,
            "type": mt5.ORDER_TYPE_SELL if position.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY,
            "position": ticket,
            "deviation": 20,
            "magic": 234000,
            "comment": "Close position",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        # Get current price
        if position.type == mt5.ORDER_TYPE_BUY:
            request["price"] = mt5.symbol_info_tick(position.symbol).bid
        else:
            request["price"] = mt5.symbol_info_tick(position.symbol).ask
        
        # Send close order
        result = mt5.order_send(request)
        
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return {
                "success": False,
                "error": f"Failed to close position: {result.comment}",
                "error_code": result.retcode
            }
        
        return {
            "success": True,
            "ticket": ticket,
            "closed_at_price": result.price,
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    """Main loop - read commands from stdin and write results to stdout"""
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            command = json.loads(line.strip())
            action = command.get("action")
            
            if action == "connect":
                result = connect(
                    command.get("login"),
                    command.get("password"),
                    command.get("server")
                )
            elif action == "disconnect":
                result = disconnect()
            elif action == "get_account_info":
                result = get_account_info()
            elif action == "get_positions":
                result = get_positions()
            elif action == "execute_trade":
                result = execute_trade(
                    command.get("symbol"),
                    command.get("type"),
                    command.get("volume"),
                    command.get("sl"),
                    command.get("tp"),
                    command.get("comment", "")
                )
            elif action == "close_position":
                result = close_position(command.get("ticket"))
            else:
                result = {"success": False, "error": f"Unknown action: {action}"}
            
            # Write result to stdout
            sys.stdout.write(json.dumps(result) + "\n")
            sys.stdout.flush()
            
        except Exception as e:
            error_result = {"success": False, "error": str(e)}
            sys.stdout.write(json.dumps(error_result) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()

