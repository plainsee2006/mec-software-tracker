@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ========================================
echo  Push code ไปยัง GitHub
echo ========================================
echo.

where git > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo X ไม่พบ git — ติดตั้งก่อนที่ https://git-scm.com/download/win
    pause & exit /b 1
)

if not exist .git (
    echo [1/4] เริ่มต้น Git repository...
    call git init -b main
    if %ERRORLEVEL% NEQ 0 ( pause & exit /b 1 )
) else (
    echo [1/4] มี Git repo อยู่แล้ว ข้ามขั้นตอนนี้
)

echo.
echo [2/4] เพิ่มไฟล์เข้า staging...
call git add .
if %ERRORLEVEL% NEQ 0 ( pause & exit /b 1 )

echo.
echo [3/4] Commit...
call git commit -m "Initial: MEC Software Tracker" 2> nul
if %ERRORLEVEL% NEQ 0 (
    echo - ไม่มีอะไรต้อง commit หรือ commit ไปแล้ว
)

echo.
set /p REPO_URL="[4/4] ใส่ GitHub Repo URL (เช่น https://github.com/USER/mec-software-tracker.git): "
if "%REPO_URL%"=="" (
    echo X ไม่ได้ใส่ URL
    pause & exit /b 1
)

call git remote remove origin > nul 2>&1
call git remote add origin %REPO_URL%
call git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo X push ล้มเหลว — ลองตรวจ:
    echo   - URL ถูกต้องไหม
    echo   - Login GitHub บน Windows credential ถูกต้องไหม
    echo   - Repo ที่สร้างเป็น empty repo (ไม่มี README) ใช่ไหม
    pause & exit /b 1
)

echo.
echo ========================================
echo  ✅ Push สำเร็จ!
echo ========================================
echo.
echo ต่อไป: ไป https://vercel.com/new เลือก Import Project
echo เลือก repo "mec-software-tracker" แล้วใส่ Environment Variables
echo (ดู README.md หัวข้อ "Deploy ไปที่ Vercel")
echo.
pause
