@echo off
chcp 65001 >nul 2>&1

echo ============================================
echo   Bart Dashboard - Restart All
echo ============================================
echo.

echo [1/3] Stop existing servers...

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":6173.*LISTENING"') do (
    echo        - Backend stop PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":6001.*LISTENING"') do (
    echo        - Frontend stop PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo        Done.
echo.

echo [2/3] Check dependencies...

if not exist "%~dp0node_modules\.package-lock.json" (
    echo        - Installing root dependencies...
    pushd "%~dp0"
    call npm install >nul 2>&1
    popd
)

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

echo [3/3] Starting servers in single window...
echo.
echo   Backend:   http://localhost:6173
echo   Frontend:  http://localhost:6001
echo   Press Ctrl+C to stop all.
echo ============================================
echo.

cd /d "%~dp0"
call npx concurrently -n BE,FE -c blue,green "cd backend && npm run dev" "cd frontend && npm run dev"
