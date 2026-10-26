# Auditoría del dashboard y de la integración

Fecha: 25 oct 2026. Alcance:

- los datos que muestra el dashboard;
- su diseño (que no se vea genérico);
- su funcionamiento;
- que sirva para tomar decisiones.

Cada problema encontrado está aquí con lo que se cambió. La auditoría numérica del informe está en [auditoria-cifras.md](auditoria-cifras.md) y el método en [tecnico.md](tecnico.md).

## Cómo se revisó

- **Datos.** `pipeline/auditoria.py` recalcula desde silver las 66 afirmaciones del informe y comprueba que `data.js` tenga las mismas filas y horas que silver (G01). Las cifras del dashboard en «Ventana común» se compararon contra el informe.
- **Estados del dashboard.** Se revisaron con capturas en Edge headless:

  | Personas | Periodos | Tema | Ancho | Otros |
  |---|---|---|---|---|
  | Ambos, solo Javier | Ventana común, 2025, todo el historial | Claro y oscuro | 1366 px y 390 px (móvil, dentro de un iframe) | Ficha de artista abierta desde la URL |

- **Color.** La primera paleta (naranja y azul) se validó para daltonismo con ΔE 23. El 25 oct se cambió a verde y negro a pedido del equipo; verde contra blanco o negro se separa por luminosidad.
- **Errores de JavaScript.** La página los muestra arriba si ocurren. No apareció ninguno en los estados revisados.

## Hallazgos y cambios

Severidad: **alta** (dato incorrecto o engañoso), **media** (se puede malinterpretar), **baja** (estética).

### Datos

| # | Sev. | Hallazgo | Cambio | Archivo |
|---|---|---|---|---|
| D1 | Alta | Una misma canción con varias URIs (single y álbum) se contaba como canciones distintas. Pasa con 498 canciones en la ventana. «CI SARÒ» salía con 66 streams y son 74; el top de Javier cambiaba. | Una canción = nombre + artista | `pipeline/export_dashboard.py` |
| D2 | Alta | El último mes (ago 2026) está incompleto: los datos terminan el 3 (Javier) y el 25 (Gabriel). En la línea se leía como una caída. | Tramo punteado, «(incompleto)» en el tooltip y nota con la fecha de corte. En el informe, la Figura 2 termina en julio. | `app.js` `renderRhythm`; `eda_figures.fig_monthly` |
| D3 | Media | En «% saltadas por hora», la línea unía horas sin datos (la de Javier iba de 0 a 6 h en recta). Las horas con 30 a 50 reproducciones daban picos sin significado. | Mínimo de 50 reproducciones por hora; las demás quedan como hueco | `app.js` `renderSkips` |
| D4 | Media | Con «Todo el historial», «% de días» baja a 33–35%. No es que escuchen menos: el intervalo incluye años sin datos. | El filtro se llama «Todo el historial (con huecos)». Explicado en tecnico.md §6. | `app.js` `PERIODS` |
| D5 | Media | No se veía hasta qué fecha llegan los datos | Fecha de corte de cada persona en el capítulo 00 y en la nota del gráfico mensual | `app.js` `renderFaceOff` |
| D6 | Media | Conexiones de Gabriel desde DE y US del 14 al 18 jul 2023 (29 filas), justo al inicio de su historial | Se muestran tal cual. **Pendiente: Gabriel debe confirmar si fue un viaje.** | Ver [guia-presentacion.md](guia-presentacion.md) |
| D7 | — | ¿`data.js` pierde datos? | No: 81,418 filas y una diferencia de horas menor al 0.01% (redondeo a segundos) | `auditoria.py` G01 |

### Diseño

