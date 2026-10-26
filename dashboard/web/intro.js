// Pantalla de entrada: ecualizador animado y botón «Entrar». Al entrar, explosión chica en el centro
// (gif al doble de velocidad, con su fondo blanco) y se desvanece hacia el dashboard. No corre en capturas.
(() => {
  if (location.hash.includes("only=") || navigator.webdriver) return;

  // Al recargar, el navegador regresa al scroll anterior y, si estaba hasta abajo, dispara el final.
  // Siempre se entra desde arriba.
  history.scrollRestoration = "manual";
  scrollTo(0, 0);

  const css = document.createElement("style");
  css.textContent = `
    #intro { position: fixed; inset: 0; z-index: 10000; background: #0b0b0b; color: #fff;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px;
      font-family: inherit; text-align: center; transition: opacity .3s; }
    #intro .eq { display: flex; gap: 6px; align-items: flex-end; height: 72px; }
    #intro .eq span { width: 10px; background: #1ed760; border-radius: 2px; animation: introEq 1s ease-in-out infinite; }
    @keyframes introEq { 0%,100% { height: 12% } 50% { height: 100% } }
    #intro h1 { font-size: clamp(40px, 7vw, 88px); margin: 0; line-height: 1; letter-spacing: -.02em;
      animation: introUp .8s cubic-bezier(.2,.8,.2,1) both .2s; }
    #intro .who { font-size: clamp(18px, 2.4vw, 26px); margin: 0; color: #bbb; animation: introUp .8s both .45s; }
    #intro .who b:first-child { color: #1ed760; } #intro .who b:last-child { color: #fff; }
    #intro .k { color: #1ed760; letter-spacing: .14em; text-transform: uppercase; font-size: 13px; margin: 0;
      animation: introUp .8s both; }
    #intro button { background: #1ed760; color: #000; border: 0; border-radius: 999px; padding: 16px 44px;
      font: inherit; font-size: 18px; font-weight: 700; cursor: pointer; animation: introUp .8s both .7s, introPulse 1.6s ease-in-out infinite 1.5s;
      transition: transform .15s; }
    #intro button:hover { transform: scale(1.06); }
    @keyframes introUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }
    @keyframes introPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(30,215,96,.6) } 50% { box-shadow: 0 0 0 18px rgba(30,215,96,0) } }
    #intro.boom { animation: introShake .25s linear; }
    #intro.boom > :not(.gif) { display: none; }
    #intro .gif { display: none; width: 160px; image-rendering: pixelated; }
    #intro.boom .gif { display: block; }
    @keyframes introShake { 0%,100% { transform: none } 20% { transform: translate(-14px, 8px) }
      40% { transform: translate(12px, -10px) } 60% { transform: translate(-8px, -6px) } 80% { transform: translate(6px, 10px) } }
  `;
  document.head.appendChild(css);

  const bars = Array.from({ length: 14 }, (_, i) => `<span style="animation-delay:${(i * 0.13) % 1}s;animation-duration:${0.7 + ((i * 37) % 6) / 10}s"></span>`).join("");
  const el = document.createElement("div");
  el.id = "intro";
  el.innerHTML = `
    <div class="eq">${bars}</div>
    <p class="k">Spotify · historial extendido · Big Data 2026</p>
    <h1>Cómo escuchamos</h1>
    <p class="who"><b>Gabriel</b> × <b>Javier</b> · 81 mil reproducciones</p>
    <button type="button">Entrar</button>
    <img class="gif" alt="">`;
  document.body.appendChild(el);
  document.documentElement.style.overflow = "hidden";

  el.querySelector("button").onclick = () => {
    scrollTo(0, 0);
    el.querySelector(".gif").src = `img/explosion.gif?${Date.now()}`; // reinicia el gif desde el primer cuadro
    el.classList.add("boom");
    setTimeout(() => (el.style.opacity = 0), 650);
    setTimeout(() => {
      el.remove();
      document.documentElement.style.overflow = "";
    }, 950);
  };
})();
