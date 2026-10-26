# Documentación técnica para auditar el informe

Este documento describe, paso por paso, cómo se obtiene cada número del informe ejecutivo (`out/informe.docx`) y del dashboard, a partir de los exports de Spotify. Sirve para auditar el informe: cada afirmación numérica tiene una definición aquí (§4) y una verificación automática en [auditoria-cifras.md](auditoria-cifras.md) (§9).

Estado al 25 oct 2026: **66 de 66 afirmaciones verificadas**. Las cifras coinciden con los datos y cada cita está literal en el .docx.

---

## 1. Cómo auditar en 5 pasos

1. Pon los zips en `data/zips/` y corre `generar.cmd` (unos 15 s). Se regenera todo desde cero.
2. Abre [auditoria-cifras.md](auditoria-cifras.md). Para cada afirmación del informe hay:
   - la cita literal;
   - el valor que afirma;
   - el valor recalculado desde los datos;
   - el estado.

   Si algo no cuadra, `generar.cmd` termina con error.
3. Para revisar una cifra en particular, busca su ID en `pipeline/auditoria.py` y lee la consulta SQL. Las definiciones están en §4.
4. Las afirmaciones cualitativas no se verifican automáticamente. Por ejemplo, «el trayecto de la mañana» o «escucha en movimiento». La lista está en §9.3.
5. Compara con el dashboard: en «Ventana común» (el filtro por defecto), las tarjetas, el cara a cara y los capítulos muestran las mismas cifras.

---

## 2. Datos de origen

| Concepto | Valor |
|---|---|
| Fuente | *Extended Streaming History* de Spotify, pedido por cada integrante desde Privacidad |
| Archivos usados | `Streaming_History_Audio_*.json` y `Streaming_History_Video_*.json` (12 archivos en total). El glob `Streaming_History_*.json` incluye los de video: 154 filas de podcasts en video. |
| Filas crudas | 81,429 (todas con `ip_addr`) |
| Campos | 23 por fila: `ts`, `platform`, `ms_played`, `conn_country`, `ip_addr`, `master_metadata_track_name`, `master_metadata_album_artist_name`, `master_metadata_album_album_name`, `spotify_track_uri`, `episode_name`, `episode_show_name`, `spotify_episode_uri`, `audiobook_title`, `audiobook_uri`, `audiobook_chapter_uri`, `audiobook_chapter_title`, `reason_start`, `reason_end`, `shuffle`, `skipped`, `offline`, `offline_timestamp`, `incognito_mode` |
| Persona | Sale del nombre de la carpeta: `data/raw/gabo/` es Gabriel y `data/raw/javi/` es Javier |

| Persona | Filas (silver) | Streams ≥ 30 s | Horas | Primer dato | Último dato | Filas fuera de MX | Sin artista |
|---|---:|---:|---:|---|---|---:|---:|
| Gabriel (`gabo`) | 61,422 | 51,209 | 2,840.8 | 2017-09-01 | 2026-08-25 | 717 | 58 |
| Javier (`javi`) | 19,996 | 17,491 | 948.7 | 2020-09-29 | 2026-08-03 | 283 | 239 |

Cobertura. Gabriel tiene 20 filas en 2017 y luego nada hasta el 14 jul 2023. Javier tiene datos sueltos desde 2020 y continuos (50 o más reproducciones al mes) desde noviembre de 2022.

---

## 3. Pipeline

```
data/zips/*.zip ──unzip──► data/raw/<persona>/<carpeta del zip>/*.json
        │
        ▼  pipeline/build_silver.py (DuckDB 1.5.6)
data/silver/plays.parquet  (81,418 filas, sin ip_addr)
        ├──► pipeline/eda_figures.py ──► informe/fig/*.png ──► pipeline/informe_docx.py ──► out/informe.docx
        ├──► pipeline/export_dashboard.py ──► dashboard/web/data.js ──► dashboard/web/index.html
        │                                                    └──► pipeline/print_pdf.py ──► out/dashboard.pdf
        └──► pipeline/auditoria.py ──► docs/auditoria-cifras.md
docs/bitacora.md ──► pipeline/bitacora_pdf.py ──► out/bitacora.pdf
```

Orquestación: `generar.cmd` ejecuta `uv run python -m pipeline.generar`, que corre en orden:

1. `unzip_raw`: descomprime solo los zips que no estén ya descomprimidos.
2. `build_silver.build`
3. `eda_figures.main`
4. `export_dashboard.export`
5. `informe_docx.build`
6. `auditoria.main`
7. `bitacora_pdf.build`
8. `dashboard_pdf`

