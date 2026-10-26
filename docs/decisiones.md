# Decisiones

Dos partes: **abiertas** (requieren respuesta del equipo o de la profesora) y **tomadas** (ADR cortos, con el porqué, para poder defenderlas en la presentación).

---

## Cerradas el 25 oct 2026

Con las instrucciones oficiales ([requisitos.md](requisitos.md)) y el informe venciendo el mismo día, D1–D5 se cerraron así:

| | Decisión | Por qué |
|---|---|---|
| D1 | **HTML estático + Observable Plot** (sin FastAPI ni Svelte) | Se abre con doble clic, sin servidor; los filtros corren en el navegador sobre 81 mil filas. Mismo look editorial, cero setup. |
| D2 | **Local**: `dashboard/web/index.html` + `out/dashboard.pdf` de respaldo | No se pidió despliegue. Un sitio público expondría datos personales. |
| D3 | **Sin enriquecimiento** | No da tiempo y los insights de comportamiento no lo necesitan. |
| D4 | **Kafka fuera** del entregable | No suma a ningún criterio de evaluación. El stack sigue en `docker-compose.yml` (perfil `streaming`). |
| D5 | **Airflow fuera** | El pipeline completo corre en segundos con `generar.cmd`. |
| D6 | **Fuera** | Asimétrico; solo Gabo tiene Account Data. |

### A7 — DuckDB como motor principal (25 oct)
81 mil filas (~60 MB) caben en memoria: DuckDB lee los JSON y escribe silver en < 2 s, sin Docker. MinIO, Spark y ClickHouse siguen montados y probados (`jobs/smoke_test.py`) como ruta de escalado. A2/A3 quedan como diseño, no como camino crítico.

### A8 — Ventana común desde jul 2023 (25 oct)
Los datos continuos de Gabo empiezan el 14 jul 2023, no en enero (lo reveló la gráfica de cobertura con meses en cero). Constante `COMMON_WINDOW_START` en `pipeline/config.py`.

### A9 — Definiciones de métricas (25 oct)
- **Skip** = campo `skipped`: coincide en 97–98% con fwdbtn, backbtn y endplay.
- **Tiempo** = todo `ms_played`. **Canciones repetidas** = solo streams (≥ 30 s).
- **«Quién llegó primero»** = solo artistas que ambos empezaron a escuchar ≥ 3 meses después del inicio común, con más de 30 días de diferencia.

---

## Abiertas (histórico, 12 oct)

### D1 — Stack del frontend del dashboard

El requisito de "que no se vea vibecodeado" pesa más aquí que en cualquier otra parte.

| Opción | A favor | En contra |
|---|---|---|
| **FastAPI + Vite/Svelte + Observable Plot (recomendada)** | Control total del diseño; Observable Plot da gráficas editoriales con poco código y D3 está a mano para lo especial (calendario, bump chart); ClickHouse responde rápido así que el front se mantiene simple | Requiere tocar JS/TS; un poco más de setup |
| Streamlit | Lo más rápido; todo en Python | Es justamente el look genérico que se quiere evitar; interacción cruzada limitada |
| Dash (Plotly) | Python, callbacks para interacción | Look Plotly reconocible; hay que pelear el CSS |
| Evidence.dev | Reportes limpios desde SQL + Markdown | Más reporte que dashboard; menos libertad en interacción |
| Metabase / Superset | Cero código | Genérico por definición; ya se usó en clase (no suma) |

**Pendiente:** confirmar opción y nivel de comodidad de Javi con JS.

### D2 — ¿Local o desplegado?

- **Local (recomendado si se permite):** demo con el stack en Docker. Cero costo.
- **Desplegado:** ClickHouse + MinIO + Kafka en la nube no cabe en 13 días sin costo. Alternativa: exportar gold a Parquet y servir un dashboard estático con DuckDB-WASM (sin backend). El pipeline sigue siendo el mismo; solo cambia la capa de servicio.

### D3 — Enriquecimiento (géneros / atributos)

El export no trae géneros ni atributos de audio.

- **Spotify Web API:** `audio-features` y `recommendations` quedaron cerrados para apps nuevas (nov 2024) y el modo desarrollo ha seguido restringiéndose; verificar qué endpoints siguen disponibles antes de comprometerse.
- **Last.fm API (`artist.getTopTags`):** gratis, solo requiere API key; tags hechos por la comunidad (ruidosos pero útiles para "géneros" aproximados).
- **Ninguno:** el dataset ya da para muchos insights de comportamiento sin géneros.

