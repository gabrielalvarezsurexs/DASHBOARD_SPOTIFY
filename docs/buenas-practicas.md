# Buenas prácticas de visualización para dashboards

Investigación del 12 oct 2026. Complementa [design.md](design.md), que define *nuestro* sistema visual. Este archivo reúne las reglas generales que lo respaldan, con sus fuentes, y la checklist con la que se audita cada vista en la Fase 6 del [ROADMAP](../ROADMAP.md).

## 1. Propósito y jerarquía

- **Lectura de un vistazo.** Un dashboard sirve para entender algo rápido, no para explorar a fondo. NN/g distingue entre dashboards *operacionales* (actuar ya) y *analíticos* (motivar más análisis). El nuestro es analítico: cada vista lleva a un hallazgo y permite profundizar en la ficha del artista. [NN/g]
- **La posición es la forma más fuerte de dar énfasis.** Lo más importante va arriba a la izquierda. Few: *"Few aspects of visual design emphasize some data above the rest as effectively as its location."* [Few/UXmatters]
- **Orden de arriba hacia abajo:** primero el titular y la cifra clave, luego tendencias y al final el detalle. Se lee primero lo que es grande, está cerca y tiene contraste alto. [DataCamp]
- **Resaltar poco.** Si todo está resaltado, nada destaca. Por gráfica se resalta una cosa (una persona, un artista, un pico) y el resto queda en gris de contexto. [Few/UXmatters]
- **Una pantalla por vista.** Few marca como error n.º 1 salirse de una pantalla. En nuestro caso cada capítulo (Ritmo, Eras…) debe entender sin scroll en 1366×768 (laptop típica de la presentación); el detalle extra va debajo del pliegue. [Few/UXmatters]

## 2. Alineación, grid y espaciado

- **Un solo grid de 12 columnas** con gutters iguales (24 px). Si algo rompe el grid, la página se siente ruidosa. [DataCamp, UXPin]
- **Espaciado en múltiplos de 8** (8, 16, 24, 32, 48, 64) y 4 solo para ajustes finos. Se definen como tokens (`--space-1` = 8 px…) y no se usa ningún valor suelto. [spec.fm, Cieden]
- **Regla interno ≤ externo:** el padding dentro de un grupo nunca es mayor que la separación entre grupos. Así la proximidad muestra qué va junto (Gestalt). [Cieden]
- **Agrupar con espacio, no con líneas ni cajas.** Los elementos relacionados van juntos y los que no, separados por aire. [DataCamp]
- **Alinear a bordes compartidos:** el titular, el eje Y de la gráfica y la primera columna de la tabla empiezan en la misma línea vertical. Los ejes Y de gráficas apiladas comparten ancho, para que las áreas de datos queden alineadas.
- **Alineación del texto:** el texto a la izquierda. Nada centrado salvo cifras sueltas muy grandes.

## 3. Contraste (WCAG 2.2 AA)

| Elemento | Mínimo | Criterio |
|---|---|---|
| Texto normal (ejes, leyendas, etiquetas, tooltips) | **4.5:1** | 1.4.3 |
| Texto grande (≥ 24 px, o ≥ 18.66 px en negrita) | 3:1 | 1.4.3 |
| Marcas necesarias para entender el dato (líneas, barras, puntos, celdas) | **3:1 contra el fondo y entre colores adyacentes** | 1.4.11 |
| Indicadores de UI (borde de inputs, foco, chips de filtro) | 3:1 | 1.4.11 |

Detalles de W3C que aplican directo a nosotros:
- El 3:1 **no se redondea**: 2.999:1 falla. [W3C 1.4.11]
- Las **líneas muy delgadas** se ven más claras por el antialiasing; conviene evitarlas en marcas de datos. Nuestras líneas de 2 px están en el límite, así que el color debe pasar con margen. [W3C 1.4.11]
- Las **líneas de una gráfica de líneas** necesitan 3:1 contra el fondo. Si casi no se cruzan, no necesitan contrastar entre sí. [W3C 1.4.11]
- El **gridline necesario para leer valores** también cuenta como objeto gráfico. El nuestro es tenue a propósito, así que el valor siempre debe poder leerse por otra vía (etiqueta, tooltip o tabla). [W3C 1.4.11]
- **Excepción:** si el valor también está como texto visible o en una tabla, la marca deja de ser indispensable. Por eso cada gráfica tiene vista de tabla. [W3C 1.4.11]
- **Heatmaps:** el gradiente que codifica una medida entra en la excepción "esencial", pero la celda más clara se evalúa igual y la escala lleva leyenda numérica. [W3C 1.4.11]
- **Gráficas interactivas:** el estado por defecto, sin hover, ya tiene que cumplir. El tooltip agrega detalle, no contraste. [W3C 1.4.11]
- **No usar solo color** para transmitir información (1.4.1): cada serie lleva etiqueta directa o leyenda, y los estados llevan texto o ícono.

### Auditoría de nuestros tokens actuales (design.md)

