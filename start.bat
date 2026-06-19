@echo off
REM ===== What-A-Toy! local dev server =====
echo.
echo   What-A-Toy! is starting...
echo   Open your browser at:  http://localhost:8000
echo   Press Ctrl+C to stop.
echo.
cd /d "%~dp0"
python -m http.server 8000
