/**
 * Sevilla Guide — motore agente client-side
 * Caldo, tapas (typical/good/special), mercati, day trip. Hub hotel Puerta de Triana.
 */
(function (global) {
  const TZ = "Europe/Madrid";
  const Trip = global.SevillaTrip;
  const USER = {
    lat: 37.38869,
    lng: -5.99963,
    zona: "Arenal / Puerta de Triana",
    hotel: "Petit Palace Puerta de Triana",
    bici: true,
    portabici: false,
    ev: true,
    autonomia: 250,
    guests: 2,
    tripStart: "2026-12-27",
    tripEnd: "2027-01-01",
  };

  const KNOWLEDGE = {
    logistica: `Hub hotel Reyes Católicos 5. Centro e Triana a piedi. Bici solo in città (no portabici). 12+ km: EV o treno. Itálica: bus da Plaza de Armas. Córdoba: AVE da Santa Justa.`,
    caldo: `Questo viaggio è inverno: 6–17°, pioggia possibile (dicembre è il mese più umido AEMET). Cammina tutto il giorno se asciutto. Giacca a strati. Estate (altri viaggi): sopra 32° indoor 13–17.`,
    voli: `Andata dom 27 dic FR4348 BLQ 17:30 → SVQ 20:15. Ritorno ven 1 gen FR4349 SVQ 17:15 → BLQ 19:55. Fonte: orario invernale Aeroporto di Bologna 2026/27. Taxi arrivo domenica ~29 € (Aena festivo). Bus EA ~35 min.`,
    chiusure: `1 gennaio: Alcázar chiuso (sito ufficiale). Cattedrale/Giralda visita culturale sospesa. Falli il 28–30. 1°: fiume, hotel, aeroporto per le 15:00.`,
    nochevieja: `31: prenota cena in due. Uvas a Plaza Nueva (Ayuntamiento). Non lasciare Alcázar/Cattedrale per il 1°.`,
    typical: `Triana: Las Golondrinas (solomillo, setas), Santa Ana (tortilla, espinacas), Casa Cuesta, Sol y Sombra, Triana Bar. Centro: El Rinconcillo (1670, gesso sul banco). Pranzo: barre del Mercado de Triana.`,
    good: `Vicino hotel: Bodeguita Romero (pringá, Harinas 10, no prenotazioni, chiuso agosto) e La Brunilda (Galera 5). San Lorenzo: Espacio Eslava, La Azotea. Arenal: Casa Morales. Alfalfa: Bar Alfalfa. Fiume: Lonja del Barranco (gourmet, misto).`,
    special: `Prenota. Abantal (1*, José de la Bandera, chiuso mer/sab/dom). Cañabota (1*, pesce, Orfila 3) o La Barra accanto. Az-Zait (Bib Gourmand, San Lorenzo). Ochando (Los Rosales, 30 min EV, stella 2026) solo se ha riaperto dopo i lavori del 29/06/2026.`,
    piatti: `Espinacas con garbanzos, pringá, solomillo al whisky, salmorejo, pescaíto / choco frito, carrillada, rabo de toro, jamón al taglio.`,
    mercati: `Triana e Arenal (vicino hotel) lun–sab mattina. Encarnación sotto le Setas. Feria + El Jueves (antiquariato, solo giovedì). Remedios se vuoi un mercado di quartiere.`,
    triana: `Oltre il Puente de Isabel II (8–12 min). Mercado, cerámica (Alfarería / Centro Cerámica), tapas typical, Calle Betis la sera. Non è un optional: è l'altra metà della città.`,
    monumenti: `Alcázar e Cattedrale all'apertura, prenotati. Mezzogiorno: Archivo de Indias, Bellas Artes, mercado coperto. Sera: fiume, Plaza de España, Setas.`,
    daytrip: `Itálica mezza giornata (bus, niente ombra). Carmona 30–40 min EV. Córdoba AVE ~45 min. Cádiz mare ~1h30. Doñana solo con visitatori / 4x4. Bici sempre in hotel.`,
    ev: `In centro l'auto è un peso. Ricarica se <20% o parti. Nervión Plaza CCS; Santa Justa se prendi l'AVE; Acciona Dinamarca verso Cádiz.`,
  };

  const DAY_NAMES = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

  function madridNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit",
      day: "numeric", month: "numeric", hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      day: map[get("weekday")] ?? new Date().getDay(),
      month: parseInt(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "numeric" }).format(new Date()), 10),
      hour: parseInt(get("hour"), 10),
      minute: parseInt(get("minute"), 10),
      label: new Date().toLocaleString("it-IT", { timeZone: TZ, weekday: "long", hour: "2-digit", minute: "2-digit" }),
    };
  }

  function gmaps(lat, lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  function gmapsDir(from, to, mode) {
    return "https://www.google.com/maps/dir/?api=1"
      + `&origin=${from.lat},${from.lng}`
      + `&destination=${to.lat},${to.lng}`
      + `&travelmode=${mode === "driving" ? "driving" : "walking"}`;
  }

  function haversineKm(a, b, c, d) {
    const R = 6371, toR = Math.PI / 180;
    const dLat = (c - a) * toR, dLng = (d - b) * toR;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a * toR) * Math.cos(c * toR) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  function modeFor(km, { temp = 24, rain = false } = {}) {
    if (km <= 3) return "piedi";
    if (km <= 12 && !rain && temp < 32) return "bici o piedi (se non è un forno)";
    return "EV o treno/bus — bici in hotel";
  }

  function getPlaces() {
    return global.PLACES || global.__SEVILLA_PLACES || [];
  }

  function searchPlaces({ cat, q, tier, max = 8 } = {}) {
    const places = getPlaces();
    const ql = (q || "").toLowerCase();
    return places
      .filter((p) => {
        if (cat && p.cat !== cat) return false;
        if (tier && p.tier !== tier) return false;
        if (!ql) return true;
        return (p.name + " " + (p.desc || "") + " " + (p.place || "")).toLowerCase().includes(ql);
      })
      .sort((a, b) => {
        const sa = (Number(a.popularity) || 0) + (Number(a.romance) || 0);
        const sb = (Number(b.popularity) || 0) + (Number(b.romance) || 0);
        return sb - sa;
      })
      .slice(0, max);
  }

  function marketsToday() {
    const now = madridNow();
    return getPlaces().filter((p) => {
      if (p.cat !== "market" || !p.days) return false;
      return p.days.includes(now.day);
    });
  }

  async function fetchWeather(lat = USER.lat, lng = USER.lng) {
    const url = Trip
      ? Trip.liveWeatherUrl(lat, lng)
      : `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index,precipitation` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max` +
        `&forecast_days=5&timezone=Europe%2FMadrid&models=icon_eu`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("meteo HTTP " + res.status);
    return res.json();
  }

  function wmo(code) {
    if (code === 0) return "sereno";
    if (code <= 2) return "poco nuvoloso";
    if (code === 3) return "nuvoloso";
    if (code >= 51 && code < 70) return "pioggia";
    if (code >= 80) return "rovesci/temporale";
    return "variabile";
  }

  function walkComfort(temp, uv, hour) {
    let score = 100;
    if (temp > 26) score -= (temp - 26) * 6;
    if (temp > 32) score -= (temp - 32) * 4;
    if (uv != null && uv >= 7) score -= 15;
    if (hour >= 13 && hour <= 17 && temp > 28) score -= 10;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function detectIntent(text) {
    const t = text.toLowerCase();
    if (/aiuto|help|chi sei|cosa sai/.test(t)) return "help";
    if (/vol[oi]|ryanair|fr4348|fr4349|aeroport|blq|svq/.test(t)) return "flights";
    if (/nochevieja|uvas|uva|31 dic|capodanno/.test(t)) return "nye";
    if (/caldo|uv|siesta|conforto|comfort|afa|inverno|piove|freddo/.test(t)) return "heat";
    if (/meteo|piove|tempo|sole|forecast/.test(t)) return "weather";
    if (/special|michelin|abantal|cañabota|canabota|ochando|az-?zait|cena special/.test(t)) return "special";
    if (/mang|tapas|ristor|cena|pranzo|local|typical|typical|fame|pring|golondrin/.test(t)) return "food";
    if (/mercat|jueves|lonja|encarnaci/.test(t)) return "market";
    if (/flamenc|anselma|tablao/.test(t)) return "flamenco";
    if (/triana|betis|alfarer|ceramic/.test(t)) return "triana";
    if (/alc[aá]zar|catedr|giralda|setas|macarena|pilatos/.test(t)) return "monument";
    if (/it[aá]lica|c[oó]rdoba|c[aá]diz|doñana|donana|carmona|roc[ií]o|day.?trip/.test(t)) return "daytrip";
    if (/ricaric|colonnin|ev\b|elettric/.test(t)) return "ev";
    if (/tramont|alba|golden|mirador/.test(t)) return "sunset";
    if (/oggi|adesso|2 ore|due ore|pomeriggio|mattina|piano|itiner|cosa faccio|consigli|luned|marted|mercoled|gioved|venerd|domenica|1 gen|primo gennaio|28|29|30/.test(t)) return "plan";
    return "plan";
  }

  function getItinerary() {
    return global.ITINERARY || { days: [] };
  }

  function pickItineraryDay(userText) {
    const days = getItinerary().days || [];
    const t = (userText || "").toLowerCase();
    const map = [
      [/dom(?:enica)?\s*27|27\s*dic|arriv/, "2026-12-27"],
      [/luned|28\s*dic|alc[aá]zar/, "2026-12-28"],
      [/marted|29\s*dic|triana/, "2026-12-29"],
      [/mercoled|30\s*dic/, "2026-12-30"],
      [/gioved|31\s*dic|nochevieja/, "2026-12-31"],
      [/venerd|1\s*gen|primo gennaio|partenz/, "2027-01-01"],
    ];
    for (const [re, date] of map) {
      if (re.test(t)) return days.find((d) => d.date === date) || null;
    }
    const todayIso = Trip ? Trip.ymdInMadrid() : null;
    return days.find((d) => d.date === todayIso) || null;
  }

  function formatItineraryDay(d) {
    if (!d) return "";
    const lines = [`**${d.label} — ${d.title}.**`];
    if (d.rain) lines.push(`Se piove: ${d.rain}`);
    let prev = null;
    (d.blocks || []).forEach((b) => {
      const cur = getPlaces().find((p) => p.name === b.place) || null;
      if (prev && cur) {
        const air = /aeroport/i.test(prev.name + cur.name);
        const mode = air || (b.walkMin != null && b.walkMin >= 20) ? "driving" : "walking";
        const how = mode === "driving" ? "auto/taxi" : "a piedi";
        lines.push(`  → ${how} [Maps](${gmapsDir(prev, cur, mode)})`);
      }
      lines.push(`• **${b.when}:** ${b.place} — ${b.note || ""}`);
      if (cur) prev = cur;
    });
    const books = (d.book || []).filter((b) => b.need === "now");
    if (books.length) {
      lines.push("");
      lines.push("**Prenota:**");
      books.forEach((b) => {
        const link = b.url ? ` [ufficiale](${b.url})` : (b.tel ? ` tel. ${b.tel}` : "");
        lines.push(`• ${b.name}${link}`);
      });
    }
    return lines.join("\n");
  }

  function formatItineraryIndex() {
    return (getItinerary().days || [])
      .map((d) => `• ${d.label}: ${d.title}`)
      .join("\n");
  }

  function listPois(pois) {
    if (!pois.length) return "_Nessun POI per questo filtro._";
    return pois
      .map((p) => {
        const km = haversineKm(USER.lat, USER.lng, p.lat, p.lng).toFixed(1);
        const tier = p.tier ? ` · ${p.tier}` : "";
        return `• **${p.name}** (${km} km${tier}) — ${p.desc || ""} [Maps](${gmaps(p.lat, p.lng)})`;
      })
      .join("\n");
  }

  async function answer(userText) {
    const intent = detectIntent(userText);
    const now = madridNow();
    const lines = [];
    lines.push(`_Base: ${USER.hotel} · coppia · 27 dic 2026–1 gen 2027 · ${now.label}_`);
    lines.push("");

    let weather = null;
    try {
      if (["heat", "weather", "plan", "daytrip", "triana", "monument", "nye"].includes(intent)) {
        weather = await fetchWeather();
      }
    } catch (e) {
      lines.push(`Dati live parziali: ${e.message}`);
      lines.push("");
    }

    const temp = weather?.current?.temperature_2m;
    const feel = weather?.current?.apparent_temperature ?? temp;
    const uv = weather?.current?.uv_index;
    const wind = weather?.current?.wind_speed_10m ?? 0;
    const rain = (weather?.current?.precipitation ?? 0) > 0.1 || (weather?.current?.weather_code ?? 0) >= 51;
    const comfort = temp != null ? walkComfort(feel ?? temp, uv, now.hour) : null;

    if (weather?.current) {
      lines.push(`Meteo **${Math.round(temp)}°** (percepita ${Math.round(feel)}°) · ${wmo(weather.current.weather_code)} · vento ${Math.round(wind)} km/h${uv != null ? ` · UV ${uv}` : ""}${rain ? " · pioggia" : ""}`);
      if (comfort != null) lines.push(`Camminare ora: **${comfort}/100** ${comfort >= 65 ? "(ok)" : comfort >= 40 ? "(ombra / pause)" : "(indoor / siesta)"}`);
      lines.push("");
    }

    switch (intent) {
      case "help": {
        lines.push("Sono la **guida Sevilla** per il vostro soggiorno in **due** (27 dic 2026 – 1 gen 2027).");
        lines.push("So di: piano 27 dic–1 gen, voli FR4348/4349, tapas, chiusure del 1°, Nochevieja.");
        lines.push("Prova: *piano del soggiorno*, *lunedì*, *1 gennaio*, *voli*, *dove mangiare*.");
        break;
      }
      case "flights": {
        lines.push(KNOWLEDGE.voli);
        lines.push("");
        lines.push(listPois(searchPlaces({ q: "aeroporto" })));
        break;
      }
      case "nye": {
        const nye = pickItineraryDay("31 dicembre nochevieja") || (getItinerary().days || []).find((d) => d.date === "2026-12-31");
        if (nye) lines.push(formatItineraryDay(nye));
        else lines.push(KNOWLEDGE.nochevieja);
        lines.push("");
        lines.push(KNOWLEDGE.chiusure);
        lines.push("");
        lines.push(listPois(searchPlaces({ q: "nueva" })));
        break;
      }
      case "heat": {
        lines.push(KNOWLEDGE.caldo);
        if (comfort != null && comfort < 40) lines.push("\n**Ora:** resta indoor (Arenal market, Cattedrale se hai slot, Bellas Artes) e tapas dopo le 20:30.");
        else if (comfort != null && comfort < 65) lines.push("\n**Ora:** ombra, acqua, monumenti già fatti o corti. Fiume sì, María Luisa no a lungo.");
        else lines.push("\n**Ora:** puoi camminare. Sfrutta Santa Cruz o Triana.");
        break;
      }
      case "weather": {
        lines.push("**Prossimi giorni:**");
        const d = weather?.daily;
        if (d) {
          for (let i = 0; i < Math.min(5, d.time.length); i++) {
            const name = i === 0 ? "Oggi" : d.time[i].slice(5);
            lines.push(`• ${name}: ${Math.round(d.temperature_2m_min[i])}–${Math.round(d.temperature_2m_max[i])}° · ${wmo(d.weather_code[i])} · UV max ${d.uv_index_max?.[i] ?? "—"} · pioggia ${d.precipitation_probability_max?.[i] ?? "—"}%`);
          }
        }
        break;
      }
      case "food": {
        lines.push("**Typical e good** (non apro con le stelle).");
        lines.push(KNOWLEDGE.piatti);
        lines.push("\n**Typical**");
        lines.push(KNOWLEDGE.typical);
        lines.push(listPois(searchPlaces({ cat: "tapas", tier: "typical" })));
        lines.push("\n**Good**");
        lines.push(KNOWLEDGE.good);
        lines.push(listPois(searchPlaces({ cat: "tapas", tier: "good" })));
        lines.push("\nSe vuoi una cena special, chiedi *cena speciale*.");
        break;
      }
      case "special": {
        lines.push(KNOWLEDGE.special);
        lines.push("");
        lines.push(listPois(searchPlaces({ cat: "food", tier: "special" })));
        break;
      }
      case "market": {
        lines.push(`**${DAY_NAMES[now.day]}** — mercati in calendario:`);
        const mt = marketsToday();
        lines.push(mt.length ? listPois(mt) : "_Nessun mercado tipico oggi (domenica i banchi sono chiusi)._");
        if (now.day === 4) lines.push("\nOggi è **giovedì** → El Jueves su Calle Feria (usato/anticariato).");
        lines.push("\n" + KNOWLEDGE.mercati);
        break;
      }
      case "flamenco": {
        lines.push("**Serio:** Casa de la Memoria (prenota). **Barrio:** Casa Anselma in Triana, tardi, orari instabili.");
        lines.push(listPois(searchPlaces({ cat: "flamenco" })));
        break;
      }
      case "triana": {
        lines.push(KNOWLEDGE.triana);
        lines.push(`Mezzo: ${modeFor(1.2, { temp: feel ?? 24, rain })}.`);
        lines.push("");
        lines.push(listPois(searchPlaces({ q: "triana" }).slice(0, 8)));
        break;
      }
      case "monument": {
        lines.push(KNOWLEDGE.monumenti);
        lines.push("");
        lines.push(listPois(searchPlaces({ cat: "monument", max: 8 })));
        break;
      }
      case "daytrip": {
        lines.push(KNOWLEDGE.daytrip);
        lines.push("");
        lines.push(listPois(searchPlaces({ cat: "daytrip" })));
        if (/ochando/i.test(userText)) lines.push("\nOchando: controlla se ha riaperto. Non partire a vuoto.");
        break;
      }
      case "ev": {
        lines.push(KNOWLEDGE.ev);
        lines.push("");
        lines.push(listPois(searchPlaces({ cat: "ev" })));
        break;
      }
      case "sunset": {
        lines.push("Tramonti: **Plaza de España**, Torre del Oro / fiume, passerella Setas, Calle Betis.");
        lines.push(listPois(searchPlaces({ cat: "mirador" })));
        break;
      }
      case "plan":
      default: {
        lines.push("### Piano del soggiorno");
        const picked = pickItineraryDay(userText);
        const days = getItinerary().days || [];
        if (picked) {
          lines.push(formatItineraryDay(picked));
        } else if (days.length) {
          if (Trip) {
            const left = Trip.daysUntil(Trip.TRIP.start);
            if (left > 0) lines.push(`Mancano **${left} giorni** al 27 dicembre. Prenota Alcázar e Cattedrale per lunedì 28. Niente monumenti il 1°.`);
          }
          lines.push("");
          lines.push(formatItineraryIndex());
          lines.push("");
          lines.push("Chiedi un giorno: *lunedì*, *Triana*, *1 gennaio*.");
        } else if (Trip) {
          Trip.TRIP.days.forEach((d) => lines.push(`• ${d.label}: ${d.title}`));
        }
        if (rain) lines.push("\n**Ora piove:** segui la riga «se piove» del giorno, non i mirador.");
        lines.push("");
        lines.push(KNOWLEDGE.logistica);
        break;
      }
    }

    lines.push("\n---\n27 dic–1 gen: inverno e orari. Stelle solo se le chiedete.");
    return { intent, text: lines.join("\n") };
  }

  global.SevillaGuide = {
    USER,
    TRIP: Trip ? Trip.TRIP : null,
    KNOWLEDGE,
    answer,
    searchPlaces,
    marketsToday,
    fetchWeather,
    modeFor,
    walkComfort,
    madridNow,
  };
  global.EmeraudeGuide = global.SevillaGuide;
})(typeof window !== "undefined" ? window : globalThis);
