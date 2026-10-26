# Datos

## Fuente

Spotify **Extended Streaming History** (Ajustes de privacidad → "Descargar tus datos" → historial extendido). Un archivo `Streaming_History_Audio_<año>[_n].json` por bloque, más `Streaming_History_Video_*.json` y el `ReadMeFirst_ExtendedStreamingHistory.pdf` oficial (en cada carpeta de `data/raw/<usuario>/`). Ambos exports tienen exactamente el mismo esquema.

## Perfil inicial (12 oct 2026, solo archivos `Streaming_History_*`)

| | Gabo | Javi |
|---|---|---|
| Filas | 61,428 | 20,001 |
| Rango | 2017-09-02 → 2026-08-25 | 2020-09-29 → 2026-08-03 |
| Horas (todo `ms_played`) | 2,840.8 | 948.7 |
| Canciones únicas | 5,611 | 3,974 |
| Artistas únicos | 1,667 | 1,381 |
| Reproducciones < 30 s | 10,219 (16.6%) | 2,508 (12.5%) |
| Episodios de podcast | 58 | 239 |
| Plataforma principal | android (93%) | windows (73%) |
| Shuffle | 85% | 60% |
| `skipped = true` | 21% | 14% |
| Países | MX, GB, ES, CZ, DE, FR… | MX, US, BR |
| Incógnito | 2,073 | 0 |

Filas por año — Gabo: 2017: 20 · 2023: 5,397 · 2024: 14,629 · 2025: 26,657 · 2026: 14,725.
Javi: 2020: 600 · 2021: 162 · 2022: 1,147 · 2023: 6,143 · 2024: 5,718 · 2025: 2,667 · 2026: 3,564.

Compartido: **250 artistas** (Jaccard 0.089) y **322 canciones**.

## Diccionario (campos crudos)

| Campo | Tipo | Significado / notas |
|---|---|---|
| `ts` | string ISO-8601 UTC | **Momento en que terminó** la reproducción |
| `platform` | string | Dispositivo. Valores heterogéneos (`android`, `windows`, `iOS 10.3.3 (iPad6,8,1)`, `Android OS 9 API 28 (Xiaomi…)`) → normalizar a `platform_family` |
| `ms_played` | int | Milisegundos reproducidos |
| `conn_country` | string ISO-2 | País de conexión |
| `ip_addr` | string | **PII — se elimina en silver** |
| `master_metadata_track_name` | string | Nombre de la canción (null si es episodio/audiolibro) |
| `master_metadata_album_artist_name` | string | Artista principal del álbum (no hay ID de artista) |
| `master_metadata_album_album_name` | string | Álbum |
| `spotify_track_uri` | string | `spotify:track:<id>` — llave de canción |
| `episode_name`, `episode_show_name`, `spotify_episode_uri` | string | Podcasts |
| `audiobook_title`, `audiobook_uri`, `audiobook_chapter_uri`, `audiobook_chapter_title` | string | Audiolibros (sin filas en estos exports) |
| `reason_start` | string | Por qué empezó: `trackdone`, `fwdbtn`, `clickrow`, `appload`, `playbtn`, `backbtn`, `remote`… |
| `reason_end` | string | Por qué terminó: `trackdone`, `fwdbtn`, `endplay`, `logout`, `backbtn`, `unexpected-exit`… |
| `shuffle` | bool | Modo aleatorio activo |
| `skipped` | bool | Spotify la marcó como saltada |
| `offline` | bool | Reproducción sin conexión |
| `offline_timestamp` | int (epoch s) | Momento offline (verificar en EDA: aparece también con `offline = false`) |
| `incognito_mode` | bool | Sesión privada |

## Reglas de negocio (silver)

| Columna derivada | Regla |
|---|---|
| `user_id` | Nombre de la carpeta en `data/raw/<usuario>/` |
| `ts_utc` | `ts` parseado como timestamp UTC |
| `ts_start_utc` | `ts_utc - ms_played` |
| `ts_local` | `ts_start_utc` convertido con la zona del país (`MX → America/Mexico_City`, `GB → Europe/London`, `ES → Europe/Madrid`, `US → America/Chicago` como aproximación…). México no tiene horario de verano desde oct 2022: usar zonas IANA, nunca offsets fijos |
| `content_type` | `track` si hay `spotify_track_uri`, `episode` si hay `spotify_episode_uri`, `audiobook` si hay `audiobook_uri`, si no `unknown` |
| `is_stream` | `ms_played >= 30000` |
| `is_skip` | `skipped = true` **o** `reason_end in ('fwdbtn')` — validar en EDA cuál definición es más consistente y documentar la elegida |
| `platform_family` | `android` / `windows` / `ios` / `web` / `other` |
| dedupe | Eliminar duplicados exactos por (`user_id`, `ts`, `spotify_track_uri`/`spotify_episode_uri`, `ms_played`) |

## Modelo gold (borrador)

- **`fact_plays`** — grano: una reproducción. `user_id, ts_utc, ts_local, date_local, hour_local, dow_local, track_uri, episode_uri, artist_name, track_name, album_name, content_type, ms_played, is_stream, is_skip, shuffle, reason_start, reason_end, platform_family, country, offline, incognito, session_id`
- **`dim_track`** — `track_uri, track_name, artist_name, album_name, est_duration_ms` (mediana de `ms_played` con `reason_end = 'trackdone'`)
- **`dim_artist`** — `artist_name` (+ `tags` si D3 se aprueba)
- **`dim_date`** — calendario con día de semana, semana ISO, mes, semestre escolar
- **`sessions`** — `user_id, session_id, start, end, n_plays, minutes`; nueva sesión si pasan > 30 min entre fin de una y comienzo de la siguiente
- **`artist_first_listen`** — `user_id, artist_name, first_stream_ts`; base para descubrimiento y "quién llegó primero"

ClickHouse: `fact_plays` como `MergeTree` `PARTITION BY toYYYYMM(date_local)` `ORDER BY (user_id, ts_utc)`.

## Métricas (glosario)

Cada métrica debe tener su query de referencia en `clickhouse/queries/` y usarse igual en todas las vistas.

| Métrica | Definición |
|---|---|
| Minutos escuchados | `sum(ms_played) / 60000` (todas las reproducciones) |
| Streams | `count()` con `is_stream` |
| Skip rate | `countIf(is_skip) / count()` sobre `content_type = 'track'` |
| Tasa de finalización | `countIf(reason_end = 'trackdone') / count()` |
| Concentración top-N | minutos de los N artistas principales / minutos totales |
| Diversidad | entropía de Shannon normalizada sobre minutos por artista en la ventana |
| Artistas nuevos | artistas cuyo `first_stream_ts` cae en el periodo |
| Retención de artista | % de artistas nuevos en el mes M con ≥ 1 stream en M+3 |
| Afinidad Gabo–Javi | Jaccard ponderado por minutos sobre artistas en la ventana |
