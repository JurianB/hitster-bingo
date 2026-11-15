# Hitster Live (woonkamerspel)

Start: dubbelklik `start.bat` (Windows) of draai `node server.js` (vereist Node.js).
De tv-pagina opent vanzelf op http://localhost:3000/ — zet die op de tv (F = volledig scherm).
Telefoons scannen de QR-code (zelfde wifi) en spelen mee. Geen `npm install` nodig.

Spelverloop
- Tv: lobby met QR en wie er al binnen is. Start met spatie/Enter, de knop, of Start/A op een controller.
- Om de beurt draait een speler aan het rad via de telefoon (knop ingedrukt houden = harder draaien).
- Telefoon: kies een vakje van de gedraaide kleur en vul je antwoord in
  (titel/artiest met typefoutentolerantie, jaartal, decennium of jaar ± 3).
- Als iedereen heeft geantwoord onthult de tv automatisch (uit te zetten). Goede antwoorden worden ✓ op de kaart.
- Vijf op een rij = BINGO. "Nieuw spel" geeft iedereen een nieuwe kaart zonder opnieuw te joinen.

Tv-sneltoetsen: Spatie draaien · Enter onthullen · P pauze · R opnieuw · J QR tonen · F volledig scherm.
Telefoon weg of herstart? Gewoon de pagina weer openen: je krijgt je kaart terug.
Werkt joinen niet? Sta Node.js toe in Windows Firewall (privénetwerk) en gebruik een van de andere adressen onder de QR.
