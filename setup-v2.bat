@echo off
cd /d "%~dp0"
echo ========================================
echo  MEC Software Tracker - Setup v2
echo ========================================
echo.

REM --- Step 1: Check node_modules ---
if not exist node_modules (
    echo [1/4] Installing dependencies (takes ~2 min)...
    call npm install --no-audit --no-fund
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: npm install failed
        pause & exit /b 1
    )
) else (
    echo [1/4] node_modules already exists - skipping install
)

REM --- Step 2: Check .env.local ---
echo.
if not exist .env.local (
    echo [2/4] Creating .env.local from template...
    copy .env.example .env.local > nul
    echo.
    echo ============================================================
    echo   Notepad will open. Find this line:
    echo     DATABASE_URL="postgres://avnadmin:xxxxxxx@..."
    echo   Replace with YOUR Aiven Service URI ^(starts with postgres://^)
    echo   Then SAVE the file ^(Ctrl+S^) and CLOSE notepad.
    echo ============================================================
    echo.
    pause
    notepad .env.local
    echo.
    echo Continuing after you saved...
) else (
    echo [2/4] .env.local exists
)

REM --- Step 3: Push schema ---
echo.
echo [3/4] Creating tables in Aiven database...
call npx prisma db push --accept-data-loss
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: prisma db push failed
    echo Check that DATABASE_URL in .env.local is correct
    echo  - must start with postgres://
    echo  - must end with ?sslmode=require
    pause & exit /b 1
)

REM --- Step 4: Import data ---
echo.
echo [4/4] Importing data from Excel...
call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: import failed
    pause & exit /b 1
)

echo.
echo ========================================
echo  SETUP COMPLETE
echo ========================================
echo.
echo Next steps:
echo  - Refresh your live site:
echo      https://mec-software-tracker.vercel.app
echo  - Data should now appear on Dashboard
echo.
echo  - Or test locally first:
echo      double-click dev.bat
echo      browser: http://localhost:3000
echo.
pause
