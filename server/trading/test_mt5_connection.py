#!/usr/bin/env python3
"""
Test MT5 Connection - Run this to verify Python can connect to your MT5
"""

import sys
import json

try:
    import MetaTrader5 as mt5
    print("✅ MetaTrader5 package is installed")
except ImportError:
    print("❌ MetaTrader5 package NOT installed!")
    print("   Run: pip install MetaTrader5")
    sys.exit(1)

# Test MT5 initialization
print("\n[1/4] Testing MT5 initialization...")
if not mt5.initialize():
    print(f"❌ MT5 initialization failed: {mt5.last_error()}")
    sys.exit(1)
print("✅ MT5 initialized successfully")

# Get account info (should show currently logged in account in MT5)
print("\n[2/4] Getting account info...")
account_info = mt5.account_info()
if account_info is None:
    print(f"❌ Failed to get account info: {mt5.last_error()}")
    print("   Make sure you're logged into MT5 terminal!")
    mt5.shutdown()
    sys.exit(1)

print(f"✅ Account info retrieved:")
print(f"   Login: {account_info.login}")
print(f"   Name: {account_info.name}")
print(f"   Balance: {account_info.balance}")
print(f"   Equity: {account_info.equity}")
print(f"   Currency: {account_info.currency}")
print(f"   Server: {account_info.server}")

# Test with specific credentials (replace with yours)
print("\n[3/4] Testing login with credentials...")
TEST_LOGIN = None  # Replace with your login number
TEST_PASSWORD = None  # Replace with your password
TEST_SERVER = None  # Replace with your server name

if TEST_LOGIN and TEST_PASSWORD and TEST_SERVER:
    authorized = mt5.login(login=int(TEST_LOGIN), password=TEST_PASSWORD, server=TEST_SERVER)
    if not authorized:
        print(f"❌ Login failed: {mt5.last_error()}")
    else:
        print(f"✅ Login successful!")
        account_info = mt5.account_info()
        print(f"   Balance: {account_info.balance}")
else:
    print("⏭  Skipping credential test (set TEST_LOGIN, TEST_PASSWORD, TEST_SERVER in script)")

# Shutdown
print("\n[4/4] Shutting down MT5...")
mt5.shutdown()
print("✅ Done!")

print("\n" + "="*60)
print("If all tests passed, Python MT5 integration is working!")
print("="*60)
