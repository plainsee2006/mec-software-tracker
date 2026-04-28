@echo off
chcp 65001 > nul
echo ========================================
echo  MEC Software Tracker - Setup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] ติดตั้ง dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo X npm install ล้มเหลว
    pause & exit /b 1
)

echo.
echo [2/4] ตรวจสอบไฟล์ .env.local
if not exist .env.local (
    echo.
    echo ! ยังไม่มี .env.local — กำลังสร้างจาก .env.example
    copy .env.example .env.local > nul
    echo.
    echo ===================================================================
    echo   กรุณาเปิด .env.local แล้วใส่ค่า DATABASE_URL จาก Aiven แล้วบันทึก
    echo   จากนั้นรัน setup.bat อีกครั้ง
    echo ===================================================================
    notepad .env.local
    pause & exit /b 0
)

echo.
echo [3/4] Push Schema ไปยังฐานข้อมูล...
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo X prisma db push ล้มเหลว — ตรวจสอบ DATABASE_URL ใน .env.local
    pause & exit /b 1
)

echo.
echo [4/4] Import ข้อมูลจาก Excel...
call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo X Import ล้มเหลว
    pause & exit /b 1
)

echo.
echo ========================================
echo  ✅ Setup เสร็จสมบูรณ์
echo ========================================
echo.
echo เริ่มใช้งาน:  npm run dev
echo เปิดเว็บ:     http://localhost:3000
echo.
pause
