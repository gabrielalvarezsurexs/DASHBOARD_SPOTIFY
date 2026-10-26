/* Dashboard Gabriel × Javier. Todo se agrega en el navegador sobre window.SPOTIFY
   (tabla columnar generada por pipeline/export_dashboard.py). Reglas visuales: docs/design.md. */
(() => {
  "use strict";

  const D = window.SPOTIFY;
  if (!D) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p class="wrap error">Falta <code>data.js</code>. Corre <code>uv run python -m pipeline.export_dashboard</code>.</p>'
    );
    return;
  }

  // ---------- datos base ----------
  const R = D.rows;
  const N = R.u.length;
  const BIT = D.bits;
  const USERS = D.users;
  const NAME = { gabo: "Gabriel", javi: "Javier" };
  const PLATFORM = { android: "Android", windows: "Windows", web: "Web", ios: "iOS", other: "Otro" };
  const nameOf = (u) => NAME[u] ?? u[0].toUpperCase() + u.slice(1);
  const DAY = 1440;

  const dayOf = new Int32Array(N);
  const hourOf = new Uint8Array(N);
  const dowOf = new Uint8Array(N); // 0 = lunes
  const lastDay = {}; // último día con datos de cada persona: marca el mes incompleto
  for (let i = 0; i < N; i++) {
    const d = Math.floor(R.m[i] / DAY);
    dayOf[i] = d;
    hourOf[i] = Math.floor((R.m[i] - d * DAY) / 60);
    dowOf[i] = (d + 3) % 7; // 1970-01-01 fue jueves
    const u = USERS[R.u[i]];
    if (!(lastDay[u] >= d)) lastDay[u] = d;
  }

  // ---------- formato es-MX ----------
  const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const DOW = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
  const DOW_LONG = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];
  const nf = (d) => new Intl.NumberFormat("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
  const nf0 = nf(0);
  const nf1 = nf(1);
  const pct = (x, d = 0) => `${nf(d).format(100 * x)}%`;
  const hrs = (h) => (h >= 100 ? nf0.format(h) : nf1.format(h));
  const dateOfDay = (d) => new Date(d * 864e5);
  const fmtDay = (d) => {
    const x = dateOfDay(d);
    return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
  };
  const fmtMonth = (dt) => `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
  // Ejes de tiempo en español (Plot los pone en inglés por defecto)
  const tickMonth = (dt) => (dt.getUTCMonth() === 0 ? `${MONTHS[0]}\n${dt.getUTCFullYear()}` : MONTHS[dt.getUTCMonth()]);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const minOf = (iso) => Date.parse(`${iso}T00:00:00Z`) / 60000;
  const who = (u) => `<span class="who-${esc(u)}">${esc(nameOf(u))}</span>`;
  const trunc = (s, n = 24) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const colorOf = (u) => cssVar(`--${u}`) || cssVar("--context");

  // ---------- periodos ----------
  let firstYear = 9999;
  let lastYear = 0;
  for (let i = 0; i < N; i += 97) {
    const y = dateOfDay(dayOf[i]).getUTCFullYear();
    firstYear = Math.min(firstYear, y);
    lastYear = Math.max(lastYear, y);
  }
  lastYear = Math.max(lastYear, dateOfDay(dayOf[N - 1]).getUTCFullYear());
  const windowYear = Number(D.window_start.slice(0, 4));
  const PERIODS = [
    { id: "window", label: `Ventana común (${MONTHS[Number(D.window_start.slice(5, 7)) - 1]} ${windowYear} →)`, from: minOf(D.window_start), to: Infinity },
  ];
  for (let y = windowYear; y <= lastYear; y++) {
    PERIODS.push({ id: String(y), label: String(y), from: minOf(`${y}-01-01`), to: minOf(`${y + 1}-01-01`) });
  }
  PERIODS.push({ id: "all", label: "Todo el historial (con huecos)", from: -Infinity, to: Infinity });

  // ---------- estado (en la URL para compartir un corte exacto) ----------
  const state = { person: "both", period: "window", streams: false, artist: "" };
  const readHash = () => {
    const h = new URLSearchParams(location.hash.slice(1));
    if (["both", ...USERS].includes(h.get("p"))) state.person = h.get("p");
    if (PERIODS.some((p) => p.id === h.get("t"))) state.period = h.get("t");
    if (h.has("s")) state.streams = h.get("s") !== "0";
    state.artist = h.get("a") ?? "";
    if (["light", "dark"].includes(h.get("th"))) document.documentElement.dataset.theme = h.get("th");
    // #only=c3 muestra un solo capítulo (lo usa pipeline/print_pdf.py para las capturas del PDF)
    const only = h.get("only");
    if (only) {
      document.body.classList.add("only");
      document.querySelector(".masthead").hidden = only !== "resumen";
      for (const s of document.querySelectorAll("main > section")) s.hidden = s.id !== only;
    }
  };
  const writeHash = () => {
    const h = new URLSearchParams({ p: state.person, t: state.period, s: state.streams ? "1" : "0" });
    if (state.artist) h.set("a", state.artist);
    history.replaceState(null, "", `#${h}`);
  };
  const active = () => (state.person === "both" ? USERS : [state.person]);
  const period = () => PERIODS.find((p) => p.id === state.period);

  /** Índices de filas por usuario según los filtros. */
  function select({ streamsOnly = state.streams, tracksOnly = false } = {}) {
    const p = period();
    const out = {};
    const slots = USERS.map((u) => (active().includes(u) ? (out[u] = []) : null));
    for (let i = 0; i < N; i++) {
      const arr = slots[R.u[i]];
      if (!arr) continue;
      const m = R.m[i];
      if (m < p.from || m >= p.to) continue;
      const f = R.f[i];
      if (streamsOnly && !(f & BIT.stream)) continue;
      if (tracksOnly && f & BIT.episode) continue;
      arr.push(i);
    }
    return out;
  }

  // ---------- helpers de gráficas ----------
  const base = (extra) => ({
    style: { background: "transparent", color: cssVar("--ink-2"), fontFamily: cssVar("--sans"), fontSize: "12px", overflow: "visible" },
    marginTop: 12,
    ...extra,
  });
  const widthOf = (el) => Math.max(280, Math.floor(el.getBoundingClientRect().width));

  function tableView(columns, rows) {
    const det = document.createElement("details");
    det.className = "table-view";
    det.innerHTML = `<summary>Ver tabla</summary>${tableHTML(columns, rows)}`;
    return det;
  }
  function tableHTML(columns, rows) {
    const th = columns.map((c) => `<th scope="col" class="${c.num ? "r" : ""}">${c.label}</th>`).join("");
    const tr = rows
      .map((r) => `<tr>${columns.map((c) => `<td class="${c.num ? "r" : ""}">${c.fmt ? c.fmt(r[c.key], r) : esc(r[c.key])}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
  }
  function chart(el, { title, note = "", plot = null, table = null, html = "", clickable = false }) {
    el.replaceChildren();
    const fig = document.createElement("figure");
    fig.className = `chart${clickable ? " clickable" : ""}`;
    fig.innerHTML = `<figcaption><h3>${title}</h3>${note ? `<p>${note}</p>` : ""}</figcaption>${html}`;
    if (plot) fig.append(plot);
    if (table) fig.append(tableView(table.columns, table.rows));
    el.append(fig);
    return fig;
  }
  /** Crea N contenedores span-x dentro de una grid y devuelve [usuario, elemento]. */
  function perUser(grid, span) {
    grid.replaceChildren();
    return active().map((u) => {
      const el = document.createElement("div");
      el.className = `span-${span}`;
      grid.append(el);
      return [u, el];
    });
  }
  const userSpan = () => (active().length > 1 ? 6 : 8);

  // ---------- agregaciones ----------
  /** Perfil de cada persona con los filtros actuales: lo usan las tarjetas, el cara a cara y los insights. */
  function profiles(sel, selTracks) {
    return active().map((u) => {
      const idx = sel[u];
      let s = 0;
      let ep = 0;
      let night = 0;
      let evening = 0;
      let weekend = 0;
      const days = new Map();
      const byArtist = new Map();
      const byTrack = new Map();
      const byHour = new Float64Array(24);
      const byPlat = new Map();
      for (const i of idx) {
        const sec = R.s[i];
        s += sec;
        days.set(dayOf[i], (days.get(dayOf[i]) ?? 0) + sec);
        byHour[hourOf[i]] += sec;
        if (hourOf[i] < 6) night += sec;
        if (hourOf[i] >= 17 && hourOf[i] < 21) evening += sec;
        if (dowOf[i] >= 5) weekend += sec;
        byPlat.set(R.p[i], (byPlat.get(R.p[i]) ?? 0) + sec);
        if (R.f[i] & BIT.episode) {
          ep += sec;
          continue;
        }
        if (R.a[i] >= 0) byArtist.set(R.a[i], (byArtist.get(R.a[i]) ?? 0) + sec);
        if (R.k[i] >= 0 && R.f[i] & BIT.stream) byTrack.set(R.k[i], (byTrack.get(R.k[i]) ?? 0) + 1);
      }
      let skips = 0;
      let shuffled = 0;
      let skipsShuffled = 0;
      const tracks = selTracks[u].length;
      for (const i of selTracks[u]) {
        const sk = R.f[i] & BIT.skip ? 1 : 0;
        skips += sk;
        if (R.f[i] & BIT.shuffle) {
          shuffled++;
          skipsShuffled += sk;
        }
      }
      const musicS = s - ep;
      const dayVals = [...days.values()].sort((a, b) => a - b);
      const span = idx.length ? dayOf[idx[idx.length - 1]] - dayOf[idx[0]] + 1 : 0;
      const top10 = topBy(byArtist, 10);
      const [ta] = top10;
      const [tt] = topBy(byTrack, 1);
      const [tp] = topBy(byPlat, 1);
      const [rd] = topBy(days, 1);
      return {
        u,
        hours: s / 3600,
        activeDays: days.size,
        dayShare: span ? days.size / span : 0,
        medianMin: dayVals.length ? dayVals[Math.floor(dayVals.length / 2)] / 60 : 0,
        artists: byArtist.size,
        artistTime: byArtist,
        musicS,
        top10Share: musicS ? top10.reduce((a, [, v]) => a + v, 0) / musicS : 0,
        topArtist: ta ? { name: D.artists[ta[0]], share: ta[1] / musicS } : null,
        topTrack: tt ? { name: D.tracks[tt[0]][0], artist: D.artists[D.tracks[tt[0]][1]] ?? "", n: tt[1] } : null,
        peakH: s ? byHour.indexOf(Math.max(...byHour)) : 0,
        nightShare: s ? night / s : 0,
        eveningShare: s ? evening / s : 0,
        weekendShare: s ? weekend / s : 0,
        podShare: s ? ep / s : 0,
        skipRate: tracks ? skips / tracks : 0,
        shuffleShare: tracks ? shuffled / tracks : 0,
        skipShuffle: shuffled ? skipsShuffled / shuffled : 0,
        skipNoShuffle: tracks - shuffled ? (skips - skipsShuffled) / (tracks - shuffled) : 0,
        device: tp ? { name: PLATFORM[D.platforms[tp[0]]] ?? D.platforms[tp[0]], share: tp[1] / s } : null,
        record: rd ? { day: rd[0], h: rd[1] / 3600 } : null,
      };
    });
  }

  function topBy(map, n) {
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  }

  /** Viajes: días fuera de México separados por ≤ 16 días. No se corta con la escucha desde MX:
      en los datos hay conexiones MX intercaladas a mitad de un viaje. */
  function tripGroups(idx) {
    const days = new Map();
    for (const i of idx) {
      const c = D.countries[R.c[i]];
      if (c === "MX") continue;
      const key = `${dayOf[i]}|${c}`;
      days.set(key, (days.get(key) ?? 0) + 1);
    }
    const list = [...days].map(([k, n]) => {
      const [d, c] = k.split("|");
      return { day: Number(d), country: c, n };
    });
    const groups = [];
    for (const { day, country } of [...list].sort((a, b) => a.day - b.day)) {
      const g = groups.at(-1);
      if (g && day - g.to <= 16) {
        g.to = day;
        g.countries.add(country);
      } else groups.push({ from: day, to: day, countries: new Set([country]) });
    }
    return { days: list, groups };
  }

  /** Etiquetas de perfil: describen, no califican. */
  function tags(p) {
    const t = [p.dayShare >= 0.8 ? "Escucha casi diario" : "Escucha por ratos"];
    if (p.eveningShare >= 0.35) t.push("De tarde-noche");
    else if (p.nightShare >= 0.1) t.push("Nocturno");
    else t.push("Todo el día");
    t.push(p.top10Share >= 0.25 ? "Fiel a sus artistas" : "Explorador");
    if (p.podShare >= 0.03) t.push("Oye podcasts");
    return t;
  }

  // ---------- render ----------
  function renderProfiles(P) {
    const el = document.getElementById("profiles");
    el.innerHTML = P.map((p) => {
      const kpi = (n, label) => `<div class="kpi"><div class="kpi-n">${n}</div><div class="kpi-l">${label}</div></div>`;
      const fact = (k, v) => (v ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : "");
      return `<article class="profile" style="--who:${colorOf(p.u)}">
        <header>
          <span class="avatar" aria-hidden="true">${esc(nameOf(p.u)[0])}</span>
          <div><h2>${esc(nameOf(p.u))}</h2>
          <ul class="tags">${tags(p).map((t) => `<li>${t}</li>`).join("")}</ul></div>
        </header>
        <div class="kpis">
          ${kpi(nf0.format(p.hours), "horas")}
          ${kpi(pct(p.dayShare), `de los días (${nf0.format(p.activeDays)})`)}
          ${kpi(nf0.format(p.medianMin), "min por día con escucha")}
        </div>
        <dl class="facts">
          ${fact("Artista nº 1", p.topArtist && `${esc(p.topArtist.name)} <span class="muted">${pct(p.topArtist.share, 1)} de su tiempo</span>`)}
          ${fact("Canción más repetida", p.topTrack && `${esc(p.topTrack.name)} <span class="muted">${esc(p.topTrack.artist)} · ${nf0.format(p.topTrack.n)} streams</span>`)}
          ${fact("Hora pico", `${p.peakH}:00 <span class="muted">fin de semana: ${pct(p.weekendShare)} del tiempo</span>`)}
          ${fact("Dispositivo", p.device && `${esc(p.device.name)} <span class="muted">${pct(p.device.share)} del tiempo</span>`)}
          ${fact("Día récord", p.record && `${hrs(p.record.h)} h <span class="muted">${fmtDay(p.record.day)}</span>`)}
        </dl>
      </article>`;
    }).join("");

    const dek = document.getElementById("dek");
    if (P.length === 2 && P[0].hours && P[1].hours) {
      const [a, b] = [...P].sort((x, y) => y.hours - x.hours);
      dek.innerHTML = `Dos integrantes, un mismo historial de Spotify. En este periodo ${who(a.u)} escuchó <b>${nf1.format(a.hours / b.hours)} veces</b> más horas que ${who(b.u)}. Cada capítulo responde una pregunta y todo cambia con los filtros.`;
    } else if (P.length) {
      dek.innerHTML = `${who(P[0].u)} escuchó ${nf0.format(P[0].hours)} horas en este periodo. Cada capítulo responde una pregunta y todo cambia con los filtros.`;
    }
  }

  // Métricas del cara a cara: cada fila tiene su propia escala (no se comparan horas con %)
  const VERSUS = [
    { key: "hours", label: "Horas escuchadas", fmt: (v) => nf0.format(v) },
    { key: "dayShare", label: "Días con escucha", fmt: (v) => pct(v) },
    { key: "medianMin", label: "Minutos por día con escucha", fmt: (v) => nf0.format(v) },
    { key: "artists", label: "Artistas distintos", fmt: (v) => nf0.format(v) },
    { key: "top10Share", label: "Tiempo en sus 10 artistas principales", fmt: (v) => pct(v) },
    { key: "skipRate", label: "Canciones saltadas", fmt: (v) => pct(v) },
    { key: "shuffleShare", label: "Reproducciones en shuffle", fmt: (v) => pct(v) },
    { key: "eveningShare", label: "Escucha de 17 a 21 h", fmt: (v) => pct(v) },
    { key: "weekendShare", label: "Escucha en fin de semana", fmt: (v) => pct(v) },
    { key: "podShare", label: "Tiempo en podcasts", fmt: (v) => pct(v, 1) },
  ];

  function renderFaceOff(P) {
    const h = document.getElementById("h1-c0");
    const ctx = document.getElementById("ctx-c0");
    const vs = document.getElementById("ch-versus");
    const ins = document.getElementById("ch-insights");

    const rows = VERSUS.map((m) => {
      const max = Math.max(...P.map((p) => p[m.key])) || 1;
      const bars = P.map((p) => {
        const v = p[m.key];
        const lead = P.length > 1 && v === max && P.some((q) => q[m.key] < v);
        return `<div class="vs-bar" title="${esc(nameOf(p.u))}: ${m.fmt(v)}">
          <span class="vs-track"><span class="vs-fill" style="width:${(100 * v) / max}%;background:${colorOf(p.u)}"></span></span>
          <span class="vs-val${lead ? " lead" : ""}">${m.fmt(v)}</span></div>`;
      }).join("");
      return `<div class="vs-row"><div class="vs-label">${m.label}</div><div class="vs-bars">${bars}</div></div>`;
    }).join("");
    const legend = P.map((p) => `<span><span class="dot" style="background:${colorOf(p.u)}"></span> ${esc(nameOf(p.u))}</span>`).join("");
    chart(vs, {
      title: P.length > 1 ? "Comparativa en 10 medidas" : `${esc(nameOf(P[0]?.u ?? ""))} en 10 medidas`,
      note: "Cada fila tiene su propia escala: la barra más larga es el valor más alto de esa medida. En negritas, quién va arriba.",
      html: `<div class="vs-legend">${legend}</div><div class="versus">${rows}</div>`,
      table: {
        columns: [{ key: "label", label: "Medida" }].concat(P.map((p) => ({ key: p.u, label: esc(nameOf(p.u)), num: true }))),
        rows: VERSUS.map((m) => Object.fromEntries([["label", m.label], ...P.map((p) => [p.u, m.fmt(p[m.key])])])),
      },
    });

    // Insights: frases armadas con los números del filtro actual, cada una con la decisión que
    // apoyaría (mirada de producto: a quién reactivar, cuándo y por qué canal llegarle)
    const list = [];
    const skipWhy = (p) =>
      p.skipNoShuffle > p.skipShuffle + 0.05
        ? `${who(p.u)} salta más cuando elige qué escuchar (${pct(p.skipNoShuffle)} sin shuffle contra ${pct(p.skipShuffle)} con shuffle): las recomendaciones le aciertan más que su propia búsqueda.`
        : `Sus skips no cambian con el modo de reproducción: conviene mirar qué canciones abandona (capítulo 03).`;
    if (P.length === 2) {
      const [a, b] = P;
      const by = (k) => (a[k] >= b[k] ? [a, b] : [b, a]);
      const [hi, lo] = by("hours");
      const [eve] = by("eveningShare");
      const [loyal, other] = by("top10Share");
      const [sk, nsk] = by("skipRate");
      const times = nf1.format(hi.hours / (lo.hours || 1));
      list.push([
        `${who(hi.u)} escuchó <b>${times}×</b> más horas que ${who(lo.u)} y escucha el <b>${pct(hi.dayShare)}</b> de los días, contra el ${pct(lo.dayShare)}.`,
        lo.dayShare < 0.6
          ? `${who(lo.u)} no abre la app 1 de cada 2 días: es el perfil a reactivar. ${who(hi.u)} ya es usuario diario.`
          : "Los dos son usuarios frecuentes: la diferencia está en la intensidad, no en la frecuencia.",
      ]);
      list.push([
        `Horas pico distintas: ${who(a.u)} a las <b>${a.peakH} h</b> y ${who(b.u)} a las <b>${b.peakH} h</b>. ${who(eve.u)} concentra el ${pct(eve.eveningShare)} de su tiempo entre las 17 y las 21 h.`,
        `Un aviso o lanzamiento le llega mejor a cada uno cerca de su hora pico; mandarlo a los dos a la misma hora desperdicia uno.`,
      ]);
      list.push([
        `${who(loyal.u)} es más fiel: sus 10 artistas principales son el <b>${pct(loyal.top10Share)}</b> de su tiempo, contra el ${pct(other.top10Share)} de ${who(other.u)}, que conoce ${nf0.format(other.artists)} artistas.`,
        `A ${who(loyal.u)} le sirven las alertas de lanzamientos de sus artistas; a ${who(other.u)}, las playlists de descubrimiento.`,
      ]);
      list.push([`${who(sk.u)} salta más: <b>${pct(sk.skipRate)}</b> de sus canciones, contra el ${pct(nsk.skipRate)} de ${who(nsk.u)}.`, skipWhy(sk)]);
      const shared = [...a.artistTime.keys()].filter((k) => b.artistTime.has(k));
      const sh = (p) => shared.reduce((x, k) => x + p.artistTime.get(k), 0) / (p.musicS || 1);
      list.push([
        `Comparten <b>${nf0.format(shared.length)} artistas</b>, que ocupan el ${pct(sh(a))} del tiempo de ${who(a.u)} y el ${pct(sh(b))} del de ${who(b.u)}.`,
        "Hay base para una playlist conjunta: empezar por los artistas del capítulo 04.",
      ]);
      if (a.device && b.device && a.device.name !== b.device.name) {
        const kind = (d) => (["Android", "iOS"].includes(d.name) ? "el teléfono" : "la computadora");
        list.push([
          `${who(a.u)} escucha sobre todo en <b>${esc(a.device.name)}</b> (${pct(a.device.share)}) y ${who(b.u)} en <b>${esc(b.device.name)}</b> (${pct(b.device.share)}).`,
          kind(a.device) !== kind(b.device)
            ? `El canal es distinto: a ${who(a.u)} se le llega en ${kind(a.device)} y a ${who(b.u)} en ${kind(b.device)}.`
            : "Usan dispositivos distintos del mismo tipo: el canal para llegarles es el mismo.",
        ]);
      }
      h.innerHTML =
        loyal.u === lo.u
          ? `${who(hi.u)} escucha ${times} veces más; ${who(lo.u)} vuelve más a sus artistas`
          : `${who(hi.u)} escucha ${times} veces más que ${who(lo.u)} y además es más fiel a sus artistas`;
      ctx.textContent = `Las medidas en % son sobre el tiempo propio de cada uno, para que el volumen no decida la comparación. Datos hasta el ${active().map((u) => `${fmtDay(lastDay[u])} (${nameOf(u)})`).join(" y el ")}.`;
    } else if (P.length) {
      const p = P[0];
      list.push([
        `Escucha el <b>${pct(p.dayShare)}</b> de los días, con una mediana de ${nf0.format(p.medianMin)} minutos por día con escucha.`,
        p.dayShare < 0.6 ? "Uso intermitente: es un perfil a reactivar." : "Uso diario: la prioridad es retenerlo, no reactivarlo.",
      ]);
      list.push([`Su hora pico es a las <b>${p.peakH} h</b>; el fin de semana es el ${pct(p.weekendShare)} de su tiempo.`, `La mejor hora para llegarle es alrededor de las ${p.peakH} h.`]);
      if (p.topArtist) {
        list.push([
          `Su artista nº 1 es <b>${esc(p.topArtist.name)}</b> (${pct(p.topArtist.share, 1)}) y sus 10 principales suman el ${pct(p.top10Share)}.`,
          p.top10Share >= 0.25 ? "Responde a sus artistas de siempre: alertas de lanzamientos." : "Rota mucho entre artistas: le sirve el descubrimiento.",
        ]);
      }
      list.push([`Salta el <b>${pct(p.skipRate)}</b> de las canciones y usa shuffle en el ${pct(p.shuffleShare)}.`, skipWhy(p)]);
      h.innerHTML = `El perfil de ${who(p.u)} en este periodo`;
      ctx.textContent = `Elige «Ambos» para ver la comparación. Datos hasta el ${fmtDay(lastDay[p.u])}.`;
    }
    chart(ins, {
      title: "Insights del periodo",
      note: "Se recalculan con cada filtro. Debajo de cada uno, la decisión que apoyaría.",
      html: `<ol class="insights">${list.map(([t, so]) => `<li><p>${t}</p><p class="so"><b>Para decidir:</b> ${so}</p></li>`).join("")}</ol>`,
    });
  }

  function renderRhythm(sel) {
    const heat = {};
    const peaks = [];
    for (const u of active()) {
      const grid = Array.from({ length: 7 }, () => new Float64Array(24));
      let tot = 0;
      for (const i of sel[u]) {
        grid[dowOf[i]][hourOf[i]] += R.s[i];
        tot += R.s[i];
      }
      const cells = [];
      const byHour = new Float64Array(24);
      for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
        cells.push({ dow: d, h, share: tot ? grid[d][h] / tot : 0 });
        byHour[h] += tot ? grid[d][h] / tot : 0;
      }
      const peakH = byHour.indexOf(Math.max(...byHour));
      const byDow = grid.map((row) => row.reduce((a, b) => a + b, 0) / (tot || 1));
      const weekend = byDow[5] + byDow[6];
      heat[u] = cells;
      peaks.push({ u, peakH, weekend, night: byHour.slice(0, 6).reduce((a, b) => a + b, 0), topDow: byDow.indexOf(Math.max(...byDow)) });
    }

    // titular
    const h = document.getElementById("h1-c1");
    const phr = (p) => `a las ${p.peakH} h`;
    if (peaks.length === 2) {
      h.innerHTML = `${who(peaks[0].u)} escucha más ${phr(peaks[0])}; ${who(peaks[1].u)}, ${phr(peaks[1])}`;
    } else if (peaks.length) {
      h.innerHTML = `${who(peaks[0].u)} escucha más ${phr(peaks[0])}, sobre todo los ${DOW_LONG[peaks[0].topDow]}`;
    }
    document.getElementById("ctx-c1").textContent = peaks
      .map((p) => `${nameOf(p.u)}: fin de semana ${pct(p.weekend)} del tiempo (7 días: 29% si fuera parejo); madrugada (0–6 h) ${pct(p.night, 1)}.`)
      .join(" ");

    for (const [u, el] of perUser(document.getElementById("g-heat"), userSpan())) {
      const cells = heat[u];
      const max = Math.max(...cells.map((c) => c.share)) || 1;
      const plot = Plot.plot(base({
        width: widthOf(el),
        height: 230,
        marginLeft: 36,
        marginBottom: 32,
        x: { label: "hora local →", ticks: [0, 3, 6, 9, 12, 15, 18, 21], tickSize: 0, labelAnchor: "right" },
        y: { label: null, tickFormat: (d) => DOW[d], tickSize: 0 },
        color: { type: "linear", domain: [0, max], range: [cssVar("--cell-0"), colorOf(u)] },
        marks: [
          Plot.cell(cells, {
            x: "h", y: "dow", fill: "share", inset: 0.5, tip: true,
            title: (d) => `${DOW_LONG[d.dow]} ${d.h}:00–${d.h}:59\n${pct(d.share, 1)} del tiempo de ${nameOf(u)}`,
          }),
        ],
      }));
      const top = [...cells].sort((a, b) => b.share - a.share).slice(0, 10);
      chart(el, {
        title: `${esc(nameOf(u))}: hora × día de la semana`,
        note: `% de su propio tiempo; más intenso = más escucha. Celda más fuerte: ${DOW_LONG[top[0]?.dow ?? 0]} a las ${top[0]?.h ?? 0} h.`,
        plot,
        table: {
          columns: [
            { key: "dow", label: "Día", fmt: (v) => DOW_LONG[v] },
            { key: "h", label: "Hora", num: true, fmt: (v) => `${v}:00` },
            { key: "share", label: "% del tiempo", num: true, fmt: (v) => pct(v, 1) },
          ],
          rows: top,
        },
      });
    }

    // horas por mes (meses sin escucha = 0 para no esconder huecos)
    const monthly = [];
    const selAll = select({ streamsOnly: false });
    const spans = [];
    for (const u of active()) {
      // viajes de una semana o más, como contexto de los picos y caídas
      for (const g of tripGroups(selAll[u]).groups) {
        if (g.to - g.from < 6) continue;
        const cs = [...g.countries];
        spans.push({
          u, x1: dateOfDay(g.from), x2: dateOfDay(g.to + 1),
          label: `${nameOf(u)} fuera de MX`,
          title: `${nameOf(u)}: ${cs.join(", ")}\n${fmtDay(g.from)} a ${fmtDay(g.to)}`,
        });
      }
    }
    for (const u of active()) {
      const map = new Map();
      let lo = Infinity;
      let hi = -Infinity;
      for (const i of sel[u]) {
        const dt = dateOfDay(dayOf[i]);
        const k = dt.getUTCFullYear() * 12 + dt.getUTCMonth();
        map.set(k, (map.get(k) ?? 0) + R.s[i]);
        lo = Math.min(lo, k);
        hi = Math.max(hi, k);
      }
      // el mes del último dato está incompleto: se dibuja punteado para no leerlo como caída
      const ld = dateOfDay(lastDay[u]);
      const lastK = ld.getUTCFullYear() * 12 + ld.getUTCMonth();
      const monthDone = dateOfDay(lastDay[u] + 1).getUTCMonth() !== ld.getUTCMonth();
      for (let k = lo; k <= hi; k++) {
        monthly.push({ u, date: new Date(Date.UTC(Math.floor(k / 12), k % 12, 1)), h: (map.get(k) ?? 0) / 3600, partial: k === lastK && !monthDone });
      }
    }
    const full = monthly.filter((d) => !d.partial);
    const tail = monthly.flatMap((d, i) => (d.partial && monthly[i - 1]?.u === d.u ? [{ ...monthly[i - 1], seg: d.u }, { ...d, seg: d.u }] : []));
    const partialNote = active()
      .filter((u) => monthly.some((d) => d.u === u && d.partial))
      .map((u) => `${nameOf(u)}, ${fmtDay(lastDay[u])}`);
    const el = document.getElementById("ch-monthly");
    const users = active();
    const plot = Plot.plot(base({
      width: widthOf(el),
      height: 300,
      marginTop: 28,
      marginRight: 48,
      x: { type: "utc", label: null, tickSize: 0, tickFormat: tickMonth },
      y: { grid: true, label: "horas por mes", tickSize: 0, nice: true },
      color: { domain: users, range: users.map(colorOf) },
      marks: [
        Plot.rect(spans, { x1: "x1", x2: "x2", fill: (d) => colorOf(d.u), fillOpacity: 0.12, title: "title" }),
        Plot.text(spans, { x: (d) => new Date((+d.x1 + +d.x2) / 2), frameAnchor: "top", dy: -2, text: "label", fill: cssVar("--ink-2"), fontSize: 11, lineAnchor: "bottom" }),
        Plot.ruleY([0], { stroke: cssVar("--ink-3") }),
        Plot.ruleX(monthly, Plot.pointerX({ x: "date", stroke: cssVar("--ink-3"), strokeOpacity: 0.5 })),
        Plot.line(full, { x: "date", y: "h", z: "u", stroke: "u", strokeWidth: 2 }),
        Plot.line(tail, { x: "date", y: "h", z: "seg", stroke: "u", strokeWidth: 2, strokeDasharray: "2,4" }),
        Plot.text(monthly, Plot.selectLast({ x: "date", y: "h", z: "u", text: (d) => nameOf(d.u), fill: "u", dx: 6, textAnchor: "start", fontWeight: 600 })),
        Plot.tip(monthly, Plot.pointerX({ x: "date", y: "h", z: "u", title: (d) => `${nameOf(d.u)} · ${fmtMonth(d.date)}${d.partial ? " (incompleto)" : ""}\n${hrs(d.h)} h` })),
      ],
    }));
    const best = users.map((u) => full.filter((d) => d.u === u).sort((a, b) => b.h - a.h)[0]).filter(Boolean);
    chart(el, {
      title: "Horas por mes",
      note:
        best.map((b) => `Mes récord de ${esc(nameOf(b.u))}: ${fmtMonth(b.date)} (${hrs(b.h)} h).`).join(" ") +
        (spans.length ? " Las bandas son viajes de una semana o más." : "") +
        (partialNote.length ? ` Punteado: mes incompleto (datos hasta ${partialNote.map(esc).join("; ")}).` : ""),
      plot,
      table: {
        columns: [
          { key: "date", label: "Mes", fmt: (v) => fmtMonth(v) },
          { key: "u", label: "Persona", fmt: (v) => esc(nameOf(v)) },
          { key: "h", label: "Horas", num: true, fmt: (v) => hrs(v) },
        ],
        rows: monthly,
      },
    });
  }

  function renderDense(sel) {
    const tops = {};
    const records = [];
    for (const u of active()) {
      const byArtist = new Map();
      const byTrack = new Map();
      const byDay = new Map();
      let tot = 0;
      for (const i of sel[u]) {
        byDay.set(dayOf[i], (byDay.get(dayOf[i]) ?? 0) + R.s[i]);
        if (R.f[i] & BIT.episode) continue;
        tot += R.s[i];
        if (R.a[i] >= 0) byArtist.set(R.a[i], (byArtist.get(R.a[i]) ?? 0) + R.s[i]);
        // "repetir" una canción = stream; los saltos de 2 s no cuentan
        if (R.k[i] >= 0 && R.f[i] & BIT.stream) byTrack.set(R.k[i], (byTrack.get(R.k[i]) ?? 0) + 1);
      }
      tops[u] = {
        artists: topBy(byArtist, 10).map(([a, s]) => ({ name: D.artists[a], h: s / 3600, share: tot ? s / tot : 0 })),
        tracks: topBy(byTrack, 8).map(([k, n], r) => ({ r: r + 1, name: D.tracks[k][0], artist: D.artists[D.tracks[k][1]] ?? "", n })),
      };
      const [rd] = topBy(byDay, 1);
      if (rd) records.push({ u, day: rd[0], h: rd[1] / 3600 });
    }

    const h = document.getElementById("h1-c2");
    const lead = active().filter((u) => tops[u].artists.length).map((u) => ({ u, ...tops[u].artists[0] }));
    if (lead.length === 2) {
      h.innerHTML = `El artista de ${who(lead[0].u)} es ${esc(lead[0].name)} (${pct(lead[0].share)} de su tiempo); el de ${who(lead[1].u)}, ${esc(lead[1].name)} (${pct(lead[1].share)})`;
    } else if (lead.length) {
      h.innerHTML = `El artista de ${who(lead[0].u)} es ${esc(lead[0].name)}: ${pct(lead[0].share)} de su tiempo`;
    }
    document.getElementById("ctx-c2").textContent =
      records.map((r) => `Día récord de ${nameOf(r.u)}: ${hrs(r.h)} h el ${fmtDay(r.day)}.`).join(" ") +
      " Haz clic en una barra para abrir la ficha del artista.";

    for (const [u, el] of perUser(document.getElementById("g-artists"), userSpan())) {
      const data = tops[u].artists;
      const plot = Plot.plot(base({
        width: widthOf(el),
        height: data.length * 28 + 36,
        marginLeft: 150,
        marginRight: 44,
        x: { grid: true, label: "horas →", tickSize: 0, labelAnchor: "right" },
        y: { label: null, domain: data.map((d) => d.name), tickFormat: (d) => trunc(d), tickSize: 0 },
        marks: [
          Plot.barX(data, {
            x: "h", y: "name", fill: colorOf(u), insetTop: 3, insetBottom: 3,
            stroke: (d) => (d.name === state.artist ? cssVar("--ink") : "none"), strokeWidth: 2,
            tip: true, title: (d) => `${d.name}\n${hrs(d.h)} h · ${pct(d.share, 1)} del tiempo de ${nameOf(u)}`,
          }),
          Plot.text(data, { x: "h", y: "name", text: (d) => pct(d.share, 1), dx: 4, textAnchor: "start", fill: cssVar("--ink-2") }),
          Plot.ruleX([0], { stroke: cssVar("--ink-3") }),
        ],
      }));
      plot.addEventListener("click", () => {
        if (plot.value) setArtist(plot.value.name);
      });
      chart(el, {
        title: `Top 10 artistas de ${esc(nameOf(u))}`,
        note: "Horas escuchadas; la etiqueta es el % de su tiempo en canciones.",
        plot,
        clickable: true,
        table: {
          columns: [
            { key: "name", label: "Artista" },
            { key: "h", label: "Horas", num: true, fmt: (v) => hrs(v) },
            { key: "share", label: "% del tiempo", num: true, fmt: (v) => pct(v, 1) },
          ],
          rows: data,
        },
      });
    }

    for (const [u, el] of perUser(document.getElementById("g-tracks"), userSpan())) {
      chart(el, {
        title: `Canciones más repetidas de ${esc(nameOf(u))}`,
        note: "Número de streams (reproducciones de 30 s o más).",
        html: tableHTML(
          [
            { key: "r", label: "#", num: true },
            { key: "name", label: "Canción" },
            { key: "artist", label: "Artista", fmt: (v) => `<span class="muted">${esc(v)}</span>` },
            { key: "n", label: "Streams", num: true, fmt: (v) => nf0.format(v) },
          ],
          tops[u].tracks
        ),
      });
    }

    renderEras(sel);
    renderArtist(sel);
  }

  function renderEras(sel) {
    const q = (i) => {
      const dt = dateOfDay(dayOf[i]);
      return dt.getUTCFullYear() * 4 + Math.floor(dt.getUTCMonth() / 3);
    };
    const byQ = {};
    const allQ = new Set();
    for (const u of active()) {
      const m = new Map();
      for (const i of sel[u]) {
        if (R.f[i] & BIT.episode || R.a[i] < 0) continue;
        const k = q(i);
        allQ.add(k);
        let inner = m.get(k);
        if (!inner) m.set(k, (inner = new Map()));
        inner.set(R.a[i], (inner.get(R.a[i]) ?? 0) + R.s[i]);
      }
      byQ[u] = m;
    }
    const quarters = [...allQ].sort((a, b) => b - a).slice(0, 12);
    const rows = quarters.map((k) => {
      const row = { q: `T${(k % 4) + 1} ${Math.floor(k / 4)}` };
      for (const u of active()) {
        const inner = byQ[u].get(k);
        if (!inner) continue;
        const [[a, s]] = topBy(inner, 1);
        const tot = [...inner.values()].reduce((x, y) => x + y, 0);
        row[u] = { name: D.artists[a], share: s / tot };
      }
      return row;
    });
    const cols = [{ key: "q", label: "Trimestre" }].concat(
      active().map((u) => ({
        key: u,
        label: `<span class="dot" style="background:${colorOf(u)}"></span> ${esc(nameOf(u))}`,
        fmt: (v) => (v ? `${esc(v.name)} <span class="muted">${pct(v.share)}</span>` : '<span class="muted">—</span>'),
      }))
    );
    chart(document.getElementById("ch-eras"), {
      title: "Eras: el artista que dominó cada trimestre",
      note: "Artista con más horas en el trimestre y su % del tiempo de ese trimestre. Más reciente arriba.",
      html: tableHTML(cols, rows),
    });
  }

  function renderArtist(sel) {
    const el = document.getElementById("ch-artist");
    const input = document.getElementById("f-artist");
    input.value = state.artist;
    const a = D.artists.indexOf(state.artist);
    if (!state.artist || a < 0) {
      el.replaceChildren();
      return;
    }
    const monthly = [];
    const info = [];
    for (const u of active()) {
      const map = new Map();
      const songs = new Map();
      let first = null;
      let s = 0;
      for (const i of sel[u]) {
        if (R.a[i] !== a) continue;
        const dt = dateOfDay(dayOf[i]);
        const k = dt.getUTCFullYear() * 12 + dt.getUTCMonth();
        map.set(k, (map.get(k) ?? 0) + R.s[i]);
        if (R.k[i] >= 0) songs.set(R.k[i], (songs.get(R.k[i]) ?? 0) + 1);
        first ??= dayOf[i];
        s += R.s[i];
      }
      info.push({ u, h: s / 3600, first, songs: topBy(songs, 3).map(([k]) => D.tracks[k][0]) });
      for (const [k, v] of map) monthly.push({ u, date: new Date(Date.UTC(Math.floor(k / 12), k % 12, 1)), h: v / 3600 });
    }
    // meses en 0 dentro del rango del artista para que las líneas no salten
    const ks = monthly.map((d) => d.date.getUTCFullYear() * 12 + d.date.getUTCMonth());
    const filled = [];
    if (ks.length) {
      const lo = Math.min(...ks);
      const hi = Math.max(...ks);
      for (const u of active()) {
        const have = new Map(monthly.filter((d) => d.u === u).map((d) => [d.date.getUTCFullYear() * 12 + d.date.getUTCMonth(), d.h]));
        for (let k = lo; k <= hi; k++) filled.push({ u, date: new Date(Date.UTC(Math.floor(k / 12), k % 12, 1)), h: have.get(k) ?? 0 });
      }
    }
    const users = active();
    const note = info
      .map((i) => (i.h ? `${who(i.u)}: ${hrs(i.h)} h desde ${fmtDay(i.first)} · ${i.songs.map(esc).join(", ")}` : `${who(i.u)}: no lo escuchó en este periodo`))
      .join("<br>");
    const plot = filled.length
      ? Plot.plot(base({
          width: widthOf(el),
          height: 200,
          marginRight: 48,
          x: { type: "utc", label: null, tickSize: 0, tickFormat: tickMonth },
          y: { grid: true, label: "horas por mes", tickSize: 0 },
          color: { domain: users, range: users.map(colorOf) },
          marks: [
            Plot.ruleY([0], { stroke: cssVar("--ink-3") }),
            Plot.line(filled, { x: "date", y: "h", z: "u", stroke: "u", strokeWidth: 2 }),
            Plot.tip(filled, Plot.pointerX({ x: "date", y: "h", z: "u", title: (d) => `${nameOf(d.u)} · ${fmtMonth(d.date)}\n${hrs(d.h)} h` })),
          ],
        }))
      : null;
    chart(el, {
      title: `Ficha: ${esc(state.artist)}`,
      note,
      plot,
      table: filled.length
        ? { columns: [{ key: "date", label: "Mes", fmt: fmtMonth }, { key: "u", label: "Persona", fmt: (v) => esc(nameOf(v)) }, { key: "h", label: "Horas", num: true, fmt: hrs }], rows: filled.filter((d) => d.h > 0) }
        : null,
    });
  }

  function renderSkips() {
    // Los skips usan todas las reproducciones de canciones: con el filtro de streams no habría skips que contar.
    const sel = select({ streamsOnly: false, tracksOnly: true });
    const byHour = [];
    const byMode = [];
    const blocks = [];
    const worst = {};
    const BLOCKS = [["madrugada", 0, 6], ["mañana", 6, 12], ["tarde", 12, 18], ["noche", 18, 24]];
    const MIN_HOUR = 50;
    for (const u of active()) {
      const n = new Float64Array(24);
      const k = new Float64Array(24);
      const mode = { true: [0, 0], false: [0, 0] };
      const tracks = new Map();
      for (const i of sel[u]) {
        const sk = R.f[i] & BIT.skip ? 1 : 0;
        n[hourOf[i]]++;
        k[hourOf[i]] += sk;
        const sh = Boolean(R.f[i] & BIT.shuffle);
        mode[sh][0]++;
        mode[sh][1] += sk;
        if (R.k[i] >= 0) {
          const t = tracks.get(R.k[i]) ?? [0, 0];
          t[0]++;
          t[1] += sk;
          tracks.set(R.k[i], t);
        }
      }
      // horas con pocas reproducciones quedan como hueco: con n chico el % salta sin significado
      for (let h = 0; h < 24; h++) byHour.push({ u, h, rate: n[h] >= MIN_HOUR ? k[h] / n[h] : NaN, n: n[h] });
      for (const sh of [true, false]) {
        if (mode[sh][0] >= 50) byMode.push({ u, mode: sh ? "con shuffle" : "sin shuffle", rate: mode[sh][1] / mode[sh][0], n: mode[sh][0] });
      }
      const b = BLOCKS.map(([label, lo, hi]) => {
        let nn = 0;
        let kk = 0;
        for (let h = lo; h < hi; h++) {
          nn += n[h];
          kk += k[h];
        }
        return { label, rate: nn ? kk / nn : 0, n: nn };
      }).filter((x) => x.n >= 200);
      blocks.push({ u, b });
      worst[u] = [...tracks.entries()]
        .filter(([, t]) => t[0] >= 15)
        .map(([k, t]) => ({ name: D.tracks[k][0], artist: D.artists[D.tracks[k][1]] ?? "", n: t[0], rate: t[1] / t[0] }))
        .sort((x, y) => y.rate - x.rate || y.n - x.n)
        .slice(0, 6);
    }

    const h = document.getElementById("h1-c3");
    const phrase = ({ u, b }) => {
      if (!b.length) return `${who(u)}: sin datos suficientes`;
      const hi = b.reduce((x, y) => (y.rate > x.rate ? y : x));
      const lo = b.reduce((x, y) => (y.rate < x.rate ? y : x));
      return hi.rate - lo.rate >= 0.05
        ? `${who(u)} salta el ${pct(hi.rate)} de las canciones en la ${hi.label} y el ${pct(lo.rate)} en la ${lo.label}`
        : `${who(u)} salta alrededor del ${pct((hi.rate + lo.rate) / 2)} a cualquier hora`;
    };
    h.innerHTML = blocks.map(phrase).join("; ");
    document.getElementById("ctx-c3").textContent =
      "Un skip es cuando Spotify marca la canción como saltada. Aquí se cuentan todas las reproducciones de canciones, sin importar el filtro de streams.";

    const users = active();
    let el = document.getElementById("ch-skip-hour");
    chart(el, {
      title: "% de canciones saltadas por hora del día",
      note: "Solo horas con al menos 50 reproducciones; las demás quedan como hueco en la línea.",
      plot: Plot.plot(base({
        width: widthOf(el),
        height: 270,
        marginTop: 28,
        marginRight: 56,
        x: { label: "hora local →", ticks: [0, 3, 6, 9, 12, 15, 18, 21], tickSize: 0, labelAnchor: "right", domain: [0, 23] },
        y: { grid: true, label: "% saltadas", tickFormat: (v) => pct(v), tickSize: 0, domain: [0, Math.max(0.1, ...byHour.filter((d) => d.n >= MIN_HOUR).map((d) => d.rate)) * 1.1] },
        color: { domain: users, range: users.map(colorOf) },
        marks: [
          Plot.ruleY([0], { stroke: cssVar("--ink-3") }),
          Plot.line(byHour, { x: "h", y: "rate", z: "u", stroke: "u", strokeWidth: 2 }),
          Plot.text(byHour.filter((d) => d.n >= MIN_HOUR), Plot.selectLast({ x: "h", y: "rate", z: "u", text: (d) => nameOf(d.u), fill: "u", dx: 6, textAnchor: "start", fontWeight: 600 })),
          Plot.tip(byHour.filter((d) => d.n >= MIN_HOUR), Plot.pointerX({ x: "h", y: "rate", z: "u", title: (d) => `${nameOf(d.u)} · ${d.h}:00\n${pct(d.rate, 1)} saltadas de ${nf0.format(d.n)}` })),
        ],
      })),
      table: {
        columns: [
          { key: "u", label: "Persona", fmt: (v) => esc(nameOf(v)) },
          { key: "h", label: "Hora", num: true, fmt: (v) => `${v}:00` },
          { key: "rate", label: "% saltadas", num: true, fmt: (v) => pct(v, 1) },
          { key: "n", label: "Reproducciones", num: true, fmt: (v) => nf0.format(v) },
        ],
        rows: byHour.filter((d) => d.n >= MIN_HOUR),
      },
    });

    el = document.getElementById("ch-skip-shuffle");
    const label = (d) => `${nameOf(d.u)} · ${d.mode}`;
    chart(el, {
      title: "¿Shuffle o elegir?",
      note: "% de canciones saltadas según el modo de reproducción.",
      plot: Plot.plot(base({
        width: widthOf(el),
        height: byMode.length * 36 + 36,
        marginLeft: 150,
        marginRight: 48,
        x: { grid: true, label: null, tickFormat: (v) => pct(v), tickSize: 0 },
        y: { label: null, domain: byMode.map(label), tickSize: 0 },
        marks: [
          Plot.barX(byMode, { x: "rate", y: label, fill: (d) => colorOf(d.u), insetTop: 4, insetBottom: 4, tip: true, title: (d) => `${label(d)}\n${pct(d.rate, 1)} de ${nf0.format(d.n)}` }),
          Plot.text(byMode, { x: "rate", y: label, text: (d) => pct(d.rate), dx: 4, textAnchor: "start", fill: cssVar("--ink-2") }),
          Plot.ruleX([0], { stroke: cssVar("--ink-3") }),
        ],
      })),
      table: {
        columns: [
          { key: "u", label: "Persona", fmt: (v) => esc(nameOf(v)) },
          { key: "mode", label: "Modo" },
          { key: "rate", label: "% saltadas", num: true, fmt: (v) => pct(v, 1) },
          { key: "n", label: "Reproducciones", num: true, fmt: (v) => nf0.format(v) },
        ],
        rows: byMode,
      },
    });

    for (const [u, cell] of perUser(document.getElementById("g-skipped"), userSpan())) {
      chart(cell, {
        title: `Lo que ${esc(nameOf(u))} más salta`,
        note: "Canciones con al menos 15 reproducciones, ordenadas por % de skips.",
        html: worst[u].length
          ? tableHTML(
              [
                { key: "name", label: "Canción" },
                { key: "artist", label: "Artista", fmt: (v) => `<span class="muted">${esc(v)}</span>` },
                { key: "n", label: "Reprod.", num: true, fmt: (v) => nf0.format(v) },
                { key: "rate", label: "% saltada", num: true, fmt: (v) => pct(v) },
              ],
              worst[u]
            )
          : '<p class="empty">No hay canciones con 15 reproducciones o más en este periodo.</p>',
      });
    }
  }

  function renderShared(sel) {
    const h = document.getElementById("h1-c4");
    const ctx = document.getElementById("ctx-c4");
    const el = document.getElementById("ch-shared");
    const stats = document.getElementById("ch-shared-stats");
    if (active().length < 2) {
      h.textContent = "Elige «Ambos» para comparar el gusto de los dos";
      ctx.textContent = "";
      el.replaceChildren();
      stats.replaceChildren();
      return;
    }
    const [ua, ub] = USERS;
    const hours = {};
    const first = {};
    const firstAny = {};
    const tot = {};
    for (const u of [ua, ub]) {
      const m = new Map();
      const f = new Map();
      let t = 0;
      firstAny[u] = sel[u].length ? R.m[sel[u][0]] : Infinity;
      for (const i of sel[u]) {
        if (R.f[i] & BIT.episode || R.a[i] < 0) continue;
        m.set(R.a[i], (m.get(R.a[i]) ?? 0) + R.s[i]);
        t += R.s[i];
        if (R.f[i] & BIT.stream && !f.has(R.a[i])) f.set(R.a[i], R.m[i]);
      }
      hours[u] = m;
      first[u] = f;
      tot[u] = t;
    }
    const shared = [...hours[ua].keys()].filter((a) => hours[ub].has(a));
    const inShared = (u) => shared.reduce((s, a) => s + hours[u].get(a), 0) / (tot[u] || 1);
    // "quién llegó primero": solo artistas que ambos empezaron a escuchar ≥ 3 meses después del inicio común
    // de sus datos y con más de 30 días de diferencia (si no, gana quien tiene historial más largo)
    const startCommon = Math.max(firstAny[ua], firstAny[ub]);
    const sd = dateOfDay(Math.floor(startCommon / DAY));
    const threshold = minOf(new Date(Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth() + 3, 1)).toISOString().slice(0, 10));
    let firstA = 0;
    let firstB = 0;
    for (const a of shared) {
      const fa = first[ua].get(a);
      const fb = first[ub].get(a);
      if (fa == null || fb == null || fa < threshold || fb < threshold) continue;
      if (fa < fb - 30 * DAY) firstA++;
      else if (fb < fa - 30 * DAY) firstB++;
    }
    const lead = firstA >= firstB ? [ua, firstA] : [ub, firstB];
    h.innerHTML = `Compartimos ${nf0.format(shared.length)} artistas; ${who(lead[0])} llegó primero a ${nf0.format(lead[1])} de ${nf0.format(firstA + firstB)}`;
    ctx.textContent = `Para que la comparación sea justa, «llegó primero» solo cuenta artistas que los dos empezaron a escuchar a partir de ${fmtDay(Math.floor(threshold / DAY))}, con más de 30 días de diferencia.`;

    const top = shared
      .map((a) => ({ name: D.artists[a], [ua]: hours[ua].get(a) / 3600, [ub]: hours[ub].get(a) / 3600 }))
      .sort((x, y) => Math.min(y[ua], y[ub]) - Math.min(x[ua], x[ub]))
      .slice(0, 15);
    const long = top.flatMap((d) => [
      { name: d.name, u: ua, v: -d[ua], h: d[ua] },
      { name: d.name, u: ub, v: d[ub], h: d[ub] },
    ]);
    const maxH = Math.max(...long.map((d) => d.h), 1);
    const plot = Plot.plot(base({
      width: widthOf(el),
      height: top.length * 26 + 48,
      marginLeft: 150,
      x: { grid: true, label: `← horas de ${nameOf(ua)} · horas de ${nameOf(ub)} →`, labelAnchor: "center", tickFormat: (v) => nf0.format(Math.abs(v)), tickSize: 0, domain: [-maxH, maxH] },
      y: { label: null, domain: top.map((d) => d.name), tickFormat: (d) => trunc(d), tickSize: 0 },
      color: { domain: [ua, ub], range: [colorOf(ua), colorOf(ub)] },
      marks: [
        Plot.barX(long, { x: "v", y: "name", fill: "u", insetTop: 3, insetBottom: 3, tip: true, title: (d) => `${d.name}\n${nameOf(d.u)}: ${hrs(d.h)} h` }),
        Plot.ruleX([0], { stroke: cssVar("--ink") }),
      ],
    }));
    plot.addEventListener("click", () => {
      if (plot.value) setArtist(plot.value.name);
    });
    chart(el, {
      title: "Los 15 artistas compartidos que más pesan para los dos",
      note: `Ordenados por el mínimo de horas entre ambos. ${who(ua)} a la izquierda, ${who(ub)} a la derecha.`,
      plot,
      clickable: true,
      table: {
        columns: [
          { key: "name", label: "Artista" },
          { key: ua, label: `Horas ${esc(nameOf(ua))}`, num: true, fmt: hrs },
          { key: ub, label: `Horas ${esc(nameOf(ub))}`, num: true, fmt: hrs },
        ],
        rows: top,
      },
    });
    stats.innerHTML = `<div class="stats">
      <div class="stat"><div class="n">${nf0.format(shared.length)}</div><p>artistas que los dos escuchamos en este periodo</p></div>
      <div class="stat"><div class="n">${pct(inShared(ua))} · ${pct(inShared(ub))}</div><p>del tiempo de ${who(ua)} y de ${who(ub)} va a esos artistas</p></div>
      <div class="stat"><div class="n">${nf0.format(firstA)} · ${nf0.format(firstB)}</div><p>artistas a los que ${who(ua)} y ${who(ub)} llegaron primero</p></div>
    </div>`;
  }

  function renderContext(sel) {
    const selAll = select({ streamsOnly: false });
    const trips = [];
    const platform = [];
    const pods = {};
    const podShare = [];
    const tripText = [];
    for (const u of active()) {
      const pl = new Map();
      const shows = new Map();
      let tot = 0;
      let ep = 0;
      const { days, groups } = tripGroups(selAll[u]);
      for (const d of days) trips.push({ u, date: dateOfDay(d.day), country: d.country, n: d.n });
      for (const i of sel[u]) {
        tot += R.s[i];
        pl.set(R.p[i], (pl.get(R.p[i]) ?? 0) + R.s[i]);
        if (R.f[i] & BIT.episode) {
          ep += R.s[i];
          if (R.w[i] >= 0) shows.set(R.w[i], (shows.get(R.w[i]) ?? 0) + R.s[i]);
        }
      }
      if (groups.length) {
        const fmt = (g) => `${[...g.countries].join(", ")} (${g.from === g.to ? fmtDay(g.from) : `${fmtDay(g.from)} a ${fmtDay(g.to)}`})`;
        tripText.push(`${nameOf(u)}: ${groups.map(fmt).join("; ")}.`);
      }
      for (const [p, s] of pl) platform.push({ u, platform: PLATFORM[D.platforms[p]] ?? D.platforms[p], share: tot ? s / tot : 0 });
      pods[u] = topBy(shows, 5).map(([w, s]) => ({ show: D.shows[w].trim().replace(/^\u3164$/, "") || "(sin nombre)", h: s / 3600 })).filter((p) => p.h >= 0.05);
      podShare.push({ u, share: tot ? ep / tot : 0 });
    }

    const h = document.getElementById("h1-c5");
    const ps = [...podShare].sort((a, b) => b.share - a.share);
    h.innerHTML =
      ps.length === 2
        ? `${who(ps[0].u)} dedica el ${pct(ps[0].share, 1)} de su tiempo a podcasts; ${who(ps[1].u)}, el ${pct(ps[1].share, 1)}`
        : ps.length
          ? `${who(ps[0].u)} dedica el ${pct(ps[0].share, 1)} de su tiempo a podcasts`
          : "";
    document.getElementById("ctx-c5").textContent = tripText.length ? `Fuera de México. ${tripText.join(" ")}` : "Sin reproducciones fuera de México en este periodo.";

    const users = active();
    let el = document.getElementById("ch-trips");
    const countries = [...new Set(trips.map((d) => d.country))].sort();
    chart(el, {
      title: "Días con escucha fuera de México",
      note: "Cada punto es un día con al menos una reproducción desde ese país (según el país de conexión, sin IP).",
      plot: trips.length
        ? Plot.plot(base({
            width: widthOf(el),
            height: Math.max(90, countries.length * 28 + 40),
            marginLeft: 40,
            x: { type: "utc", label: null, tickSize: 0, tickFormat: tickMonth, grid: true },
            y: { label: null, domain: countries, tickSize: 0 },
            color: { domain: users, range: users.map(colorOf) },
            marks: [Plot.dot(trips, { x: "date", y: "country", fill: "u", r: 3.5, tip: true, title: (d) => `${nameOf(d.u)} · ${d.country}\n${fmtDay(Math.round(d.date / 864e5))} · ${d.n} reproducciones` })],
          }))
        : null,
      html: trips.length ? "" : '<p class="empty">Ninguna en este periodo.</p>',
    });

    el = document.getElementById("ch-platform");
    const plabel = (d) => `${nameOf(d.u)} · ${d.platform}`;
    const pdata = platform.filter((d) => d.share >= 0.005).sort((a, b) => a.u.localeCompare(b.u) || b.share - a.share);
    chart(el, {
      title: "¿En qué dispositivo?",
      note: "% del tiempo de cada persona por familia de plataforma.",
      plot: Plot.plot(base({
        width: widthOf(el),
        height: pdata.length * 30 + 36,
        marginLeft: 130,
        marginRight: 48,
        x: { grid: true, label: null, tickFormat: (v) => pct(v), tickSize: 0, domain: [0, 1] },
        y: { label: null, domain: pdata.map(plabel), tickSize: 0 },
        marks: [
          Plot.barX(pdata, { x: "share", y: plabel, fill: (d) => colorOf(d.u), insetTop: 4, insetBottom: 4, tip: true, title: (d) => `${plabel(d)}\n${pct(d.share, 1)}` }),
          Plot.text(pdata, { x: "share", y: plabel, text: (d) => pct(d.share), dx: 4, textAnchor: "start", fill: cssVar("--ink-2") }),
          Plot.ruleX([0], { stroke: cssVar("--ink-3") }),
        ],
      })),
    });

    el = document.getElementById("ch-podcasts");
    const rows = active().flatMap((u) => pods[u].map((p) => ({ u, ...p })));
    chart(el, {
      title: "Podcasts más escuchados",
      note: "Horas por programa.",
      html: rows.length
        ? tableHTML(
            [
              { key: "u", label: "Persona", fmt: (v) => who(v) },
              { key: "show", label: "Programa", fmt: (v) => esc(trunc(v || "(sin nombre)", 48)) },
              { key: "h", label: "Horas", num: true, fmt: hrs },
            ],
            rows
          )
        : '<p class="empty">Sin podcasts en este periodo.</p>',
    });
  }

  // ---------- controles ----------
  function buildControls() {
    const person = document.getElementById("f-person");
    const opts = [["both", "Ambos"], ...USERS.map((u) => [u, nameOf(u)])];
    person.innerHTML = opts
      .map(([v, label]) => {
        const dot = v === "both" ? USERS.map((u) => `<span class="dot" style="background:var(--${u}, var(--context))"></span>`).join("") : `<span class="dot" style="background:var(--${v}, var(--context))"></span>`;
        return `<button type="button" class="chip" data-v="${v}" aria-pressed="false">${dot}${esc(label)}</button>`;
      })
      .join("");
    person.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]");
      if (!b) return;
      state.person = b.dataset.v;
      update();
    });

    const sel = document.getElementById("f-period");
    sel.innerHTML = PERIODS.map((p) => `<option value="${p.id}">${esc(p.label)}</option>`).join("");
    sel.addEventListener("change", () => {
      state.period = sel.value;
      update();
    });

    const streams = document.getElementById("f-streams");
    streams.addEventListener("change", () => {
      state.streams = streams.checked;
      update();
    });

    // El hash guarda los filtros: el índice hace scroll sin tocarlo
    document.querySelector(".toc").addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#c']");
      if (!a) return;
      e.preventDefault();
      document.querySelector(a.getAttribute("href")).scrollIntoView();
    });

    const list = document.getElementById("artist-list");
    list.innerHTML = D.artists.slice(0, 600).map((a) => `<option value="${esc(a)}"></option>`).join("");
    const input = document.getElementById("f-artist");
    input.addEventListener("change", () => setArtist(input.value.trim()));
    document.getElementById("f-artist-clear").addEventListener("click", () => setArtist(""));

    const theme = document.getElementById("f-theme");
    const isDark = () => document.documentElement.dataset.theme === "dark";
    const syncTheme = () => {
      theme.textContent = isDark() ? "Modo claro" : "Modo oscuro";
      theme.setAttribute("aria-pressed", String(isDark()));
    };
    theme.addEventListener("click", () => {
      document.documentElement.dataset.theme = isDark() ? "light" : "dark";
      try {
        localStorage.setItem("theme", document.documentElement.dataset.theme);
      } catch {
        /* sin almacenamiento: el tema dura solo esta visita */
      }
      syncTheme();
      render();
    });
    // Oscuro por defecto (estilo Spotify); #th= en la URL o la elección guardada mandan
    if (!new URLSearchParams(location.hash.slice(1)).has("th")) {
      let saved = null;
      try {
        saved = localStorage.getItem("theme");
      } catch {
        /* sin almacenamiento */
      }
      document.documentElement.dataset.theme = saved === "light" ? "light" : "dark";
    }
    syncTheme();
  }

  function syncControls() {
    for (const b of document.querySelectorAll("#f-person button")) b.setAttribute("aria-pressed", String(b.dataset.v === state.person));
    document.getElementById("f-period").value = state.period;
    document.getElementById("f-streams").checked = state.streams;
    const who_ = state.person === "both" ? "Ambos" : nameOf(state.person);
    document.getElementById("print-filters").textContent = `Mostrando: ${who_} · ${period().label} · ${state.streams ? "solo streams ≥ 30 s" : "todas las reproducciones"}`;
  }

  function setArtist(name) {
    state.artist = D.artists.includes(name) ? name : "";
    writeHash();
    const sel = select();
    renderDense(sel);
    if (state.artist) document.getElementById("ch-artist").scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function render() {
    const sel = select();
    const selTracks = select({ streamsOnly: false, tracksOnly: true });
    const P = profiles(sel, selTracks);
    renderProfiles(P);
    renderFaceOff(P);
    renderRhythm(sel);
    renderDense(sel);
    renderSkips();
    renderShared(sel);
    renderContext(sel);
  }

  function update() {
    writeHash();
    syncControls();
    render();
  }

  readHash();
  buildControls();
  syncControls();
  render();
  document.getElementById("generated").textContent = `Datos generados el ${D.generated} · ${nf0.format(N)} reproducciones.`;

  let t = 0;
  let lastW = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    clearTimeout(t);
    t = setTimeout(render, 150);
  });
  addEventListener("hashchange", () => {
    if (!location.hash.includes("=")) return;
    readHash();
    syncControls();
    render();
  });
})();
