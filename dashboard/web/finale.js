// Final de la presentación: al llegar al fondo de la página, explosión pixelada (a propósito de baja
// calidad) y pantalla con los insights principales. No corre en capturas (#only=...) ni en navegador
// automatizado, para no ensuciar out/dashboard.pdf.
(() => {
  if (location.hash.includes("only=") || navigator.webdriver) return;

  const INSIGHTS = [
    ["Gabriel le dejó su gusto al algoritmo", "2025: el doble de horas, 88% en shuffle y un solo nº 1, Bad Bunny."],
    ["Gabriel no le da chance a lo nuevo", "Salta 41% de lo que oye por primera vez y 19% de lo que ya conoce."],
    ["Escuchamos igual, no igual de seguido", "Los dos: unos 30 min por sesión. Gabriel abre la app 4 veces más."],
    ["Javier escucha en la compu", "70% en Windows, pico a las 18 h. Lejos de su escritorio, cambió todo."],
    ["El incógnito no es secreto", "2,073 reproducciones en incógnito, la mitad de noche. Todas en el export."],
  ];

  const sentinel = document.createElement("div");
  sentinel.style.height = "1px";
  document.body.appendChild(sentinel);

  let armed = true;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && armed && scrollY > 400 && !document.getElementById("intro")) {
      armed = false;
      boom();
    }
  }).observe(sentinel);
  // Al volver a subir se rearma, para poder repetirlo en el ensayo
  addEventListener("scroll", () => {
    if (!armed && !document.getElementById("finale") && scrollY < document.body.scrollHeight - innerHeight * 2) armed = true;
  });

  function boom() {
    const SCALE = 6; // resolución reducida: cada píxel del canvas mide 6 px en pantalla
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(innerWidth / SCALE);
    cv.height = Math.ceil(innerHeight / SCALE);
    Object.assign(cv.style, {
      position: "fixed", inset: "0", width: "100vw", height: "100vh",
      imageRendering: "pixelated", zIndex: 9998, pointerEvents: "none",
    });
    document.body.appendChild(cv);
    const g = cv.getContext("2d");
    const cx = cv.width / 2, cy = cv.height / 2;
    const colors = ["#1ed760", "#ffffff", "#ffd400", "#ff7a00", "#ff2a00", "#179443"];
    const parts = Array.from({ length: 260 }, () => {
      const a = Math.random() * Math.PI * 2, v = 0.5 + Math.random() * 3.5;
      return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 1 + (Math.random() * 3) | 0, c: colors[(Math.random() * colors.length) | 0] };
    });
    let t = 0;
    const main = document.querySelector("main");
    (function frame() {
      t++;
      g.clearRect(0, 0, cv.width, cv.height);
      if (t < 6) { g.fillStyle = t % 2 ? "#fff" : "#1ed760"; g.fillRect(0, 0, cv.width, cv.height); }
      const r = t * 2.2; // onda expansiva
      g.fillStyle = `rgba(255,140,0,${Math.max(0, 0.6 - t / 40)})`;
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.vx *= 0.99;
        g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, p.s, p.s);
      }
      main.style.transform = t < 30 ? `translate(${(Math.random() - 0.5) * 16}px, ${(Math.random() - 0.5) * 16}px)` : "";
      if (t === 28) showInsights();
      if (t < 90) requestAnimationFrame(frame);
      else cv.remove();
    })();
  }

  function showInsights() {
    const ov = document.createElement("div");
    ov.id = "finale";
    Object.assign(ov.style, {
      position: "fixed", inset: "0", zIndex: 9997, background: "rgba(10,10,10,.96)", color: "#fff",
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      padding: "48px 32px", overflow: "auto", fontFamily: "inherit", opacity: 0, transition: "opacity .4s",
    });
    ov.innerHTML = `
      <div style="max-width:1100px;width:100%">
        <h2 style="font-size:clamp(40px,6vw,72px);margin:0 0 40px;line-height:1">Escuchamos y juzgamos</h2>
        <ol style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:28px">
          ${INSIGHTS.map(([h, p], i) => `
            <li style="border-top:2px solid #1ed760;padding-top:16px">
              <p style="font-size:40px;font-weight:700;color:#1ed760;margin:0 0 8px">0${i + 1}</p>
              <h3 style="font-size:20px;margin:0 0 12px;line-height:1.25">${h}</h3>
              <p style="font-size:16px;line-height:1.5;color:#cfcfcf;margin:0">${p}</p>
            </li>`).join("")}
        </ol>
        <div style="margin-top:40px;display:flex;gap:16px;flex-wrap:wrap">
          <button type="button" id="finale-thanks" style="background:#1ed760;color:#000;border:0;border-radius:999px;padding:12px 28px;font:inherit;font-weight:700;cursor:pointer">Gracias por su atención</button>
          <button type="button" id="finale-close" style="background:transparent;color:#fff;border:1px solid #fff;border-radius:999px;padding:12px 28px;font:inherit;font-weight:700;cursor:pointer">Volver</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => (ov.style.opacity = 1));
    const close = () => {
      if (document.getElementById("thanks")) return document.getElementById("thanks").remove();
      ov.remove();
      removeEventListener("keydown", esc);
    };
    const esc = (e) => e.key === "Escape" && close();
    addEventListener("keydown", esc);
    ov.querySelector("#finale-close").onclick = close;
    ov.querySelector("#finale-thanks").onclick = showThanks;
  }

  function showThanks() {
    if (!document.getElementById("thanks-css")) {
      const css = document.createElement("style");
      css.id = "thanks-css";
      css.textContent = `
        #thanks { position: fixed; inset: 0; z-index: 9999; background: #050505; color: #fff; overflow: hidden;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 36px;
          font-family: inherit; text-align: center; animation: thIn .4s ease-out; }
        #thanks::before { content: ""; position: absolute; width: 140vmax; height: 140vmax;
          background: radial-gradient(circle, rgba(30,215,96,.35) 0%, rgba(30,215,96,0) 45%); animation: thGlow 2.4s ease-in-out infinite; }
        #thanks .ring { position: relative; width: 280px; height: 280px; border-radius: 50%; padding: 8px;
          background: conic-gradient(#1ed760, #fff, #1ed760, #0b0b0b, #1ed760); animation: thSpin 3s linear infinite, thPop .7s cubic-bezier(.2,1.6,.4,1) both; }
        #thanks .ring img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;
          border: 6px solid #050505; animation: thSpin 3s linear infinite reverse; }
        #thanks h2 { position: relative; margin: 0; font-size: clamp(36px, 6vw, 80px); line-height: 1.05; letter-spacing: -.02em; }
        #thanks h2 span { display: inline-block; animation: thLetter .6s cubic-bezier(.2,1.6,.4,1) both, thWave 2s ease-in-out infinite; }
        #thanks p { position: relative; margin: 0; color: #bbb; font-size: 20px; animation: thLetter .6s both 1.2s; }
        #thanks p b:first-child { color: #1ed760; }
        #thanks i { position: absolute; top: -20px; width: 10px; height: 16px; animation: thFall linear infinite; }
        @keyframes thIn { from { opacity: 0; transform: scale(1.08) } to { opacity: 1; transform: none } }
        @keyframes thGlow { 0%,100% { transform: scale(.85); opacity: .7 } 50% { transform: scale(1.1); opacity: 1 } }
        @keyframes thSpin { to { transform: rotate(360deg) } }
        @keyframes thPop { from { scale: 0 } to { scale: 1 } }
        @keyframes thLetter { from { opacity: 0; transform: translateY(40px) rotate(-12deg) } to { opacity: 1; transform: none } }
        @keyframes thWave { 0%,100% { translate: 0 0 } 50% { translate: 0 -8px } }
        @keyframes thFall { to { transform: translateY(110vh) rotate(720deg) } }
      `;
      document.head.appendChild(css);
    }
    const title = [..."Gracias por su atención"]
      .map((c, i) => (c === " " ? " " : `<span style="animation-delay:${0.3 + i * 0.04}s, ${1.4 + i * 0.08}s">${c}</span>`))
      .join("");
    const confetti = Array.from({ length: 60 }, () => {
      const c = ["#1ed760", "#ffffff", "#179443"][(Math.random() * 3) | 0];
      return `<i style="left:${Math.random() * 100}vw;background:${c};animation-duration:${2.5 + Math.random() * 3}s;animation-delay:${-Math.random() * 5}s"></i>`;
    }).join("");
    const el = document.createElement("div");
    el.id = "thanks";
    el.innerHTML = `${confetti}
      <div class="ring"><img src="img/gracias.gif?${Date.now()}" alt=""></div>
      <h2>${title}</h2>
      <p><b>Gabriel</b> × <b>Javier</b></p>`;
    el.onclick = () => el.remove();
    document.body.appendChild(el);
  }
})();
