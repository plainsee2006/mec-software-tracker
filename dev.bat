@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo เริ่ม Dev Server — เปิดเบราว์เซอร์ที่ http://localhost:3000
call npm run dev
