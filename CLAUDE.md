# CLAUDE.md

Proyecto final de Big Data: **dashboard dinámico sobre el Extended Streaming History de Spotify de Gabriel (Gabo) y Javier (Javi)**, construido sobre un pipeline con las herramientas vistas en clase (MinIO, Spark, ClickHouse, Kafka; Airflow opcional).

## Antes de tocar nada

0. Formato del informe (pedido del equipo): Montserrat embebida, todo en negro, títulos discretos, nunca em dash. Nombres visibles: Gabriel y Javier (carpetas de datos: gabo, javi). Entregables: informe 25 oct, exposición 26–27 oct, bitácora ([docs/bitacora.md](docs/bitacora.md): agrega ahí obstáculos/decisiones nuevos con fecha).
1. **Lee [docs/requisitos.md](docs/requisitos.md)** — los requisitos de la profesora pueden cambiar. Si algo de este archivo o del roadmap contradice `requisitos.md`, gana `requisitos.md`.
2. Revisa [docs/decisiones.md](docs/decisiones.md): qué está decidido (ADR) y qué sigue abierto. No asumas una decisión abierta; pregunta.
3. Revisa [ROADMAP.md](ROADMAP.md) para saber en qué fase estamos.

## Arquitectura

**Camino real de entrega (desde el 25 oct, decisión A7):** todo en el host con DuckDB, sin Docker.

```
data/raw/<usuario>/*.json ─DuckDB─► data/silver/plays.parquet ─┬─► dashboard/web/data.js ─► dashboard/web/index.html (Observable Plot, filtra en el navegador)
                                                              └─► informe/fig/*.png ─► pipeline/informe_docx.py ─► out/informe.docx
docs/bitacora.md ─► pipeline/bitacora_pdf.py ─► out/bitacora.pdf
uv run python -m pipeline.generar   (= generar.cmd) regenera todo, incluido out/dashboard.pdf (capturas por capítulo)
```

- `pipeline/build_silver.py` aplica las reglas de datos; `COMMON_WINDOW_START` y `SILVER_PATH` viven en `pipeline/config.py`.
- `dashboard/web/app.js` agrega en el navegador. Hash de URL: `p` persona, `t` periodo, `s` streams, `a` artista, `th` tema, `only` un solo capítulo (para capturas).
- Las cifras del informe deben coincidir con el dashboard en «Ventana común». Si cambias una regla o el texto del informe, corre `uv run python -m pipeline.auditoria` (debe quedar todo OK; `generar.cmd` falla si no). Toda cifra nueva del informe lleva su `Check` y su cita en `pipeline/auditoria.py`. Método completo: docs/tecnico.md.
- Una canción = nombre + artista (no URI). El último mes de cada persona está incompleto: se marca, no se grafica como caída.

**Ruta de escalado (montada, fuera del camino crítico):** medallion en MinIO con Spark y ClickHouse:

```
data/raw/<usuario>/*.json ──► MinIO bronze ──Spark──► silver (Parquet limpio) ──Spark──► gold (estrella + agregados)
                                                                                          │
                                                       ClickHouse (s3() sobre gold) ◄─────┘
                                                                │
                                         FastAPI (dashboard/api) ──► frontend (dashboard/web)
Kafka (perfil streaming): replay de silver como eventos ──► ClickHouse Kafka engine ──► vista "en vivo"
```

| Carpeta | Qué va | Dónde corre |
|---|---|---|
| `pipeline/` | Scripts Python de host: subir raw a MinIO, cargar gold a ClickHouse, productor Kafka de replay, utilidades | `uv run python -m pipeline.<módulo>` |
| `jobs/` | Jobs PySpark (bronze→silver→gold). **Solo pyspark + stdlib** (el contenedor tiene Python 3.11 y no ve el `.venv`) | contenedor `spark` vía `spark-submit` |
| `clickhouse/init/` | DDL que ClickHouse ejecuta **solo la primera vez** que se crea el volumen | contenedor `clickhouse` |
| `dashboard/api/` | Backend FastAPI: endpoints que consultan ClickHouse y devuelven JSON listo para graficar | host, `uv run` |
| `dashboard/web/` | Frontend (stack pendiente, ver D1 en decisiones) | host, node |
| `notebooks/` | EDA y búsqueda de insights. Montado en el contenedor como `/home/jovyan/work` | Jupyter (contenedor) o local |
| `data/` | Datos personales. **Gitignored completo.** Ver [data/README.md](data/README.md) | — |
| `docs/` | Requisitos, decisiones, diccionario de datos, guía de diseño | — |

## Comandos