| # | Sev. | Hallazgo | Cambio |
|---|---|---|---|
| V1 | Media | La nota del heatmap decía «Pico: martes a las 19 h» y el titular «Gabriel escucha más a las 14 h». Parecían contradecirse: una es la celda más fuerte y la otra la hora con más tiempo. | La nota dice «Celda más fuerte» |
| V2 | Baja | La etiqueta «Gabriel» quedaba encima del tramo punteado | Etiqueta al final real de la serie |
| V3 | Baja | En «Shuffle o elegir» y «Dispositivo», el título del eje chocaba con el último tick | Sin título de eje; la unidad ya está en la nota |
| V4 | Baja | En «% saltadas por hora», «↑ % saltadas» se encimaba con el tick de 35% | Más margen arriba |
| V5 | Baja | Plataformas en minúsculas («android») | Nombres propios (Android, Windows, iOS, Web) |
| V6 | Baja | Rayas (—) en los textos del dashboard, a diferencia del informe | «a» para rangos y punto como separador |
| V7 | — | Móvil a 390 px | Sin scroll horizontal; tarjetas, cara a cara y gráficas apiladas |
| V8 | — | Modo oscuro | Correcto en todos los capítulos revisados |
| V9 | Media | El equipo pidió el look de Spotify | Tema verde y negro, oscuro por defecto, logo en el encabezado y como ícono de la pestaña. La nota del heatmap dice «más intenso» (en oscuro, más claro es más). El PDF de respaldo sale en tema oscuro. Las figuras del informe pasaron a verde y negro. |

### Para tomar decisiones

La pregunta de esta parte: si alguien tuviera que decidir algo con este dashboard (por ejemplo, un equipo de producto de un servicio de música), ¿le alcanza?

| # | Hallazgo | Cambio |
|---|---|---|
| N1 | Los insights describían, pero no decían para qué sirven | Cada insight del capítulo 00 tiene una línea «Para decidir», calculada con los datos del filtro. Ejemplos: a quién reactivar (Javier no abre la app 1 de cada 2 días), a qué hora llegarle a cada uno (14 h contra 18 h), por qué canal (teléfono contra computadora) y qué recomendación le sirve (alertas de lanzamientos o descubrimiento). |
| N2 | Los picos y caídas del gráfico mensual no tenían contexto | Bandas con los viajes de 7 días o más: el récord de Javier (may 2026) cae dentro de su estancia en Estados Unidos |
| N3 | Faltaba ver los dos perfiles de un vistazo | Tarjetas de perfil y una comparativa de 10 medidas, cada una con su escala |

## ¿Se ve genérico?

**Lo que lo hace propio:**

- **Titulares.** Dicen el hallazgo con los números del filtro actual, en vez de títulos tipo «Gráfica 1».
- **Color.** Usa verde y negro, como Spotify, con el logo en el encabezado. Cada persona tiene un color fijo en todo el dashboard: Gabriel verde; Javier blanco en tema oscuro y negro en claro. Se distinguen por luminosidad, así que también funciona con daltonismo.
- **Pocos adornos.** Tema oscuro por defecto, una sola tipografía y un degradado verde solo en el encabezado. No hay pasteles, donas, degradados ni muros de tarjetas de KPI. Las tarjetas son solo las dos de los integrantes.
- **Capítulos.** Cada uno responde una pregunta del proyecto.
- **Decisiones.** Hay anotaciones (viajes, mes incompleto) y líneas de decisión.
- **Comprobable.** Cada gráfica tiene «Ver tabla» y cada corte se comparte con la URL.

**Riesgos que quedan:**

- Las tarjetas de perfil son el componente más «de plantilla». No conviene agregar más tarjetas.
- La ficha de artista no marca el mes incompleto con punteado; es menor.

## Funcionalidad verificada

| Función | Estado |
|---|---|
| Filtro de persona (Ambos, Gabriel, Javier): tarjetas, cara a cara, titulares e insights cambian; el capítulo 04 pide «Ambos» | OK |
| Filtro de periodo (ventana, 2023 a 2026, todo): todo se recalcula, incluidas las fechas de corte y los meses punteados | OK |
| «Solo streams» | OK. Skips y canciones repetidas ignoran el filtro a propósito, y lo dicen en su nota. |
| Ficha de artista (clic en una barra o escribir el nombre; también `#a=<artista>` en la URL) | OK |
| Tema claro y oscuro (se guarda en el navegador) | OK |
| Estado en la URL (`#p=…&t=…&s=…&a=…`) para compartir un corte | OK |
| Sin internet (fuentes y librerías locales) | OK |
| PDF de respaldo (`out/dashboard.pdf`, 7 páginas, una por capítulo) | OK |
