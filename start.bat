@echo off
chcp 65001 >nul
title Hitster Live
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is niet gevonden. Installeer het eerst via https://nodejs.org ^(LTS-versie^)
  echo  en start dit bestand daarna opnieuw.
  echo.
  pause
  exit /b 1
)

set PORT=3000
set OPEN_BROWSER=1

echo.
echo  Hitster Live wordt gestart...
echo  De tv-pagina opent in je browser: zet die op de tv.
echo.
echo  Meldt Windows Firewall iets? Kies "Toegang toestaan" ^(priveenetwerk^),
echo  anders kunnen telefoons niet joinen.
echo.

node server.js
echo.
echo  De server is gestopt.
pause
