@echo off
chcp 65001 >nul 2>&1

echo ============================================
echo   Bart Dashboard - Restart All
echo ============================================
echo.

echo [1/4] Stop existing servers...

set "found=0"
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":6173.*LISTENING"') do (
    echo        - Backend stop PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    set "found=1"
)

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":6001.*LISTENING"') do (
    echo        - Frontend stop PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    set "found=1"
)

timeout /t 2 /nobreak >nul
echo        Done.
echo.

echo [2/4] Check dependencies...

if not exist "%~dp0backend\node_modules" (
    echo        - Installing backend dependencies...
    pushd "%~dp0backend"
    call npm install >nul 2>&1
    popd
)

if not exist "%~dp0frontend\node_modules" (
    echo        - Installing frontend dependencies...
    pushd "%~dp0frontend"
    call npm install >nul 2>&1
    popd
)

echo        Done.
echo.

echo [3/4] Starting backend server... port 6173
start "Bart-Backend" /min cmd /c "title Bart-Backend & cd /d "%~dp0backend" & npm run dev"

timeout /t 3 /nobreak >nul

echo [4/4] Starting frontend server... port 6000
start "Bart-Frontend" /min cmd /c "title Bart-Frontend & cd /d "%~dp0frontend" & npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   Restart Complete!
echo ============================================
echo.
echo   Backend:   http://localhost:6173
echo   Frontend:  http://localhost:6001
echo.

echo   Already open? Just refresh your browser (F5)
echo.

pause
