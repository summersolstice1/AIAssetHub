@echo off
setlocal

cd /d "%~dp0"
set "PORT=3030"

echo.
echo Starting AI Asset Hub on http://localhost:%PORT%
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please install Node.js first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

start "" "http://localhost:%PORT%"
call npm run dev

pause