Todo el proceso tarda 15 s en una laptop.

**Por qué DuckDB y no Spark/ClickHouse.** Son 81 mil filas y unos 60 MB de JSON. DuckDB en proceso arma silver en menos de 2 s, sin Docker. El stack del curso (MinIO, Spark, ClickHouse y Kafka en `docker-compose.yml`, con `levantar.ps1`) quedó montado y probado como ruta de escalado ([decisiones.md](decisiones.md), A7).

Versiones: Python 3.12, DuckDB 1.5.6, polars 2.0.0, matplotlib 3.11.2, python-docx 1.2.0, Pillow 12.3.0, markdown 3.11.2. En el navegador: Observable Plot 0.6.16 y d3 7.9.0, guardados en `dashboard/web/vendor/`. Fuente: Montserrat (OFL) en `informe/fonts/` y `dashboard/web/fonts/`.

---

## 4. Reglas de limpieza (silver) — `pipeline/build_silver.py`

Cada regla, en el orden del SQL (`SILVER_SQL`):

| # | Regla | Implementación | Por qué |
|---|---|---|---|
| 1 | Zona de la sesión en UTC | `set TimeZone = 'UTC'` antes de cualquier consulta. Lo mismo en `export_dashboard`, `eda_figures` y `auditoria`. | DuckDB interpreta un timestamp sin zona con la zona de la computadora (America/Mexico_City). Sin esto, la conversión a hora local se aplicaba dos veces. |
| 2 | Lectura | `read_json(glob, format='array', union_by_name=true, filename=true)` | Los archivos de distintas épocas no traen las mismas columnas (audiolibros, `offline_timestamp`). |
| 3 | Persona | `regexp_extract(filename, '/raw/([^/]+)/', 1)` | Sumar a alguien es soltar su zip. |
| 4 | Duplicados exactos | `distinct on (user_id, ts, spotify_track_uri, spotify_episode_uri, ms_played)` | Se quitan **11** filas (81,429 a 81,418). |
| 5 | Fin e inicio | `ts_utc = ts::timestamptz`; `ts_start_utc = ts_utc - ms_played` | `ts` marca el **fin** de la reproducción, en UTC. Todo se ubica por la hora de inicio. |
| 6 | Hora local | `timezone(tz, ts_start_utc)` con la zona IANA del país de conexión (`COUNTRY_TZ`). MX: America/Mexico_City; US: America/Chicago; BR: America/Sao_Paulo; GB, ES, FR, DE, CZ, IT: sus capitales. Si el país no está en la tabla, se usa MX. | No hay ciudad en el export. US y BR son aproximaciones y afectan a menos del 1.5% de las filas. |
| 7 | Tipo de contenido | `track` si hay `spotify_track_uri`, `episode` si hay `spotify_episode_uri`, `audiobook` si hay `audiobook_uri`, si no `unknown` | |
| 8 | Skip | `coalesce(skipped, false)` | El EDA mostró que `skipped` vale 97 a 98% en `fwdbtn`, `backbtn` y `endplay` y 0% en `trackdone` y `logout`. |
| 9 | Shuffle, offline, incógnito | `coalesce(..., false)` | |
| 10 | Familia de plataforma | `android`, `web`, `windows`, `ios` u `other`, según el texto de `platform` | |
| 11 | Stream | `ms_played >= 30000` | Es el umbral de Spotify. El histograma separa saltos al instante de canciones completas. |
| 12 | IP | No se selecciona. Al final se verifica `assert "ip_addr" not in cols`. | Es dato personal y no responde ninguna pregunta. |

---

## 5. Ventana común

`COMMON_WINDOW_START = "2023-07-01"` (`pipeline/config.py`).

- **Qué cubre.** Las comparaciones del informe y el filtro por defecto del dashboard usan `ts_local >= 2023-07-01`. La ventana no tiene fecha de fin.
- **Por qué empieza en julio.** Es el primer mes en que los dos tienen datos continuos; los de Gabriel empiezan el 14 jul 2023.
- **Qué pasa con una ventana desde enero de 2023.** Javier aporta 6 meses de datos y Gabriel ninguno, y Javier parece escuchar más que Gabriel en 2023 (0.9 a 1). En los meses que ambos tienen datos (jul a dic 2023), Gabriel escuchó el doble (2.0 a 1).
- **Fin de los datos.** Los datos terminan el 25 ago 2026 (Gabriel) y el 3 ago 2026 (Javier). Agosto de 2026 está incompleto para los dos:
  - la Figura 2 del informe lo excluye;
  - en el dashboard se dibuja punteado.

