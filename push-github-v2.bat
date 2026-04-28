@echo off
cd /d "%~dp0"
echo ========================================
echo  GitHub Push Helper v2
echo ========================================
echo.

where git > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: git not installed
    echo Install from https://git-scm.com/download/win
    pause & exit /b 1
)

REM --- Check git user config ---
for /f "delims=" %%a in ('git config --global user.name 2^>nul') do set GIT_NAME=%%a
for /f "delims=" %%a in ('git config --global user.email 2^>nul') do set GIT_EMAIL=%%a

if "%GIT_NAME%"=="" (
    echo Git user.name not set. Setting now...
    git config --global user.name "plainsee2006"
)
if "%GIT_EMAIL%"=="" (
    echo Git user.email not set. Setting now...
    git config --global user.email "plainsee.2006@gmail.com"
)

echo Git user: %GIT_NAME% ^<%GIT_EMAIL%^>
echo.

REM --- Init repo if needed ---
if not exist .git (
    echo [1/5] Initializing git repository...
    git init -b main
    if %ERRORLEVEL% NEQ 0 ( pause & exit /b 1 )
) else (
    echo [1/5] Git repo exists
    git branch -M main 2> nul
)

echo.
echo [2/5] Adding files...
git add .
if %ERRORLEVEL% NEQ 0 ( pause & exit /b 1 )

echo.
echo [3/5] Committing...
git commit -m "MEC Software Tracker - initial deploy"
echo (commit may say "nothing to commit" if already done - that's OK)

echo.
echo [4/5] Setting remote...
git remote remove origin > nul 2>&1
git remote add origin https://github.com/plainsee2006/mec-software-tracker.git
git remote -v

echo.
echo [5/5] Pushing to GitHub...
echo.
echo If asked to login - browser will open for GitHub Sign In.
echo.
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo  PUSH FAILED
    echo ========================================
    echo.
    echo Common causes:
    echo  1. Need to login - run this command:
    echo       gh auth login
    echo     OR install GitHub CLI from cli.github.com
    echo.
    echo  2. Try with token - go to:
    echo       https://github.com/settings/tokens/new
    echo     Generate token with "repo" scope, then push using:
    echo       git push https://USERNAME:TOKEN@github.com/plainsee2006/mec-software-tracker.git main
    echo.
    pause & exit /b 1
)

echo.
echo ========================================
echo  PUSH SUCCESS
echo ========================================
echo.
echo Next: Go back to Vercel tab and click Redeploy
echo.
pause
