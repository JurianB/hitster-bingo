# Hitster Live (woonkamerspel)

Start (vereist Node.js): dubbelklik `start.bat` (Windows) of `start.command` (macOS, eerst eenmalig `chmod +x start.command`). Op elk platform werkt ook `npm run play` (opent de browser) of `node server.js`.
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


Op de telefoon draai je het rad door eroverheen te swipen (hoe harder, hoe harder het draait). De tv-weergave past zich aan: rad groot tijdens het draaien, spelers groot tijdens het antwoorden, en een fullscreen onthulling zodra iedereen heeft geantwoord. Werkt op breedbeeld-, tablet- en staande schermen.

**Roomcode / op afstand spelen:** de tv toont naast de QR-code een roomcode van 4 letters. Telefoons op hetzelfde wifi scannen de QR-code (de code zit erin). Spelers op een andere plek gaan naar het adres van de server (bijv. je Render-URL + `/play`) en vullen de code in. Vaste code instellen kan met de omgevingsvariabele `ROOM_CODE`. Voor spelen op afstand moet de server online staan (zie `render.yaml`).

## Spelen op afstand
Bij het joinen kiezen spelers **📺 Zelfde kamer** of **🌐 Op afstand**. Spelers op afstand horen de 30-seconden-preview synchroon op hun eigen toestel (de tv stuurt URL + positie, de telefoon corrigeert op basis van gemeten ping en drift > 0,35 s) en krijgen na de onthulling een songkaartje. Ze gebruiken dezelfde roomcode en dezelfde site-URL. De tv moet wel in beeld/geluid staan voor de ronde-flow; de 🔊-knop in de telefoon dempt de muziek. Op iOS moet de speler één keer tikken om geluid toe te staan.

## Meerdere kamers
Elke tv die verbindt krijgt een eigen kamer met eigen roomcode; spelers komen alleen in de kamer van hun code. `TV_KEY` beschermt alleen de tv-pagina. Een tv onthoudt zijn code (ook na herladen of serverherstart). Open `/tv?key=...&room=NEW` voor een nieuwe kamer, of `&room=ABCD` voor een vaste code. Gebruik voor twee tv's wel aparte apparaten of browserprofielen: het spelverloop wordt per browser opgeslagen. Lege kamers worden na 6 uur opgeruimd.

## Rad, bingo's en volle kaart
- **Rad samenstellen:** in de lobby vink je categorieën aan of uit (standaard alles). De kaarten bevatten alleen de gekozen categorieën en het rad verdeelt de schijf gelijk (4 categorieën = 25% per stuk).
- **Slim rad:** heeft niemand meer een open vakje van een categorie, dan verdwijnt die met een animatie van het rad (ook op de telefoons). Heeft één speler alle vakjes van de getrokken categorie al, dan doet die speler die ronde niet mee en hoeven de anderen niet op hem te wachten.
- **Countdown:** na afloop van de preview krijgt iedereen 5 seconden, fullscreen met een hartslag-geluid in de maat van de cijfers (op de tv; spelers op afstand horen het ook).
- **Meerdere bingo's:** elke extra rij geeft een nieuwe fullscreen melding ("voor de tweede keer bingo"). Een volle kaart krijgt een eigen, extra feestelijke melding.
