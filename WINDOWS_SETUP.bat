@echo off
REM Advanced Trading Bot - Windows Setup Script
REM This script installs all dependencies and sets up the trading bot on Windows

echo ========================================
echo Advanced AI Trading Bot - Windows Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please install Python 3.11 or higher from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo [1/6] Python detected
python --version

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/6] Node.js detected
node --version

REM Install Python dependencies
echo.
echo [3/6] Installing Python dependencies...
pip install MetaTrader5 requests python-dotenv

REM Install Node.js dependencies
echo.
echo [4/6] Installing Node.js dependencies...
call npm install -g pnpm
call pnpm install

REM Create .env file if it doesn't exist
if not exist .env (
    echo [5/6] Creating .env file...
    copy .env.example .env
    echo Please edit .env file with your database and API credentials
) else (
    echo [5/6] .env file already exists
)

REM Build the project
echo.
echo [6/6] Building the project...
call pnpm build

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MetaTrader 5 is installed and running
echo 2. Edit .env file with your database credentials
echo 3. Run: start_bot.bat
echo.
pause

