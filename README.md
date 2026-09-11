# Sevilla — mappa del soggiorno

Compagno di viaggio per **due persone**, 27 dicembre 2026 – 1 gennaio 2027, hotel **Petit Palace Puerta de Triana**.

Voli (orario invernale Aeroporto di Bologna 2026/27): **FR4348** domenica 17:30 BLQ → SVQ 20:15; **FR4349** venerdì 1 gen 17:15 SVQ → BLQ 19:55.

Dicembre a Siviglia è mite e il mese più piovoso (AEMET). Non è un viaggio d'estate.

## Cosa fa

- **Piano** (default): sei giorni bloccati, timeline Mattina / Pomeriggio / Sera, minuti a piedi, riga pioggia, checklist **Prenota ora** (solo siti ufficiali)
- La mappa segue il giorno: pin del piano in evidenza, gli altri attenuati, linea tratteggiata
- **Catalogo**: lista pieghevole con punteggi pop/rom, filtri, mercati, zone
- Meteo in un accordion: live **ICON-EU** (DWD ~7 km), outlook **ECMWF IFS**, clima AEMET + ERA5
- Telefono: mappa a schermo intero + foglio peek / metà / pieno
- Guida in chat: *piano del soggiorno*, *lunedì*, *1 gennaio*, tapas, voli

Piano: 27 arrivo · 28 Alcázar + Cattedrale · 29 Triana · 30 città lenta · 31 Nochevieja · 1 partenza. Córdoba non è nel piano.

## File

| File | Uso |
|------|-----|
| `index.html` | App (Leaflet) |
| `places_data.json` | Pin, orari e link ufficiali sui biglietti |
| `agent/itinerary.json` | Piano e prenotazioni |
| `agent/trip.js` | Date, voli, URL meteo |
| `agent/guide_engine.js` | Motore della chat |
| `agent/user_context.yaml` | Vincoli ospite |
| `agent/knowledge/` | Note per l'agente Grok |
| `.grok/skills/sevilla-guide/` | Skill `/sevilla-guide` |

Serve un server HTTP (`python3 -m http.server`) perché JSON e itinerario non si caricano da `file://`.

Non c'è ancora un sito pubblico.
