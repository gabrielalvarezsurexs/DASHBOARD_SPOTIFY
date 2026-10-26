# Cómo escuchamos: dashboard de Spotify de Gabriel y Javier

Proyecto final de Big Data. Un dashboard interactivo sobre el **Extended Streaming History** de Spotify de los dos integrantes del equipo (81,418 reproducciones). Responde cuándo somos más activos, cuáles son nuestras interacciones más densas y cuáles las menos, y compara a los dos cara a cara.

## Ver el dashboard

**Abre [`dashboard/web/index.html`](dashboard/web/index.html) con doble clic.** No necesita servidor, internet ni instalar nada: los datos (sin IP), las librerías y la fuente vienen dentro de la carpeta.

Filtros: persona (Ambos, Gabriel, Javier), periodo (ventana común, cada año o todo el historial) y solo streams. Los filtros quedan en la URL, así que un corte se puede compartir con el enlace.

| Capítulo | Pregunta |
|---|---|
| Perfiles | Una tarjeta por integrante con sus cifras principales |
| 00 Cara a cara | Comparativa en 10 medidas e insights que se recalculan con cada filtro, cada uno con la decisión que apoyaría |
| 01 Ritmo | ¿Cuándo somos más activos? (hora × día, horas por mes) |
| 02 Lo más denso | Artistas, canciones, eras por trimestre y ficha de cualquier artista |
| 03 Lo que saltamos | ¿Cuáles son nuestras interacciones menos densas? (skips por hora y modo) |
| 04 En común | Artistas compartidos y quién llegó primero |
| 05 Contexto | Viajes, dispositivos y podcasts |

## Entregables

| Qué | Dónde |
|---|---|
| Informe ejecutivo (Word, 5 págs.) | [`out/informe.docx`](out/informe.docx) |
| Bitácora (PDF) | [`out/bitacora.pdf`](out/bitacora.pdf), fuente en [`docs/bitacora.md`](docs/bitacora.md) |
| Dashboard interactivo | [`dashboard/web/index.html`](dashboard/web/index.html) |
| Dashboard en PDF y capturas | [`out/dashboard.pdf`](out/dashboard.pdf), `out/capturas/` |
| Guía para presentar | [`docs/guia-presentacion.md`](docs/guia-presentacion.md) |
| Documentación técnica (para auditar el informe) | [`docs/tecnico.md`](docs/tecnico.md) |
| Auditoría de cifras (66 de 66 OK) y del dashboard | [`docs/auditoria-cifras.md`](docs/auditoria-cifras.md), [`docs/auditoria-dashboard.md`](docs/auditoria-dashboard.md) |

## Regenerar todo (un comando)

Requisitos: [uv](https://docs.astral.sh/uv/) (instala Python 3.12 solo) y Microsoft Edge o Chrome (para los PDF y capturas).

1. Pon los zips de Spotify en `data/zips/` con el nombre `my_spotify_data_<persona>.zip`. Los zips no están en el repo porque traen la IP de cada reproducción.
2. Doble clic en **`generar.cmd`** (o `uv run python -m pipeline.generar`).

En unos 15 segundos descomprime los zips, arma la tabla limpia, las figuras, los datos del dashboard, el informe, la bitácora y el PDF del dashboard, recalcula cada cifra del informe contra los datos (falla si alguna no cuadra) y abre el dashboard.

```
data/zips ─► data/raw/<persona>/*.json ─DuckDB─► data/silver/plays.parquet ─┬─► dashboard/web/data.js ─► dashboard (Observable Plot)
                                                                           ├─► informe/fig ─► out/informe.docx
                                                                           └─► out/dashboard.pdf
docs/bitacora.md ─► out/bitacora.pdf
```

La infraestructura del curso (MinIO, Spark, ClickHouse y Kafka en Docker, con `levantar.cmd`) está montada y probada como ruta de escalado. Con 81 mil filas no hace falta para el análisis (ver [docs/decisiones.md](docs/decisiones.md), A7).

## Estructura

```
├── dashboard/web/   index.html, app.js, styles.css, data.js, vendor/ (d3, Plot), fonts/ (Montserrat)
├── pipeline/        build_silver, eda_figures, export_dashboard, informe_docx, auditoria, bitacora_pdf, print_pdf, generar
├── informe/         figuras del informe y la fuente Montserrat (OFL) que se embebe en el .docx
├── out/             entregables generados
├── docs/            requisitos, bitácora, decisiones, datos, diseño
├── jobs/, clickhouse/, docker-compose.yml, levantar.ps1   ruta de escalado (opcional)
├── data/            zips y datos crudos (no se suben)
└── tests/
```

## Documentación

- [docs/tecnico.md](docs/tecnico.md): cómo se calcula cada número, paso por paso
- [docs/guia-presentacion.md](docs/guia-presentacion.md): guion y uso del dashboard para la exposición
- [docs/auditoria-dashboard.md](docs/auditoria-dashboard.md): auditoría de datos, diseño y funcionalidad
- [docs/requisitos.md](docs/requisitos.md): lo que pidió la profesora
- [docs/bitacora.md](docs/bitacora.md): obstáculos, dudas, decisiones y aprendizajes
- [docs/decisiones.md](docs/decisiones.md): decisiones tomadas y su porqué
- [docs/datos.md](docs/datos.md): diccionario, reglas de limpieza y métricas
- [docs/design.md](docs/design.md) y [docs/buenas-practicas.md](docs/buenas-practicas.md): sistema visual y reglas de visualización

## Privacidad

Los exports de Spotify incluyen la IP de cada reproducción. `data/` y los zips están en `.gitignore`, y la IP se elimina en el primer paso del pipeline. Lo que sí se publica (la tabla del dashboard, las figuras y los entregables) contiene el historial de escucha, países de conexión y fechas; los dos integrantes aceptamos publicarlo.

Fuente: Montserrat, de Julieta Ulanovsky, bajo SIL Open Font License (`informe/fonts/OFL.txt`).