| Token | Claro | Oscuro | Veredicto |
|---|---|---|---|
| `--ink` | 15.70 | 15.25 | ok |
| `--ink-2` | 6.91 | 9.61 | ok |
| `--ink-3` (ejes, notas) | **3.32** | 4.89 | ✗ **en claro falla 4.5 para texto** → usar `#6f6a60` (4.85) |
| `--baseline` (eje) | 1.60 | 1.55 | aceptable solo como guía; si el eje es necesario para leer, subir a ≥ 3:1 |
| `--rule` (grid) | 1.20 | 1.25 | ok como recesivo, siempre que los valores se lean por etiqueta/tooltip/tabla |
| Gabo | 4.20 | 5.62 | ok como marca (≥ 3); **no usar como color de texto en claro** |
| Javi | 5.56 | 5.92 | ok |
| Compartido | 5.44 | 4.58 | ok |

## 4. Elegir la gráfica correcta

- **Posición y longitud** son lo que se compara con más precisión, así que se prefieren barras (ordenadas), líneas y dispersión. [NN/g]
- **Ángulo y área** se leen peor. Nada de pays, donas, treemaps ni gauges, que además gastan espacio. [NN/g]
- **El color sirve para categorías, no para magnitudes:** no se lee como un orden. Para magnitud se usa posición o longitud; el color secuencial queda solo para heatmaps, con leyenda. [NN/g]
- **Nada de 3D**, que distorsiona. [NN/g]
- **No variar el tipo de gráfica sin razón**: misma pregunta, misma forma. [Few: "meaningless variety"]
- **Precisión adecuada:** "2,841 h" y no "2,840.83 h". Few cuenta el exceso de detalle o precisión como error. [Few/UXmatters]
- **Siempre con contexto:** una cifra sola no dice nada sin comparación (contra la otra persona, el año anterior o el promedio). [Few: "inadequate context"]

## 5. Limpieza (data-ink)

- *"Eliminate all unnecessary non-data pixels."* Lo que no es dato se elimina, o se atenúa y se uniforma. [Few/UXmatters]
- Fuera bordes de tarjetas, fondos de gráfica, sombras, gradientes, grids densos y ticks de más.
- Etiquetas directas en vez de leyendas lejanas, cuando caben.

## 6. Tablas

- **Números a la derecha y texto a la izquierda;** el encabezado se alinea igual que su columna. [uxcel, Schwabish vía van der Laken]
- **Cifras tabulares** (`font-variant-numeric: tabular-nums`) para que los dígitos queden en columna. IBM Plex Sans las tiene. [uxcel]
- Mismo número de decimales en toda la columna (0 o 1 normalmente). La unidad va en el encabezado, no en cada celda. [Schwabish vía van der Laken]
- Filas con separador hairline o zebra muy tenue, nunca las dos.

## 7. Interacción y accesibilidad

- Filtros en una sola fila arriba, que afectan a todo (ya está en design.md).
- **Foco de teclado visible** (2.4.7) en chips, botones y marcas interactivas, con contraste ≥ 3:1.
- Áreas de clic ≥ 24×24 px (2.5.8).
- Respetar `prefers-reduced-motion`: las transiciones de gráficas se desactivan o se acortan.
- **Reflow** (1.4.10): a 320 px de ancho, sin scroll horizontal. Las gráficas anchas se vuelven tabla o small multiples.
- Cada gráfica con `aria-label` o `<figcaption>` que diga el hallazgo, y vista de tabla como equivalente accesible.

## Checklist de auditoría por vista

- [ ] Lo más importante está arriba a la izquierda; el titular dice el hallazgo
- [ ] Se entiende sin scroll en 1366×768
- [ ] Todo cae en el grid de 12 columnas; espaciados solo con tokens de 8 px
- [ ] Bordes izquierdos compartidos: titular, eje Y y tabla alineados
- [ ] Texto ≥ 4.5:1, marcas y UI ≥ 3:1 (medido, no a ojo)
- [ ] Ningún dato depende solo del color
- [ ] Una sola cosa resaltada por gráfica; lo demás en gris de contexto
- [ ] Sin pays, donas, gauges, 3D ni doble eje
- [ ] Precisión razonable y cifras con contexto comparativo
- [ ] Tabla con números a la derecha y cifras tabulares
- [ ] Foco visible, áreas de clic ≥ 24 px, `prefers-reduced-motion`
- [ ] Probado a 320 px y a 1366 px; probado en modo oscuro
- [ ] Revisado con un simulador de daltonismo (DevTools → Rendering → Emulate vision deficiencies)

## Fuentes

- [W3C — Understanding SC 1.4.11 Non-text Contrast (WCAG 2.2)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [NN/g — Dashboards: Making Charts and Graphs Easier to Understand](https://www.nngroup.com/articles/dashboards-preattentive/)
- [UXmatters — Reseña de *Information Dashboard Design* (Stephen Few)](https://www.uxmatters.com/mt/archives/2007/04/book-review-information-dashboard-design.php)
- [DataCamp — Dashboard design tutorial](https://www.datacamp.com/tutorial/dashboard-design-tutorial)
- [UXPin — UI Grids guide](https://www.uxpin.com/studio/blog/ui-grids-how-to-guide)
- [spec.fm — 8-Point Grid](https://spec.fm/specifics/8-pt-grid)
- [Cieden — Spacing best practices](https://cieden.com/book/sub-atomic/spacing/spacing-best-practices)
- [uxcel — Tables: numbers alignment](https://app.uxcel.com/courses/ui-components-best-practices/tables-best-practices-356/numbers-alignment-1984)
- [Paul van der Laken — 10 guidelines to better table design (Schwabish)](https://paulvanderlaken.com/2020/09/01/10-guidelines-to-better-table-design/)
