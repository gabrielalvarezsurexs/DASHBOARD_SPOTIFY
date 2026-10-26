# Guía de diseño

El objetivo es que el dashboard se lea como **una pieza editorial sobre dos personas y su música**, no como una plantilla de admin panel. Cada decisión de abajo existe para alejarse del look "generado por IA" (verde Spotify, tarjetas con sombra, degradados morados, íconos en círculos, donas).

## Concepto: "notas de disco"

Inspiración: las notas internas de un vinil / la sección de datos de una revista musical impresa. Papel cálido, tinta oscura, mucho aire, tipografía con voz, y dos colores que son **dos personas**.

- El dashboard cuenta algo. Cada vista abre con **una frase-titular que dice el hallazgo**, calculada con los datos del filtro actual:
  - ✗ "Hábitos de escucha"
  - ✓ "Javi escucha de noche; Gabo, camino a la escuela"
- Debajo del titular, una línea de contexto en tinta secundaria ("Minutos por hora del día, hora local, 2023–2026").
- La gráfica. Luego, si aplica, una nota al pie con el detalle metodológico ("Solo reproducciones ≥ 30 s").

## Color

### Identidad (categórico) — validado

Validado con el validador de dataviz (`--pairs all`, superficies propias): pasa banda de luminosidad, croma, separación para daltonismo (ΔE peor par 9.5 claro / 11.2 oscuro) y piso de visión normal (≥ 15) en ambos modos.

| Rol | Claro (sobre `#f6f3ec`) | Oscuro (sobre `#17161a`) |
|---|---|---|
> **Reemplazada el 25 oct 2026:** el equipo pidió verde y negro tipo Spotify. Paleta vigente en `dashboard/web/styles.css` (Gabriel verde; Javier blanco en oscuro y negro en claro). Lo de abajo es el historial.

| **Gabo** | `#c4501b` naranja quemado | `#e0703a` |
| **Javi** | `#2f5fb3` azul cobalto | `#6b93e3` |
| **Compartido / ambos** | `#a23d7a` ciruela | `#c9589a` |
| Contexto / "otros" (no categórico) | `#8a8578` | `#8a8578` |

Reglas:
- **El color sigue a la persona en todo el dashboard.** Gabo es naranja en cada gráfica, leyenda, chip de filtro y tooltip. Nunca se reasigna por ranking ni por orden de serie.
- Cuando una gráfica muestra *muchos* artistas: no colorear cada uno. Un artista resaltado en el color de su persona, el resto en gris de contexto.
- Diverging natural del proyecto: **Gabo ↔ Javi** (naranja ↔ azul, cálido/frío) con gris neutro en el medio. Úsalo para "¿quién escucha más a X?".
- Secuencial (heatmaps, calendario): una sola tonalidad, claro → oscuro, de la persona en cuestión. Para comparar a ambos en un heatmap: **dos small multiples** lado a lado, cada uno en su rampa, normalizados como % del tiempo de esa persona.
- Si se agrega un color nuevo, correr el validador antes de usarlo:
  `node <dataviz>/scripts/validate_palette.js "#c4501b,#2f5fb3,#a23d7a,<nuevo>" --mode light --surface "#f6f3ec" --pairs all`

### Superficies y tinta

| Token | Claro | Oscuro |
|---|---|---|
| `--page` | `#f6f3ec` | `#17161a` |
| `--surface` (gráficas) | `#f6f3ec` (sin tarjetas: la gráfica vive sobre la página) | `#17161a` |
| `--ink` | `#1b1a17` | `#efece4` |
| `--ink-2` (secundaria) | `#57534a` | `#c2bdb1` |
| `--ink-3` (ejes, notas) | `#8a8578` ⚠ 3.32:1, falla 4.5 para texto → cambiar a `#6f6a60` (pendiente, ver [buenas-practicas.md](buenas-practicas.md) §3) | `#8a8578` |
| `--rule` (hairline / grid) | `#e4dfd3` | `#2a292d` |
| `--baseline` | `#c9c2b2` | `#3a383d` |

Modo oscuro: tokens propios (arriba), no un `invert()`. Respetar `prefers-color-scheme` y permitir toggle manual.

## Tipografía

