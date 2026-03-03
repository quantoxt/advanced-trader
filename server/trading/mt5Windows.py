#!/usr/bin/env python3
"""
Windows MT5 Integration
Real MetaTrader5 Python library integration for Windows VPS
Supports any MT5 broker - MetaQuotes, ACY Securities, etc.
"""

import MetaTrader5 as mt5
import json
import sys
import os
from datetime import datetime

# Global credentials (persist across calls in same process)
_cached_login = None
_cached_password = None
_cached_server = None

def ensure_login_with_creds(login=None, password=None, server=None):
    """Ensure we're logged in to MT5 using cached or provided credentials"""
    global _cached_login, _cached_password, _cached_server

    if not mt5.initialize():
        return False

    # Check if already logged in with the same account
    account_info = mt5.account_info()
    if account_info is not None:
        if (_cached_login and account_info.login == _cached_login):
            return True

    # Use provided credentials or cached ones
    use_login = login or _cached_login
    use_password = password or _cached_password
    use_server = server or _cached_server

    if use_login and use_password and use_server:
        authorized = mt5.login(login=int(use_login), password=use_password, server=use_server)
        if authorized:
            return True

    return False

def ensure_login():
    """Ensure we're logged in to MT5 using cached credentials"""
    return ensure_login_with_creds()

def initialize_mt5(login, password, server):
    """Initialize MT5 connection and cache credentials"""
    global _cached_login, _cached_password, _cached_server

    if not mt5.initialize():
        return {"success": False, "error": f"MT5 initialization failed: {mt5.last_error()}"}

    # Login to MT5 account
    authorized = mt5.login(login=int(login), password=password, server=server)

    if not authorized:
        mt5.shutdown()
        return {"success": False, "error": f"Login failed: {mt5.last_error()}"}

    # Cache credentials for auto-login
    _cached_login = int(login)
    _cached_password = password
    _cached_server = server

    # Get account info to verify connection
    account_info = mt5.account_info()
    if account_info is None:
        mt5.shutdown()
        return {"success": False, "error": f"Connected but failed to get account info: {mt5.last_error()}"}

    # Calculate margin level
    margin_level = 0
    if account_info.margin > 0:
        margin_level = account_info.equity / account_info.margin * 100

    return {
        "success": True,
        "message": "Connected to MT5",
        "balance": account_info.balance,
        "equity": account_info.equity,
        "marginLevel": margin_level,
    }

def get_account_info(login=None, password=None, server=None):
    """Get real account information from MT5"""
    try:
        # Initialize MT5 - this will connect to the active MT5 terminal
        if not mt5.initialize():
            return {"success": False, "error": f"MT5 initialization failed: {mt5.last_error()}"}

        # Try to get account info from active MT5 terminal
        account_info = mt5.account_info()

        # If we have account info, return it
        if account_info is not None:
            # Calculate margin level
            margin_level = 0
            if account_info.margin > 0:
                margin_level = account_info.equity / account_info.margin * 100

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
                "marginLevel": margin_level,
            }

        # No active account - try to login with provided or cached credentials
        use_login = login or _cached_login
        use_password = password or _cached_password
        use_server = server or _cached_server

        if use_login and use_password and use_server:
            authorized = mt5.login(login=int(use_login), password=use_password, server=use_server)
            if authorized:
                account_info = mt5.account_info()
                if account_info is not None:
                    # Update cached credentials
                    global _cached_login, _cached_password, _cached_server
                    _cached_login = int(use_login)
                    _cached_password = use_password
                    _cached_server = use_server

                    # Calculate margin level
                    margin_level = 0
                    if account_info.margin > 0:
                        margin_level = account_info.equity / account_info.margin * 100

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
                        "marginLevel": margin_level,
                    }

        return {"success": False, "error": f"No active account in MT5 terminal. Please log in to MT5 terminal or provide valid credentials."}
    except Exception as e:
        return {"success": False, "error": f"Exception in get_account_info: {str(e)}"}

def get_current_price(symbol, login=None, password=None, server=None):
    """Get current price for a symbol"""
    if not ensure_login_with_creds(login, password, server):
        return {"success": False, "error": "Not logged in to MT5"}

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

def execute_trade(action, symbol, volume, stop_loss=0, take_profit=0, comment="", login=None, password=None, server=None):
    """Execute a trade on MT5"""
    if not ensure_login_with_creds(login, password, server):
        return {"success": False, "error": "Not logged in to MT5"}
    
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

def get_open_positions(login=None, password=None, server=None):
    """Get all open positions"""
    if not ensure_login_with_creds(login, password, server):
        return {"success": False, "error": "Not logged in to MT5"}

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

def close_position(ticket, login=None, password=None, server=None):
    """Close a position by ticket"""
    if not ensure_login_with_creds(login, password, server):
        return {"success": False, "error": "Not logged in to MT5"}
    
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
    global _cached_login, _cached_password, _cached_server
    mt5.shutdown()
    _cached_login = None
    _cached_password = None
    _cached_server = None
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
            # Optional: pass login, password, server as arguments
            login = sys.argv[2] if len(sys.argv) > 2 else None
            password = sys.argv[3] if len(sys.argv) > 3 else None
            server = sys.argv[4] if len(sys.argv) > 4 else None
            result = get_account_info(login, password, server)
        
        elif command == "get_price":
            symbol = sys.argv[2]
            # Optional credentials for re-login
            login = sys.argv[3] if len(sys.argv) > 3 else None
            password = sys.argv[4] if len(sys.argv) > 4 else None
            server = sys.argv[5] if len(sys.argv) > 5 else None
            result = get_current_price(symbol, login, password, server)

        elif command == "execute_trade":
            action = sys.argv[2]
            symbol = sys.argv[3]
            volume = sys.argv[4]
            stop_loss = float(sys.argv[5]) if len(sys.argv) > 5 else 0
            take_profit = float(sys.argv[6]) if len(sys.argv) > 6 else 0
            comment = sys.argv[7] if len(sys.argv) > 7 else ""
            # Optional credentials for re-login
            login = sys.argv[8] if len(sys.argv) > 8 else None
            password = sys.argv[9] if len(sys.argv) > 9 else None
            server = sys.argv[10] if len(sys.argv) > 10 else None
            result = execute_trade(action, symbol, volume, stop_loss, take_profit, comment, login, password, server)

        elif command == "get_positions":
            # Optional credentials for re-login
            login = sys.argv[2] if len(sys.argv) > 2 else None
            password = sys.argv[3] if len(sys.argv) > 3 else None
            server = sys.argv[4] if len(sys.argv) > 4 else None
            result = get_open_positions(login, password, server)

        elif command == "close_position":
            ticket = int(sys.argv[2])
            # Optional credentials for re-login
            login = sys.argv[3] if len(sys.argv) > 3 else None
            password = sys.argv[4] if len(sys.argv) > 4 else None
            server = sys.argv[5] if len(sys.argv) > 5 else None
            result = close_position(ticket, login, password, server)
        
        elif command == "shutdown":
            result = shutdown_mt5()
        
        else:
            result = {"success": False, "error": f"Unknown command: {command}"}
        
        print(json.dumps(result))
    
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

