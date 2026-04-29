@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   MEC Software Tracker - Fix Dates
echo ============================================
echo.
echo Step 1: Preview (dry-run)
echo --------------------------------------------
call npx tsx scripts/fix-dates.ts
echo.
echo --------------------------------------------
set /p confirm=Apply these changes? (y/N):
if /i not "%confirm%"=="y" (
  echo Cancelled.
  pause
  exit /b 0
)
echo.
echo Step 2: Applying...
echo --------------------------------------------
call npx tsx scripts/fix-dates.ts --apply
echo.
echo Done. Refresh the dashboard to verify.
pause
