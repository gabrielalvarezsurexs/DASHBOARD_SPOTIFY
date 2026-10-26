// Muñequito con audífonos que sigue al mouse con retraso, camina cuando se mueve y voltea hacia
// donde va. Solo con mouse (no en táctil) y nunca en capturas.
(() => {
  if (location.hash.includes("only=") || navigator.webdriver || !matchMedia("(pointer: fine)").matches) return;

  const css = document.createElement("style");
  css.textContent = `
    #buddy { position: fixed; left: 0; top: 0; z-index: 10001; pointer-events: none; width: 44px; height: 56px;
      will-change: transform; }
    #buddy svg { width: 100%; height: 100%; overflow: visible; transition: transform .15s; }
    #buddy.left svg { transform: scaleX(-1); }
    #buddy .leg { transform-box: fill-box; transform-origin: top center; }
    #buddy.walk .leg.l { animation: bdLeg .3s ease-in-out infinite alternate; }
    #buddy.walk .leg.r { animation: bdLeg .3s ease-in-out infinite alternate-reverse; }
    #buddy.walk .body { animation: bdBob .3s ease-in-out infinite alternate; }
    #buddy:not(.walk) .body { animation: bdIdle 1.2s ease-in-out infinite alternate; }
    #buddy .note { opacity: 0; }
    #buddy:not(.walk) .note { animation: bdNote 1.6s ease-out infinite; }
    @keyframes bdLeg { from { transform: rotate(-28deg) } to { transform: rotate(28deg) } }
    @keyframes bdBob { from { transform: translateY(0) } to { transform: translateY(-3px) } }
    @keyframes bdIdle { from { transform: translateY(0) rotate(-4deg) } to { transform: translateY(-1px) rotate(4deg) } }
    @keyframes bdNote { 0% { opacity: 0; transform: translate(0, 0) } 30% { opacity: 1 } 100% { opacity: 0; transform: translate(10px, -18px) } }

    #buddy .arm, #buddy .zz, #buddy .shut { display: none; }
    #buddy .arm { transform-box: fill-box; }
    #buddy .arm.l { transform-origin: right bottom; } #buddy .arm.r { transform-origin: left bottom; }

    /* Dormido (pantalla de entrada): ojos cerrados, respira y le salen zetas */
    #buddy.sleep svg { scale: 1.6; rotate: -10deg; }
    #buddy.sleep .eye { display: none; }
    #buddy.sleep .shut, #buddy.sleep .zz { display: inline; }
    #buddy.sleep .body { animation: bdBreath 1.8s ease-in-out infinite alternate; }
    #buddy.sleep .note { animation: none; }
    #buddy.sleep .zz { animation: bdZ 2.4s ease-out infinite; }
    #buddy.sleep .zz.b { animation-delay: 1.2s; }
    @keyframes bdBreath { from { transform: scale(1) } to { transform: scale(1.04) translateY(-1px) } }
    @keyframes bdZ { 0% { opacity: 0; transform: translate(0, 0) scale(.6) } 25% { opacity: 1 } 100% { opacity: 0; transform: translate(14px, -22px) scale(1.3) } }

    /* Bailando (pantalla de gracias): brinca, se ladea, mueve brazos y piernas */
    #buddy.dance svg { scale: 1.6; animation: bdDance .35s ease-in-out infinite alternate; }
    #buddy.dance .arm { display: inline; }
    #buddy.dance .arm.l { animation: bdArmL .35s ease-in-out infinite alternate; }
    #buddy.dance .arm.r { animation: bdArmR .35s ease-in-out infinite alternate; }
    #buddy.dance .leg.l { animation: bdLeg .175s ease-in-out infinite alternate; }
    #buddy.dance .leg.r { animation: bdLeg .175s ease-in-out infinite alternate-reverse; }
    #buddy.dance .body { animation: none; }
    #buddy.dance .note { animation: bdNote .7s ease-out infinite; }
    @keyframes bdDance { from { rotate: -14deg; translate: 0 0 } to { rotate: 14deg; translate: 0 -10px } }
    @keyframes bdArmL { from { transform: rotate(-50deg) } to { transform: rotate(30deg) } }
    @keyframes bdArmR { from { transform: rotate(-30deg) } to { transform: rotate(50deg) } }
  `;
  document.head.appendChild(css);

  const el = document.createElement("div");
  el.id = "buddy";
  el.innerHTML = `
    <svg viewBox="0 0 44 56" aria-hidden="true">
      <text class="note" x="32" y="10" font-size="12" fill="#1ed760" font-weight="700">♪</text>
      <line class="leg l" x1="18" y1="40" x2="16" y2="53" stroke="#179443" stroke-width="3" stroke-linecap="round"/>
      <line class="leg r" x1="26" y1="40" x2="28" y2="53" stroke="#179443" stroke-width="3" stroke-linecap="round"/>
      <text class="zz" x="30" y="8" font-size="9" fill="#fff" font-weight="700">z</text>
      <text class="zz b" x="30" y="8" font-size="9" fill="#fff" font-weight="700">Z</text>
      <g class="body">
        <line class="arm l" x1="7" y1="22" x2="15" y2="30" stroke="#1ed760" stroke-width="3" stroke-linecap="round"/>
        <line class="arm r" x1="29" y1="30" x2="37" y2="22" stroke="#1ed760" stroke-width="3" stroke-linecap="round"/>
        <rect x="14" y="27" width="16" height="15" rx="5" fill="#1ed760"/>
        <circle cx="22" cy="16" r="10" fill="#fff" stroke="#111" stroke-width="1.2"/>
        <path d="M11 17 a11 11 0 0 1 22 0" fill="none" stroke="#1ed760" stroke-width="3"/>
        <rect x="8" y="14" width="5" height="8" rx="2" fill="#1ed760"/>
        <rect x="31" y="14" width="5" height="8" rx="2" fill="#1ed760"/>
        <circle class="eye" cx="19" cy="16" r="1.6" fill="#111"/>
        <circle class="eye" cx="25" cy="16" r="1.6" fill="#111"/>
        <path class="shut" d="M17.2 16.2 q1.8 1.4 3.6 0 M23.2 16.2 q1.8 1.4 3.6 0" fill="none" stroke="#111" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M18.5 20 q3.5 3 7 0" fill="none" stroke="#111" stroke-width="1.4" stroke-linecap="round"/>
      </g>
    </svg>`;
  el.style.display = "none";
  document.body.appendChild(el);

  let mx = 0, my = 0, x = 0, y = 0;
  addEventListener("mousemove", (e) => {
    if (el.style.display === "none") { x = e.clientX; y = e.clientY; el.style.display = ""; }
    mx = e.clientX; my = e.clientY;
  });
  document.addEventListener("mouseleave", () => (el.style.display = "none"));

  (function tick() {
    const sleep = !!document.getElementById("intro");
    const dance = !!document.getElementById("thanks");
    el.classList.toggle("sleep", sleep);
    el.classList.toggle("dance", dance);
    // Dormido no sigue al mouse: se queda acostado abajo del botón «Entrar»
    if (sleep) {
      el.style.display = "";
      x = mx = innerWidth / 2 - 36;
      y = my = innerHeight - 140;
    }
    const dx = mx - x, dy = my - y;
    x += dx * 0.12; y += dy * 0.12;
    const moving = Math.hypot(dx, dy) > 3;
    el.classList.toggle("walk", moving && !dance);
    if (Math.abs(dx) > 2) el.classList.toggle("left", dx < 0);
    // Se queda abajo a la derecha del puntero para no taparlo
    el.style.transform = `translate(${x + 14}px, ${y + 18}px)`;
    requestAnimationFrame(tick);
  })();
})();
