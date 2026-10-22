@echo off
chcp 65001 > nul
title Liman Gemi Takip Sistemi Başlatıcı
echo =======================================================
echo     LİMAN GEMİ TAKİP SİSTEMİ BAŞLATILIYOR...
echo =======================================================
echo.

echo [1/2] Backend API başlatılıyor (http://localhost:5000)...
start "Liman API (Backend)" cmd /k "cd /d ""%~dp0backend\LimanGemiTakip.Api"" && dotnet run"

timeout /t 3 /nobreak > nul

echo [2/2] Frontend Vite sunucusu başlatılıyor (http://localhost:5173)...
start "Liman UI (Frontend)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo =======================================================
echo  Sistem Hazır!
echo  - Swagger API: http://localhost:5000/swagger
echo  - Web Arayüzü: http://localhost:5173
echo =======================================================
echo.
pause
