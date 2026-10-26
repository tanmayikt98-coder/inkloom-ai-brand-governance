@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
set "LOGDIR=%ROOT%logs"
set "BACKEND_WAIT=60"
set "FRONTEND_WAIT=60"

:: Prefer a project virtualenv if one exists (last match wins)
set "PY=python"
if exist "%ROOT%.venv\Scripts\python.exe" set "PY=%ROOT%.venv\Scripts\python.exe"
if exist "%ROOT%backend\venv\Scripts\python.exe" set "PY=%ROOT%backend\venv\Scripts\python.exe"
if exist "%ROOT%backend\.venv\Scripts\python.exe" set "PY=%ROOT%backend\.venv\Scripts\python.exe"

:: Internal modes (this script re-invokes itself for the two background services)
if /i "%~1"=="--run-backend"  goto :run_backend
if /i "%~1"=="--run-frontend" goto :run_frontend
if /i "%~1"=="--stop"         goto :stop

title Inkloom AI - Launcher
echo ========================================================
echo       INKLOOM AI - FULL-STACK APPLICATION LAUNCHER
echo ========================================================

:: ---- Prerequisites -------------------------------------------------------
where curl.exe >nul 2>nul
if errorlevel 1 (
    echo [ERROR] curl.exe was not found. It ships with Windows 10 1803 and later.
    goto :fail
)
"%PY%" --version >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python was not found. Install Python 3.11 or newer and add it to PATH.
    goto :fail
)
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found. Install Node.js and add it to PATH.
    goto :fail
)

call :port_busy 8000
if not errorlevel 1 (
    echo [ERROR] Port 8000 is already in use. Run "start-inkloom.bat --stop" or close the program using it.
    goto :fail
)
call :port_busy 5173
if not errorlevel 1 (
    echo [ERROR] Port 5173 is already in use. Run "start-inkloom.bat --stop" or close the program using it.
    goto :fail
)

:: ---- Dependencies --------------------------------------------------------
"%PY%" -c "import fastapi, uvicorn, sqlalchemy" >nul 2>nul
if errorlevel 1 call :install_backend_deps
if errorlevel 1 goto :fail

if not exist "%ROOT%frontend\node_modules" (
    echo [setup] frontend\node_modules is missing - running npm install ...
    pushd "%ROOT%frontend"
    call npm install
    set "NPM_RC=!errorlevel!"
    popd
    if not "!NPM_RC!"=="0" (
        echo [ERROR] npm install failed. See the messages above.
        goto :fail
    )
)

:: ---- Start backend -------------------------------------------------------
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
del "%LOGDIR%\backend.exited" "%LOGDIR%\frontend.exited" >nul 2>nul

echo [1/3] Starting FastAPI backend on port 8000 ...
start "Inkloom Backend" /min cmd /c ""%~f0" --run-backend"

call :wait_for "http://127.0.0.1:8000/health" "%LOGDIR%\backend.exited" %BACKEND_WAIT%
if errorlevel 2 goto :backend_timeout
if errorlevel 1 goto :backend_crashed
echo [OK] Backend answered on http://127.0.0.1:8000/health

:: ---- Start frontend ------------------------------------------------------
echo [2/3] Starting Vite frontend on port 5173 ...
start "Inkloom Frontend" /min cmd /c ""%~f0" --run-frontend"

call :wait_for "http://127.0.0.1:5173/" "%LOGDIR%\frontend.exited" %FRONTEND_WAIT%
if errorlevel 2 goto :frontend_timeout
if errorlevel 1 goto :frontend_crashed
echo [OK] Frontend answered on http://127.0.0.1:5173/

call :wait_for "http://127.0.0.1:5173/api/health" "%LOGDIR%\frontend.exited" 15
if errorlevel 1 goto :proxy_failed
echo [OK] Vite proxy reaches the backend: http://localhost:5173/api/health

echo [3/3] Opening http://localhost:5173 ...
start "" http://localhost:5173

