@echo off
title Inkloom AI - Launcher
echo ========================================================
echo       INKLOOM AI - SERVICE LAUNCHER
echo ========================================================
echo Starting Backend (FastAPI on Port 8000)...
start "Inkloom Backend" cmd /k "cd /d %~dp0backend && python main.py"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Vite on Port 5173)...
start "Inkloom Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Cloudflare Quick Tunnel...
start "Inkloom Public Tunnel" cmd /k "cd /d %~dp0 && .\tools\cloudflared.exe tunnel --url http://127.0.0.1:5173"

echo ========================================================
echo Services started!
echo Local Frontend: http://localhost:5173
echo Local Backend:  http://localhost:8000
echo Check the 'Inkloom Public Tunnel' window for your public HTTPS link.
echo ========================================================
pause