```powershell
.\levantar.ps1 [-Streaming] [-Explore] [-Todo] [-Bajar]   # TODO de golpe: uv, Docker, .env, zips→raw, puertos, compose, health
                                                          # (levantar.cmd = lo mismo con doble clic)
uv sync                                    # entorno local (Python 3.12)
uv sync --group spark                      # + pyspark local (opcional, autocompletado)
docker compose up -d                       # minio + clickhouse + spark (jupyter en :8888)
docker compose --profile streaming up -d   # + kafka (:9094 host) + kafka-ui (:8080)
docker compose --profile explore up -d     # + metabase (:3001) solo para validar números

.\generar.cmd                              # zips + silver + figuras + data.js + out/informe.docx + out/bitacora.pdf + out/dashboard.pdf
uv run python -m pipeline.build_silver     # solo silver
uv run python -m pipeline.export_dashboard # solo dashboard/web/data.js
uv run python -m pipeline.profile_raw      # perfil rápido de data/raw con DuckDB (sin Docker)
docker compose exec spark spark-submit --packages org.apache.hadoop:hadoop-aws:3.3.4 /home/jovyan/jobs/<job>.py
#   (jobs/smoke_test.py valida Spark ↔ MinIO; `python` directo en el contenedor NO ve pyspark, usar spark-submit)

uv run ruff check . ; uv run ruff format .
uv run pytest
```

Puertos: MinIO API 9000 / consola 9001 · ClickHouse HTTP 8123 / nativo 9010 · Jupyter 8888 · Spark UI 4040 · Kafka 9094 · Kafka UI 8080 · Metabase 3001.

Entorno: Windows 11 + PowerShell + Docker Desktop. Docker Desktop tiene que estar encendido antes de `docker compose`. Al imprimir texto con acentos/ñ desde Python en consola usa `$env:PYTHONIOENCODING="utf-8"`.

## Reglas de datos (no negociables)

Detalle completo en [docs/datos.md](docs/datos.md).

- **Nunca** commitear nada de `data/`, ni zips, ni Parquet con datos reales. Los exports traen `ip_addr` e historial personal.
- `ip_addr` se elimina al pasar a silver. Nunca llega a gold, ClickHouse ni al frontend.
- `ts` es **UTC y marca el FIN** de la reproducción. Inicio = `ts - ms_played`. Toda vista por hora/día usa hora local (`conn_country` → zona horaria; MX → `America/Mexico_City`).
- "Stream" = `ms_played >= 30_000` (regla de Spotify). Silver conserva todo con la bandera `is_stream`; las métricas de gusto (top artistas, etc.) usan solo streams; las de comportamiento (skips) usan todo.
- No hay ID de artista en el export, solo nombre. Agrupar por `master_metadata_album_artist_name` tal cual.
- No hay duración de la canción. Si se necesita, estimar con la mediana de `ms_played` donde `reason_end = 'trackdone'`.
- Comparaciones Gabo vs Javi: ventana común por defecto (**2023-07-01** en adelante). Gabo tiene 20 filas en 2017 y nada hasta el 14 jul 2023.
- DuckDB: `SET TimeZone = 'UTC'` antes de tocar `ts`, o lo interpreta con la zona de la máquina.
- Los jobs deben ser **genéricos por usuario** (`user_id` sale de la carpeta `data/raw/<usuario>/`). Agregar una tercera persona debe ser solo soltar su zip.

## Reglas de diseño del dashboard

Leer [docs/design.md](docs/design.md) (nuestro sistema visual) y [docs/buenas-practicas.md](docs/buenas-practicas.md) (reglas generales con fuentes: jerarquía, grid de 8 px, contraste WCAG 4.5:1 texto / 3:1 marcas, tablas) antes de escribir cualquier vista o gráfica. Resumen:

- Nada de look "plantilla": sin verde Spotify, sin degradados morados, sin glassmorphism, sin emojis como iconos, sin tarjetas KPI con ícono en círculo, sin donas.
- Colores (desde 2026-10-25, pedido del equipo): verde y negro tipo Spotify, tema oscuro por defecto, logo en dashboard/web/img/spotify.png. Gabriel = verde (#1ed760 oscuro / #179443 claro), Javier = blanco en oscuro / negro #191414 en claro. El color sigue a la persona, nunca al ranking. Tokens en styles.css; docs/design.md tiene la paleta anterior como historial.
- Cada vista abre con una **frase-titular que dice el hallazgo**, no con un título genérico ("Resumen", "Analytics").
- Un solo eje Y por gráfica. Marcas delgadas, grid en hairline, etiquetas directas selectivas, tooltip en todo, vista de tabla disponible.
- Filtros globales en una sola fila arriba; todas las gráficas responden al mismo corte.

## Convenciones

- Identificadores de código en inglés; comentarios, docs, commits y textos de UI en español.
- Python 3.12, formateo y lint con ruff (config en `pyproject.toml`). Rutas con `pathlib`.
- Configuración por variables de entorno (`.env`, plantilla en `.env.example`), leídas en `pipeline/config.py`. Nada de credenciales hardcodeadas fuera de defaults locales.
- SQL de ClickHouse en archivos `.sql`, no strings gigantes en Python.
- Agregaciones pesadas en ClickHouse/Spark, no en el frontend. El API devuelve datos ya agregados al grano que la gráfica necesita.
- Cuando cambie un requisito: actualizar `docs/requisitos.md` (changelog) → `docs/decisiones.md` → `ROADMAP.md`, en ese orden.
