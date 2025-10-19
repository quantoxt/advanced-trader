#!/usr/bin/env python3
"""
Windows MT5 Integration
Real MetaTrader5 Python library integration for Windows VPS
"""

import MetaTrader5 as mt5
import json
import sys
from datetime import datetime

def initialize_mt5(login, password, server):
    """Initialize MT5 connection"""
    if not mt5.initialize():
        return {"success": False, "error": f"MT5 initialization failed: {mt5.last_error()}"}
    
    # Login to MT5 account
    authorized = mt5.login(login=int(login), password=password, server=server)
    
    if not authorized:
        mt5.shutdown()
        return {"success": False, "error": f"Login failed: {mt5.last_error()}"}
    
    return {"success": True, "message": "Connected to MT5"}

def get_account_info():
    """Get real account information from MT5"""
    if not mt5.initialize():
        return {"success": False, "error": "MT5 not initialized"}
    
    account_info = mt5.account_info()
    if account_info is None:
        return {"success": False, "error": f"Failed to get account info: {mt5.last_error()}"}
    
    return {
        "success": True,
        "balance": account_info.balance,
        "equity": account_info.equity,
        "margin": account_info.margin,
        "freeMargin": account_info.margin_free,
        "profit": account_info.profit,
        "leverage": account_info.leverage,
        "currency": account_info.currency,
        "name": account_info.name,
        "server": account_info.server,
        "login": account_info.login,
    }

def get_current_price(symbol):
    """Get current price for a symbol"""
    if not mt5.initialize():
        return {"success": False, "error": "MT5 not initialized"}
    
    # Get symbol info
    symbol_info = mt5.symbol_info(symbol)
    if symbol_info is None:
        return {"success": False, "error": f"Symbol {symbol} not found"}
    
    # Get current tick
    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        return {"success": False, "error": f"Failed to get tick for {symbol}"}
    
    return {
        "success": True,
        "symbol": symbol,
        "bid": tick.bid,
        "ask": tick.ask,
        "last": tick.last,
        "volume": tick.volume,
        "time": tick.time,
    }

def execute_trade(action, symbol, volume, stop_loss=0, take_profit=0, comment=""):
    """Execute a trade on MT5"""
    if not mt5.initialize():
        return {"success": False, "error": "MT5 not initialized"}
    
    # Get symbol info
    symbol_info = mt5.symbol_info(symbol)
    if symbol_info is None:
        return {"success": False, "error": f"Symbol {symbol} not found"}
    
    # Enable symbol if not enabled
    if not symbol_info.visible:
        if not mt5.symbol_select(symbol, True):
            return {"success": False, "error": f"Failed to select {symbol}"}
    
    # Prepare trade request
    order_type = mt5.ORDER_TYPE_BUY if action == "buy" else mt5.ORDER_TYPE_SELL
    price = mt5.symbol_info_tick(symbol).ask if action == "buy" else mt5.symbol_info_tick(symbol).bid
    
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": float(volume),
        "type": order_type,
        "price": price,
        "sl": float(stop_loss) if stop_loss else 0.0,
        "tp": float(take_profit) if take_profit else 0.0,
        "deviation": 20,
        "magic": 234000,
        "comment": comment,
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    
    # Send trade request
    result = mt5.order_send(request)
    
    if result is None:
        return {"success": False, "error": f"Order send failed: {mt5.last_error()}"}
    
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        return {
            "success": False,
            "error": f"Order failed: {result.comment}",
            "retcode": result.retcode,
        }
    
    return {
        "success": True,
        "ticket": result.order,
        "volume": result.volume,
        "price": result.price,
        "comment": result.comment,
    }

def get_open_positions():
    """Get all open positions"""
    if not mt5.initialize():
        return {"success": False, "error": "MT5 not initialized"}
    
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
            "price_open": pos.price_open,
            "price_current": pos.price_current,
            "profit": pos.profit,
            "sl": pos.sl,
            "tp": pos.tp,
            "comment": pos.comment,
        })
    
    return {"success": True, "positions": positions_list}

def close_position(ticket):
    """Close a position by ticket"""
    if not mt5.initialize():
        return {"success": False, "error": "MT5 not initialized"}
    
    # Get position info
    position = mt5.positions_get(ticket=ticket)
    if position is None or len(position) == 0:
        return {"success": False, "error": f"Position {ticket} not found"}
    
    pos = position[0]
    
    # Prepare close request
    order_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
    price = mt5.symbol_info_tick(pos.symbol).bid if pos.type == mt5.ORDER_TYPE_BUY else mt5.symbol_info_tick(pos.symbol).ask
    
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": pos.symbol,
        "volume": pos.volume,
        "type": order_type,
        "position": ticket,
        "price": price,
        "deviation": 20,
        "magic": 234000,
        "comment": "Close position",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    
    result = mt5.order_send(request)
    
    if result is None:
        return {"success": False, "error": f"Close failed: {mt5.last_error()}"}
    
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        return {"success": False, "error": f"Close failed: {result.comment}"}
    
    return {"success": True, "message": f"Position {ticket} closed"}

def shutdown_mt5():
    """Shutdown MT5 connection"""
    mt5.shutdown()
    return {"success": True, "message": "MT5 connection closed"}

# CLI interface
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No command provided"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        if command == "initialize":
            login = sys.argv[2]
            password = sys.argv[3]
            server = sys.argv[4]
            result = initialize_mt5(login, password, server)
        
        elif command == "account_info":
            result = get_account_info()
        
        elif command == "get_price":
            symbol = sys.argv[2]
            result = get_current_price(symbol)
        
        elif command == "execute_trade":
            action = sys.argv[2]
            symbol = sys.argv[3]
            volume = sys.argv[4]
            stop_loss = float(sys.argv[5]) if len(sys.argv) > 5 else 0
            take_profit = float(sys.argv[6]) if len(sys.argv) > 6 else 0
            comment = sys.argv[7] if len(sys.argv) > 7 else ""
            result = execute_trade(action, symbol, volume, stop_loss, take_profit, comment)
        
        elif command == "get_positions":
            result = get_open_positions()
        
        elif command == "close_position":
            ticket = int(sys.argv[2])
            result = close_position(ticket)
        
        elif command == "shutdown":
            result = shutdown_mt5()
        
        else:
            result = {"success": False, "error": f"Unknown command: {command}"}
        
        print(json.dumps(result))
    
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

