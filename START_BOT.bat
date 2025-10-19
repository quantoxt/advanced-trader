@echo off
REM Advanced Trading Bot - Windows Startup Script

echo ========================================
echo Starting Advanced AI Trading Bot
echo ========================================
echo.

REM Check if MT5 is running
tasklist /FI "IMAGENAME eq terminal64.exe" 2>NUL | find /I /N "terminal64.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo WARNING: MetaTrader 5 is not running!
    echo Please start MT5 before running the bot
    echo.
    echo Press any key to continue anyway...
    pause
)

echo [1/2] Starting development server...
start "Trading Bot Server" cmd /k "pnpm dev"

timeout /t 5 /nobreak >nul

echo [2/2] Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo Trading Bot is now running!
echo ========================================
echo.
echo Server: http://localhost:3000
echo.
echo To stop the bot:
echo - Close the server window
echo - Or press Ctrl+C in the server window
echo.
echo Press any key to exit this window...
pause >nul

