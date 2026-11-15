#!/bin/bash
# Hitster Live starten (macOS: dubbelklik dit bestand, Linux: ./start.command)
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo
  echo " Node.js is niet gevonden. Installeer het eerst: brew install node"
  echo " (of via https://nodejs.org) en start dit bestand daarna opnieuw."
  echo
  read -r -p " Druk op Enter om te sluiten…" _
  exit 1
fi

export PORT="${PORT:-3000}"
export OPEN_BROWSER=1

echo
echo " Hitster Live wordt gestart…"
echo " De tv-pagina opent in je browser: zet die op de tv."
echo " Meldt de firewall iets? Kies 'Toestaan', anders kunnen telefoons niet joinen."
echo

node server.js
echo
echo " De server is gestopt."
read -r -p " Druk op Enter om te sluiten…" _