---

## 6. Definiciones de métricas

Notación:
- `p` es silver dentro de la ventana común.
- «Música» es todo lo que no es episodio de podcast (`content_type <> 'episode'`). Incluye canciones, audiolibros y filas sin tipo, igual que el dashboard.
- Los porcentajes de cada persona son sobre **su propio** tiempo.

| Métrica | Definición exacta | Dónde se calcula |
|---|---|---|
| Horas | `sum(ms_played) / 3.6e6` sobre todas las filas (incluye podcasts y saltos) | `app.js` `profiles`; `auditoria.py` B01 y B02 |
| Días con escucha | Días locales distintos con al menos una reproducción | B04 y B05 |
| % de días | Días con escucha entre los días del intervalo, del primer al último día de esa persona en el periodo, ambos inclusive | B04 y B05. Con «Todo el historial» el % baja porque el intervalo incluye años sin datos; por eso el filtro dice «(con huecos)». |
| Mediana por día con escucha | Segundos por día, ordenados de menor a mayor; se toma el elemento `floor(n/2)` (base 0). Es la mediana superior. | B06 y B07 |
| Hora pico | Hora local con más tiempo de escucha. Agrega los 7 días. | B08 y B09 |
| Celda más fuerte | Combinación día de la semana × hora con más tiempo | D02 |
| Artistas distintos | `count(distinct artist_name)` en música | B11 y B12 |
| Peso del top 10 | Tiempo de los 10 artistas con más tiempo entre el tiempo total de música | B13 y B14 |
| % de canciones saltadas | Filas de música con `is_skip` entre todas las filas de música. Usa todas las reproducciones, no solo streams: con streams no habría skips. | B15 y B16 |
| Skips por bloque | Igual que el anterior, por hora local. Bloques: madrugada 0–6, mañana 6–12, tarde 12–18, noche 18–24. El dashboard ignora bloques con menos de 200 filas. | D11, D12 y D15 |
| Skips con y sin shuffle | Igual, separando por `shuffle` | D13 y D14 |
| Dispositivo principal | Familia de plataforma con más tiempo (todas las filas) | B17 y B18 |
| Tiempo en podcasts | Tiempo en episodios entre el tiempo total | B19 y B20 |
| Escucha de 17 a 21 h, madrugada y fin de semana | Tiempo en esas horas (o en sábado y domingo) entre el tiempo total | C01, C02 y D01 |
| Horas por mes de un año | Horas del año entre los meses con datos de ese año (2023 tiene 6 meses en la ventana) | C03 a C05 |
| Día récord | Día local con más horas | D03 y D04 |
| Canción más repetida | Streams (≥ 30 s) por **nombre + artista**. Las versiones single y de álbum tienen URIs distintas; en la ventana hay 498 canciones así. Contarlas por URI partía el conteo: «CI SARÒ» aparecía con 66 en lugar de 74. | D05, D07, D08, D18 y D19; `export_dashboard.py` |
| Eras (trimestres) | Artista con más tiempo de música en cada trimestre calendario | C06 y C07 |
| Artistas compartidos | Artistas con al menos una reproducción de música de cada persona en el periodo | C08 |
| Peso de los compartidos | Tiempo de música en artistas compartidos entre el tiempo de música de la persona | D16 y D17 |
| Quién llegó primero | Fecha del **primer stream** de cada persona para cada artista compartido, dentro del periodo. Solo cuentan los artistas que **ambos** empezaron en o después del umbral, que es el 1.er día del mes del inicio común más 3 meses (1 oct 2023). Gana quien llegó más de 30 días antes; si no, es empate y no cuenta. Resultado: 82 artistas (Javier 55, Gabriel 27). | C08; `app.js` `renderShared` |
| Viaje | Días con al menos una reproducción desde un país distinto de MX, agrupados si están a 16 días o menos entre sí. No se corta con reproducciones desde MX a mitad del viaje (pasa en los datos). El dashboard solo marca como banda los viajes de 7 días o más. | F01 y F02; `app.js` `tripGroups` |
| Mes incompleto | El mes del último dato de una persona, si ese día no es fin de mes | `app.js` `renderRhythm`; `eda_figures.fig_monthly` |

---

## 7. Del silver al dashboard — `pipeline/export_dashboard.py`

`dashboard/web/data.js` define `window.SPOTIFY = {...}`. Usa JavaScript en lugar de JSON porque `fetch()` está bloqueado en `file://`; así el HTML abre con doble clic. Es una tabla columnar de 81,418 filas (2.8 MB, sin IP).