echo ========================================================
echo Inkloom AI is running.
echo   App           : http://localhost:5173
echo   API (proxied) : http://localhost:5173/api
echo   Swagger       : http://localhost:5173/docs
echo   ReDoc         : http://localhost:5173/redoc
echo   Health        : http://localhost:5173/health
echo.
echo   Logs          : %LOGDIR%
echo   Stop services : start-inkloom.bat --stop
echo.
echo NOTE: /health only proves the API process is up. To test the database
echo and every endpoint, run:  python verify_inkloom.py
echo ========================================================
pause
endlocal
exit /b 0

:: ===========================================================================
:: Failure handlers
:: ===========================================================================
:backend_crashed
echo [ERROR] The backend process exited during startup. Last log lines:
echo --------------------------------------------------------
call :tail "%LOGDIR%\backend.log"
echo --------------------------------------------------------
echo If you see ModuleNotFoundError, run: pip install -r backend\requirements.txt
goto :fail_stop

:backend_timeout
echo [ERROR] Backend did not answer on http://127.0.0.1:8000/health within %BACKEND_WAIT%s. Last log lines:
echo --------------------------------------------------------
call :tail "%LOGDIR%\backend.log"
echo --------------------------------------------------------
goto :fail_stop

:frontend_crashed
echo [ERROR] The frontend process exited during startup. Last log lines:
echo --------------------------------------------------------
call :tail "%LOGDIR%\frontend.log"
echo --------------------------------------------------------
goto :fail_stop

:frontend_timeout
echo [ERROR] Frontend did not answer on http://127.0.0.1:5173/ within %FRONTEND_WAIT%s. Last log lines:
echo --------------------------------------------------------
call :tail "%LOGDIR%\frontend.log"
echo --------------------------------------------------------
goto :fail_stop

:proxy_failed
echo [ERROR] Backend and frontend are both up, but http://localhost:5173/api/health failed.
echo         The Vite proxy cannot reach the backend. Check the proxy block in frontend\vite.config.ts.
goto :fail_stop

:fail_stop
call :kill_ports
echo Services that were started have been stopped.
:fail
echo.
echo Startup FAILED.
pause
endlocal
exit /b 1

:: ===========================================================================
:: Subroutines
:: ===========================================================================
:port_busy
netstat -ano | findstr /R /C:":%~1 .*LISTENING" >nul
exit /b %errorlevel%

:: wait_for <url> <crash-marker-file> <seconds>  ->  0 ok, 1 service exited, 2 timeout
:wait_for
set /a _n=0
:wait_loop
curl.exe -s -f -o nul "%~1" >nul 2>nul && exit /b 0
if exist "%~2" exit /b 1
set /a _n+=1
if !_n! geq %~3 exit /b 2
timeout /t 1 /nobreak >nul
goto :wait_loop

:tail
powershell -NoProfile -Command "if (Test-Path -LiteralPath '%~1') { Get-Content -LiteralPath '%~1' -Tail 25 } else { 'log file not found: %~1' }"
exit /b 0

:install_backend_deps
if not exist "%ROOT%backend\requirements.txt" (
    echo [ERROR] Backend packages are missing and backend\requirements.txt was not found.
    exit /b 1
)
echo [setup] Installing backend dependencies from backend\requirements.txt ...
"%PY%" -m pip install -r "%ROOT%backend\requirements.txt"
if errorlevel 1 (
    echo [ERROR] pip install failed. See the messages above.
    exit /b 1
)
exit /b 0

:kill_ports
powershell -NoProfile -Command "foreach($p in 8000,5173){ Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }" >nul 2>nul
exit /b 0

:stop
call :kill_ports
echo Stopped any process listening on ports 8000 and 5173.
exit /b 0

:: ===========================================================================
:: Background service runners (started minimized by the launcher)
:: ===========================================================================
:run_backend
cd /d "%ROOT%backend"
"%PY%" -u main.py > "%LOGDIR%\backend.log" 2>&1
>"%LOGDIR%\backend.exited" echo backend exited with code %errorlevel%
exit /b

:run_frontend
cd /d "%ROOT%frontend"
call npm run dev > "%LOGDIR%\frontend.log" 2>&1
>"%LOGDIR%\frontend.exited" echo frontend exited with code %errorlevel%
exit /b
