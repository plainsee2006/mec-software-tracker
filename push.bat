@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   Quick Push to GitHub
echo ========================================
echo.

git status
echo.
echo --------------------------------------------

REM ถ้ายังมีไฟล์ที่ยังไม่ commit ให้ add+commit ทั้งหมด
git diff --quiet HEAD 2>nul
if errorlevel 1 (
    echo Found uncommitted changes. Committing...
    git add .
    set /p msg=Commit message (Enter = "update"):
    if "%msg%"=="" set msg=update
    git commit -m "%msg%"
    echo.
)

echo Pushing to origin/main...
git push origin main
set RESULT=%ERRORLEVEL%

echo.
echo --------------------------------------------
if %RESULT% NEQ 0 (
    echo.
    echo PUSH FAILED. Possible fixes:
    echo   1. Login first:  gh auth login
    echo   2. Or use token: https://github.com/settings/tokens/new
    echo      then: git push https://USER:TOKEN@github.com/plainsee2006/mec-software-tracker.git main
    echo.
) else (
    echo PUSH SUCCESS!
    echo Vercel will auto-deploy in 1-2 minutes.
    echo Check: https://vercel.com/dashboard
    echo.
)

pause