| Columna | Contenido |
|---|---|
| `u` | Índice de la persona en `users` |
| `m` | Minutos desde 1970 en **hora local**: el reloj local se guarda como si fuera UTC |
| `s` | Segundos reproducidos, redondeados |
| `a`, `k`, `w` | Índices de artista, canción (nombre + artista) y programa de podcast. Valen -1 si no aplica. |
| `f` | Bits: 1 stream, 2 skip, 4 shuffle, 8 episodio, 16 incógnito, 32 offline |
| `p`, `c` | Índices de plataforma y país |

El navegador agrega todo con cada filtro (`app.js`). La auditoría G01 comprueba que `data.js` tiene todas las filas y las mismas horas que silver: la diferencia por el redondeo a segundos es menor al 0.01%.

---

## 8. Figuras e informe

### 8.1 Figuras (`pipeline/eda_figures.py`, matplotlib, Montserrat)

| Archivo | Datos | Qué justifica |
|---|---|---|
| `eda_cobertura.png` | Reproducciones por mes de 2017 a 2026, con los meses vacíos en 0 (`generate_series`) | La ventana común |
| `eda_zona_horaria.png` | % del tiempo de Javier por hora: UTC crudo contra hora local | La conversión de zona |
| `eda_duracion.png` | Histograma de segundos reproducidos (canciones, tope de 7 min, cajones de 5 s) | La regla de 30 s |
| `eda_skip.png` | % de `skipped` por `reason_end` | La definición de skip |
| `hallazgo_heatmap.png` | % del tiempo por día × hora, con una escala por persona | Hallazgo 1 |
| `hallazgo_mensual.png` | Horas por mes en la ventana, sin el último mes incompleto | Hallazgo 2 |

### 8.2 Informe (`pipeline/informe_docx.py`)

- **Generación.** El texto está en `content()`. Se genera con python-docx en tamaño carta, márgenes de 2 cm, Montserrat de 9.5 pt, títulos de 15, 11.5 y 9.5 pt, todo en negro y sin rayas (em dash).
- **Fuente embebida.** `embed_fonts()` mete Montserrat Regular, Bold e Italic en el .docx, ofuscadas según ECMA-376 §17.8.1: XOR de los primeros 32 bytes con la GUID invertida. Así el documento se ve igual en una computadora sin Montserrat. Para comprobarlo, se convirtió a PDF con Word en una máquina sin la fuente instalada: todo el texto usa Montserrat.
- **Páginas.** Son 5. Word las cuenta con `ComputeStatistics(2)`.

### 8.3 Bitácora (`pipeline/bitacora_pdf.py`)

Convierte `docs/bitacora.md` (markdown con tablas) a HTML con Montserrat local y lo imprime con Edge headless: 2 páginas.

### 8.4 PDF del dashboard (`pipeline/print_pdf.py`)

Toma una captura por capítulo (`#th=light&only=<capítulo>`, 1366 px de ancho, escala 1.5), recorta el fondo vacío y une las imágenes con Pillow. Imprimir el dashboard directo cortaba el final.

---

## 9. Auditoría de cifras — `pipeline/auditoria.py`

### 9.1 Método

Cada afirmación numérica del informe es un `Check` con:

- **ID y sección**;
- **cita** (`CITAS`): el texto literal que debe aparecer en el .docx. Se busca en párrafos y tablas, con los espacios normalizados;
- **valor esperado**: lo que afirma la cita, con el mismo redondeo del informe;
- **cálculo**: SQL directo sobre silver o una función que replica la regla de `app.js`.

Estado OK = la cita está en el informe **y** el valor recalculado es idéntico al esperado. `generar.cmd` falla si alguna no cuadra.

Para agregar una afirmación nueva al informe:
1. escribe el texto en `informe_docx.py`;
2. agrega su `Check` y su cita en `auditoria.py`;
3. corre `uv run python -m pipeline.auditoria`.

### 9.2 Errores que encontró la auditoría (25 oct 2026) y cómo se corrigieron

