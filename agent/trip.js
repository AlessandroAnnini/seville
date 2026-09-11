/**
 * Soggiorno fisso: 27 dic 2026 – 1 gen 2027, coppia, voli Ryanair.
 * Meteo: ICON-EU (live) + IFS ECMWF (outlook) + clima AEMET/ERA5.
 */
(function (global) {
  const TZ = "Europe/Madrid";

  const TRIP = {
    start: "2026-12-27",
    end: "2027-01-01",
    guests: 2,
    guestsLabel: "due persone (coppia)",
    hotel: "Petit Palace Puerta de Triana",
    flights: {
      out: {
        no: "FR4348",
        from: "BLQ",
        to: "SVQ",
        dep: "17:30",
        arr: "20:15",
        date: "2026-12-27",
        weekday: "domenica",
        source: "Aeroporto di Bologna, orario invernale 2026/27",
      },
      back: {
        no: "FR4349",
        from: "SVQ",
        to: "BLQ",
        dep: "17:15",
        arr: "19:55",
        date: "2027-01-01",
        weekday: "venerdì",
        source: "Aeroporto di Bologna, orario invernale 2026/27",
      },
    },
    days: [
      { date: "2026-12-27", label: "Dom 27", title: "Arrivo", note: "FR4348 atterra 20:15. Taxi ~29 € (Aena festivo) o bus EA ~35 min. Cena Arenal. Niente monumenti." },
      { date: "2026-12-28", label: "Lun 28", title: "Alcázar + Cattedrale", note: "Alcázar primo slot (9:30–17:00 inverno, sito ufficiale). Cattedrale+Giralda dal pomeriggio. Sera: Memoria o Cañabota." },
      { date: "2026-12-29", label: "Mar 29", title: "Tutto Triana", note: "Mercado, Alfarería, Golondrinas, Betis al tramonto. L'altra sera: flamenco o Cañabota (lun–ven)." },
      { date: "2026-12-30", label: "Mer 30", title: "Città lenta", note: "Santa Cruz, Setas se piove, Plaza de España + María Luisa se asciutto. Niente Córdoba. Abantal chiuso mercoledì." },
      { date: "2026-12-31", label: "Gio 31", title: "Nochevieja", note: "El Jueves opzionale. Cena prenotata vicino Plaza Nueva. Uvas all'orologio Ayuntamiento. Niente monumenti." },
      { date: "2027-01-01", label: "Ven 1", title: "Partenza", note: "Alcázar chiuso. Cattedrale: visita culturale sospesa. Fiume/hotel. Aeroporto per le 15:00, FR4349 17:15." },
    ],
  };

  /** DWD ICON-EU ~7 km: il regionale più fine su Open-Meteo che copre l'Andalusia. ICON-D2 no (solo Europa centrale). */
  const LIVE_MODEL = "icon_eu";
  /** ECMWF IFS HRES: outlook 6–15 giorni, standard europeo. */
  const RANGE_MODEL = "ecmwf_ifs";

  /** AEMET stazione Sevilla Aeropuerto, normali 1981–2010. */
  const AEMET = {
    station: "Sevilla Aeropuerto (5783)",
    period: "1981–2010",
    dec: { t: 11.9, tmax: 16.6, tmin: 7.3, rainMm: 99, rainDays: 7.5, sunH: 154 },
    jan: { t: 10.9, tmax: 16.0, tmin: 5.7, rainMm: 66, rainDays: 6.1, sunH: 183 },
    url: "https://www.aemet.es/es/serviciosclimaticos/datosclimatologicos/valoresclimatologicos?l=5783",
  };

  /** Medie ERA5 Open-Meteo, 27 dic–1 gen, stagioni 2020/21–2024/25. */
  const ERA5_TRIP = [
    { date: "12-27", tmax: 16.7, tmin: 7.8 },
    { date: "12-28", tmax: 16.7, tmin: 8.2 },
    { date: "12-29", tmax: 15.7, tmin: 6.5 },
    { date: "12-30", tmax: 15.8, tmin: 6.5 },
    { date: "12-31", tmax: 16.3, tmin: 5.0 },
    { date: "01-01", tmax: 16.5, tmin: 7.3 },
  ];

  function liveWeatherUrl(lat, lng) {
    return (
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,uv_index` +
      `&hourly=temperature_2m,weather_code,precipitation_probability,uv_index` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,wind_speed_10m_max` +
      `&forecast_days=5&timezone=Europe%2FMadrid&models=${LIVE_MODEL}`
    );
  }

  function tripForecastUrl(lat, lng) {
    return (
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
      `&start_date=${TRIP.start}&end_date=${TRIP.end}` +
      `&timezone=Europe%2FMadrid&models=${RANGE_MODEL}`
    );
  }

  function daysUntil(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const target = Date.UTC(y, m - 1, d);
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / 86400000);
  }

  function tripInForecastWindow() {
    return daysUntil(TRIP.start) <= 15 && daysUntil(TRIP.end) >= -1;
  }

  function ymdInMadrid(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date);
    const get = (t) => parts.find((p) => p.type === t)?.value;
    return `${get("year")}-${get("month")}-${get("day")}`;
  }

  function tripDay(iso) {
    return TRIP.days.find((d) => d.date === iso) || null;
  }

  global.SevillaTrip = {
    TRIP,
    LIVE_MODEL,
    RANGE_MODEL,
    AEMET,
    ERA5_TRIP,
    liveWeatherUrl,
    tripForecastUrl,
    daysUntil,
    tripInForecastWindow,
    ymdInMadrid,
    tripDay,
  };
})(typeof window !== "undefined" ? window : globalThis);
