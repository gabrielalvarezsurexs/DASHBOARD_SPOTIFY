# Bitácora de desarrollo

Proyecto: dashboard del historial extendido de Spotify de Gabriel y Javier. Big Data, octubre de 2026. Cada entrada indica quién la registró: **G** (Gabriel), **J** (Javier) o **GJ** (ambos).

## a) Obstáculos encontrados

| Fecha | Quién | Obstáculo | Cómo lo resolvimos |
|---|---|---|---|
| 12 oct | G | El export viene en varios JSON por persona, mezclados con archivos de video y un PDF. | Leímos solo `Streaming_History_*.json` con unión por nombre de columna; la persona sale del nombre de la carpeta. |
| 12 oct | G | Montar el stack del curso (MinIO, Spark, ClickHouse, Kafka) en Windows: imágenes que no existían, puertos ocupados y pyspark que solo corre con `spark-submit`. | Un script (`levantar.ps1`) que libera puertos, espera a cada servicio y se puede repetir. |
| 25 oct | G | Las horas salían corridas. `ts` está en UTC y marca el fin de la reproducción, y DuckDB lo leía con la zona de la computadora. | Fijamos la sesión en UTC, calculamos el inicio (`ts` menos `ms_played`) y convertimos con la zona del país de conexión. |
| 25 oct | G | La gráfica por mes unía 2017 con 2023 y escondía un hueco de años. | Rellenamos los meses vacíos con cero: los datos continuos de Gabriel empiezan el 14 jul 2023, no en enero. |
| 25 oct | G | Al auditar el informe contra los datos, 8 afirmaciones no cuadraban (por ejemplo, podcasts «en italiano» que eran en inglés, y una canción contada por partes). | Un script (`pipeline/auditoria.py`) recalcula cada cifra y busca su cita en el .docx; corregimos el texto hasta quedar en 66 de 66. |
| 25 oct | GJ | Retomamos el proyecto el mismo día de la entrega del informe. | Recortamos alcance a lo que se califica (insights, dashboard y narrativa) y dejamos Spark y ClickHouse como ruta de escalado. |

## b) Dudas que surgieron

| Duda | Respuesta a la que llegamos |
|---|---|
| ¿`ts` es el inicio o el fin? | El fin, en UTC (lo dice el ReadMe del export). |
| ¿Qué cuenta como escuchar una canción? | 30 s o más, como Spotify. El histograma de duración muestra dos grupos que esa regla separa. |
| ¿Skip es `skipped` o `reason_end = fwdbtn`? | `skipped`: vale 97 a 98% en los botones de saltar y 0% en el resto. |
| ¿Cómo comparamos historiales de distinto largo y volumen? | Con una ventana común (desde jul 2023) y en porcentaje del tiempo propio. |
| ¿Es justo decir quién llegó primero a un artista? | Solo contando artistas que ambos empezaron después del inicio común y con más de 30 días de diferencia. Aun así lo reportamos con su sesgo. |

## c) Decisiones tomadas y su justificación

| Decisión | Por qué |
|---|---|
| Eliminar la IP en el primer paso | Es dato personal y no responde ninguna pregunta. |
| DuckDB como motor principal en vez de Spark y ClickHouse | 81 mil filas (unos 60 MB) se procesan en menos de 2 s en una laptop. Elegir la herramienta por el volumen real es más honesto que forzar un cluster. |
| Verde y negro como Spotify, con un color fijo por persona (Gabriel verde, Javier blanco en tema oscuro y negro en claro) | La persona se reconoce igual en todas las gráficas y no cambia al filtrar; el verde contra blanco o negro se distingue por luminosidad, también con daltonismo. |
| Heatmaps separados, cada uno en % del tiempo propio | En una escala absoluta, el volumen de Gabriel taparía el patrón de Javier. |
| Barras y líneas; sin pasteles | Longitud y posición se comparan mejor que los ángulos. |
| Dashboard estático (HTML con los datos embebidos) | Se abre con doble clic en la computadora del salón, sin servidor ni Docker. |
| Una canción = nombre + artista, no su URI | La versión single y la del álbum tienen URIs distintas; contarlas aparte partía el conteo (498 canciones). |
| El último mes se marca como incompleto | Los datos terminan a media mes; sin marcarlo parecía una caída. |

## d) Aprendizajes obtenidos

- La mayor parte del trabajo fue entender el export, no graficar. Cada regla de limpieza salió de una gráfica exploratoria.
- Las fechas son la trampa principal: UTC contra hora local, inicio contra fin y la zona por defecto de la herramienta.
- Una línea sin los meses vacíos miente; rellenar con ceros reveló el problema de cobertura.
- Comparar personas exige una ventana común y medidas relativas; si no, gana quien tiene más datos.
- Un texto escrito a mano se desfasa de los datos: verificar cada cifra con un script encontró errores que una lectura no vio.
- Un export de música revela viajes con fecha, la rutina diaria y hasta lo que se escuchó en modo privado.
- Las mismas preguntas (cuándo, qué tan denso, qué tan poco) sirven para cualquier red social; solo cambia la unidad de interacción.