- **Titulares de vista (frases-hallazgo):** serif con carácter — *Newsreader* (Google Fonts), 28–36 px, peso 500, interlineado ajustado.
- **Todo lo demás** (UI, ejes, tablas, **cifras grandes**): *IBM Plex Sans*. Nada de Inter/Geist/Poppins (las fuentes por defecto de las plantillas).
- Cifras grandes: proporcionales y en sans, **nunca en serif**. `font-variant-numeric: tabular-nums` solo en tablas y ejes.
- Formato numérico y de fechas en `es-MX` (`Intl.NumberFormat`, `Intl.DateTimeFormat`): "2,841 h", "mar 2025".

## Layout

- Ancho máximo ~1180 px, alineado a la izquierda dentro del contenedor, márgenes generosos. Sin tarjetas con sombra: las secciones se separan con espacio y reglas hairline.
- **Barra de filtros global, una sola fila, fija arriba**: Persona (Gabo · Javi · Ambos, chips con su color), rango de fechas (presets: todo, ventana común 2023+, último año, por año), toggle "solo streams ≥ 30 s". Todas las vistas responden al mismo corte.
- Navegación por capítulos numerados tipo índice: `01 Ritmo · 02 Eras · 03 En común · 04 Comportamiento · 05 Descubrimiento · 06 Contexto`.
- Estado en la URL (filtros + capítulo) para poder compartir un enlace exacto durante la presentación.
- Responsive mínimo: una columna en < 760 px, sin scroll horizontal.

## Gráficas

Librería recomendada: **Observable Plot** (D3 para lo especial: calendario, bump chart). Evitar estilos por defecto de Chart.js / Plotly / Recharts.

- Un solo eje Y por gráfica. Si hay dos medidas de escala distinta → dos gráficas o índice base 100.
- Marcas delgadas: líneas 2 px, barras con 2 px de separación, extremos redondeados 4 px anclados a la base.
- Grid y ejes en hairline sólida (`--rule`), nunca punteada. Pocas marcas de eje.
- Etiquetas directas selectivas (el extremo, el pico, la serie importante), nunca un número en cada punto. Leyenda siempre que haya ≥ 2 series.
- Anotaciones en la propia gráfica para los hallazgos ("Viaje a Europa, jun 2025").
- Tooltip en todas las gráficas (crosshair en líneas, por marca en barras/celdas), con área de hover ≥ 24 px. El tooltip nunca es la única forma de leer un valor: cada gráfica tiene vista de tabla.
- Al refiltrar: mantener la gráfica anterior con opacidad reducida mientras carga; sin skeletons parpadeando ni saltos de layout.
- Click en un artista en cualquier vista → ficha del artista (drill-down) con su línea de tiempo para cada persona.

Formas por pregunta:

| Pregunta | Forma |
|---|---|
| ¿Cuándo escuchan? | Heatmap hora × día (small multiples por persona) · calendario anual |
| ¿Qué dominó cada mes? | Bump chart de ranking de artistas · barras apiladas por mes con top 5 + "otros" en gris |
| ¿Quién escucha más a X? | Barras divergentes Gabo ↔ Javi |
| ¿Cuánto en común? | Lista ordenada de artistas compartidos con dos barras finas; **no** diagrama de Venn decorativo |
| Un número clave | Cifra grande + frase, sin gráfica (un "KPI" no necesita ícono) |
| Evolución de una tasa | Línea con banda o puntos mensuales; eje Y en % empezando en 0 |

## Checklist anti-plantilla

Revisar cada vista antes de darla por terminada:

- [ ] ¿Hay verde Spotify (`#1DB954`) en algún lado? → quitar
- [ ] ¿Degradados, glassmorphism, sombras grandes, bordes de 16 px+ de radio? → quitar
- [ ] ¿Emojis o íconos genéricos (🎵, 📊, íconos en círculos de color)? → quitar
- [ ] ¿Títulos genéricos ("Overview", "Analytics", "Resumen", "Dashboard")? → reemplazar por frase-hallazgo
- [ ] ¿Fila de 4 tarjetas KPI idénticas como primera cosa en pantalla? → reemplazar por un titular + una cifra que importe
- [ ] ¿Donas o pays? → barras o la cifra
- [ ] ¿Colores que cambian al filtrar? → el color sigue a la persona
- [ ] ¿Doble eje Y? → separar
- [ ] ¿Texto de relleno, lorem ipsum, "Welcome back"? → copy real
- [ ] ¿Se ve igual en modo oscuro (tokens propios, contraste OK)?
- [ ] ¿Cada gráfica tiene tooltip y vista de tabla?
- [ ] Captura de pantalla real revisada a ojo (etiquetas que chocan, cortes, overflow)
