@echo off
chcp 65001 > nul
title Liman Gemi Takip Sistemi Başlatıcı
cls

echo =======================================================
echo     LİMAN GEMİ TAKİP SİSTEMİ BAŞLATILIYOR...
echo =======================================================
echo.

echo [1/2] Backend API başlatılıyor (http://localhost:5000)...
pushd "%~dp0backend\LimanGemiTakip.Api"
start "Liman API (Backend)" cmd /k "dotnet run"
popd

timeout /t 3 /nobreak > nul

echo [2/2] Frontend Vite sunucusu başlatılıyor (http://localhost:5173)...
pushd "%~dp0frontend"
start "Liman UI (Frontend)" cmd /k "npm run dev"
popd

echo.
echo =======================================================
echo  Sistem Hazır!
echo  - Swagger API: http://localhost:5000/swagger
echo  - Web Arayüzü: http://localhost:5173
echo =======================================================
echo.
pause