Costo estimado: 1–1.5 días (caché local + rate limit + limpieza de tags). Recomendación: **solo si sobra tiempo después del hito del día 7**, con Last.fm.

### D4 — Kafka: ¿replay en tiempo real?

Los datos son históricos, así que Kafka no es necesario para el análisis. Para usarlo con sentido: **replay** del historial como si ocurriera en vivo (productor acelerado → topic → ClickHouse Kafka engine → vista "en vivo"). Demuestra la herramienta y queda bien en la demo, pero es stretch. Alternativa si la profesora exige Spark Streaming: consumir con Spark Structured Streaming en vez del Kafka engine.

### D5 — Airflow

Útil para mostrar orquestación (ingest → silver → gold → load) pero corre un batch que tarda segundos. Solo si la rúbrica lo pide.

### D6 — Account Data de Gabo (TAREA 2)

`TAREA 2/Spotify Data/` tiene el Account Data de Gabo (playlists, búsquedas, Wrapped, inferencias). Solo existe para Gabo → asimétrico. ¿Javi puede pedir el suyo (tarda días)? Si no, se deja fuera.

---

## Tomadas

### A1 — Arquitectura medallion en MinIO (bronze / silver / gold)
Raw intacto en bronze (reprocesable), silver limpio y tipado, gold modelado para consumo. Es el patrón de lakehouse visto en clase y hace que agregar otro usuario sea solo soltar su zip.

### A2 — ClickHouse como capa de servicio
OLAP columnar: agregaciones por tiempo/artista sobre todo el historial en milisegundos, lo que permite filtros dinámicos sin precálculo en el frontend. Lee Parquet directo de MinIO con `s3()`. Ya se usó en "DW y OLAP".

### A3 — Spark en contenedor, no local
PySpark en Windows requiere winutils/Hadoop y Java compatible; el contenedor `jupyter/pyspark-notebook:spark-3.5.0` (el mismo de clase) evita eso. Los jobs solo dependen de pyspark + stdlib.

### A4 — Python 3.12 en el entorno local
La máquina tiene 3.14, pero pyspark 3.5 y varias librerías aún no lo soportan bien. uv fija 3.12 vía `.python-version` y lo descarga solo.

### A5 — `confluent-kafka` en lugar de `kafka-python`
`kafka-python` 2.0.x falla en Python ≥ 3.12. `confluent-kafka` trae wheels para Windows.

### A6 — Honestidad sobre el volumen
~81k filas / ~60 MB no son "big data". Se defiende la arquitectura por **diseño escalable** (N usuarios, mismo pipeline) y por ser el objetivo del curso, no por necesidad del volumen actual. Decirlo así en la presentación suma credibilidad.

## Alcance — vistas candidatas e insights

Preguntas que el dashboard debe poder contestar (se priorizan después del EDA):

**Ritmo**
- ¿A qué horas y días escucha cada uno? ¿Cambió con los años (escuela, trabajo)?
- ¿Hay estacionalidad (vacaciones, fin de semestre)?

**Eras y gusto**
- ¿Qué artista dominó cada mes? ¿Cuánto dura una "era"?
- Concentración: ¿qué % del tiempo se lo llevan los top 10 artistas? Diversidad (entropía) por mes.

**Gusto compartido (Gabo vs Javi)**
- 250 artistas y 322 canciones en común (Jaccard de artistas ≈ 0.09). ¿Cuáles pesan más para ambos?
- ¿Quién descubrió primero a cada artista compartido y con cuánta diferencia?
- ¿Su afinidad sube o baja en el tiempo?

**Comportamiento**
- Skip rate por hora, plataforma, shuffle vs no shuffle. ¿Se skipea más de noche?
- ¿Cómo empiezan y terminan las reproducciones (`reason_start` / `reason_end`)?
- Canciones "inskipeables" vs "siempre skipeadas".

**Descubrimiento y lealtad**
- Artistas nuevos por mes. ¿Cuántos sobreviven a los 3 meses?
- "Obsesiones": canciones con picos intensos y cortos.

**Sesiones y contexto**
- Duración y tamaño típico de sesión.
- Viajes: Gabo tiene escuchas en GB, ES, CZ, DE, FR; Javi en US y BR.
- Escucha offline / incógnito.