| ID | Antes, en el informe | Dato real | Corrección |
|---|---|---|---|
| A05 | «21 campos» | 23 (incluye 4 de audiolibros y `offline_timestamp`) | «23 campos» |
| C07 | Alfa nº 1 de Javier «en 7 de los últimos 9 trimestres» | 8 de 9 (T3 2024 a T2 2026 seguidos; en T3 2026, incompleto, gana Dean Lewis) | «8 de los últimos 9» |
| D08 | «CI SARÒ», 66 streams | 74: las versiones single y de álbum tienen URIs distintas | Canción = nombre + artista en el export y en el texto; ahora «CI SARÒ» es la más repetida de Javier |
| D10 | Podcasts «en francés e italiano» | Francés (23 h); los demás son en inglés (catequesis y admisiones) | «sobre todo uno en francés (23 horas)» |
| D16 y D17 | «cerca del 42% del tiempo de cada uno» | 41% Gabriel, 42% Javier | Cifras separadas |
| E02 y E03 | Pie de cobertura: «con enero, Gabriel parecía escuchar 5 veces más, cuando fue 2.5» | Con enero, en 2023 Javier parecía escuchar más (0.9 a 1); en jul a dic, Gabriel escuchó 2.0 veces | Pie reescrito |
| E07 | «el historial de Javier empieza seis meses antes» | Continuo desde nov 2022: ocho meses antes | «ocho meses antes» |
| — | «Su escucha cae en julio, agosto y diciembre: escucha más en periodo escolar» | Los meses más bajos son julio, marzo y diciembre; agosto está sesgado por el mes incompleto de 2026 | Se quitó la frase: los datos no la sostienen |
| — | «Sebastián Yatra» | El dato dice «Sebastian Yatra» | Escrito como en los datos |
| — | Figura 2 hasta ago 2026 | Agosto de 2026 tiene 3 días de Javier y 25 de Gabriel: parecía una caída | La figura termina en jul 2026; el pie lo explica |

### 9.3 Lo que la auditoría automática no cubre

Son interpretaciones, no cifras. Hay que revisarlas a mano:

- «Gabriel tiene un pico a las 6 h, que coincide con el trayecto de la mañana». El pico es un dato (B10, 6.7% del tiempo); el trayecto es una interpretación.
- «Gabriel escucha en movimiento; Javier frente al escritorio». Se infiere del dispositivo (B17 y B18).
- «Cuando elige qué escuchar, busca activamente hasta dar con la canción». Interpreta D13 y D14.
- «Escuchamos música de forma casi opuesta» y la reflexión personal de §6.
- El sesgo de «quién llegó primero». Es una advertencia, no una cifra.

---

## 10. Limitaciones conocidas

| Limitación | Efecto | Qué hacer |
|---|---|---|
| Zona aproximada para US (Chicago) y BR (São Paulo) | Puede correr 1 a 2 h la hora local de 283 filas de Javier y de 11 de Gabriel | Aceptado; menos del 1.5% de las filas |
| Conexiones de Gabriel desde DE y US del 14 al 18 jul 2023, los primeros días de su historial (29 filas) | El capítulo 05 las muestra como un viaje | **Gabriel debe confirmar** si fue un viaje real |
| Países con una sola reproducción (IT y DE el 1 y el 4 jul 2025; US el 14 nov 2025) | Puede ser roaming o VPN | Se reportan tal cual; el tooltip muestra el número de reproducciones |
| Horas con pocas reproducciones en el gráfico de skips | Los porcentajes saltan sin significado | El dashboard deja hueco si hay menos de 50 reproducciones en esa hora |
| `coalesce(skipped, false)` y `coalesce(shuffle, false)` | Hoy no cambian nada: se verificó que ninguna fila trae `skipped` ni `shuffle` nulos | Protege contra exports futuros con campos vacíos |
| La mediana del dashboard usa segundos redondeados | Diferencia menor a 1 s | Sin efecto en cifras redondeadas a minutos |
| Programa de podcast sin nombre (1.2 h de Gabriel) | Aparece como «(sin nombre)» | Viene así en el export |

---

## 11. Archivos

| Archivo | Rol |
|---|---|
| `pipeline/config.py` | Rutas y `COMMON_WINDOW_START` |
| `pipeline/build_silver.py` | Raw → silver (§4) |
| `pipeline/eda_figures.py` | Figuras del informe (§8.1) |
| `pipeline/export_dashboard.py` | Silver → `data.js` (§7) |
| `pipeline/informe_docx.py` | Texto y formato del informe (§8.2) |
| `pipeline/auditoria.py` | Auditoría de cifras (§9) |
| `pipeline/bitacora_pdf.py` | Bitácora a PDF (§8.3) |
| `pipeline/print_pdf.py` | Edge/Chrome headless: PDF y capturas (§8.4) |
| `pipeline/generar.py`, `generar.cmd` | Orquestación (§3) |
| `dashboard/web/app.js` | Toda la lógica del dashboard (§6) |
| `docs/auditoria-cifras.md` | Resultado de la auditoría (generado) |
| [auditoria-dashboard.md](auditoria-dashboard.md) | Auditoría de diseño y funcionalidad del dashboard |
