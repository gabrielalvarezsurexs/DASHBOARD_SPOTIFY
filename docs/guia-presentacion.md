# Guía para presentar el dashboard

Para Gabriel y Javier. Qué presentar, en qué orden, qué clics hacer y qué responder. La presentación es **solo con el dashboard**: no hay diapositivas.

---

## 1. Antes de la clase

- [ ] Clonar el repo en la computadora donde se va a presentar y abrir `dashboard/web/index.html` con doble clic. No necesita internet ni instalar nada.
- [ ] Probar los filtros y un clic en una barra. Abre en modo oscuro; si el proyector se ve deslavado, usar modo claro.
- [ ] Zoom del navegador al 90–100% para que quepan los dos heatmaps lado a lado.
- [ ] Tener a mano `out/dashboard.pdf` (respaldo, una página por capítulo) por si falla la computadora.
- [ ] Ensayar una vez con cronómetro (ver §3).
- [ ] **Gabriel:** confirmar si del 14 al 18 jul 2023 estuvo en Alemania. El capítulo 05 muestra conexiones desde DE y US en esos días. Si no fue un viaje, decir que son conexiones raras del inicio del historial.
- [ ] **Javier:** decidir cómo contar la estancia en Estados Unidos (30 mar a 2 jun 2026) y Brasil (13 jun y 14 jul 2026). Los datos lo muestran y aceptamos publicarlo.

---

## 2. Cómo se usa el dashboard

| Control | Dónde | Qué hace |
|---|---|---|
| **Ambos / Gabriel / Javier** | Barra fija de arriba | Cambia todo a una persona o a la comparación |
| **Periodo** | Barra | Ventana común (por defecto, desde jul 2023), un año, o todo el historial (con huecos) |
| **Solo streams (≥ 30 s)** | Barra | Quita las reproducciones de menos de 30 s. Skips y canciones repetidas no cambian, a propósito. |
| **00 a 05** | Barra | Saltan a cada capítulo |
| **Modo claro / oscuro** | Barra | El dashboard abre en oscuro (estilo Spotify); el claro sirve si el proyector se ve deslavado |
| **Pasar el mouse** | Cualquier gráfica | Muestra el valor exacto |
| **Ver tabla** | Debajo de cada gráfica | Los números exactos |
| **Clic en una barra de artista** | Capítulos 02 y 04 | Abre la **ficha del artista**: horas por mes de cada uno, desde cuándo lo escucha y sus canciones |
| **Ficha de artista** | Capítulo 02 | También se puede escribir el nombre; «Quitar» la cierra |

Todos los titulares, tarjetas e insights se recalculan con el filtro: lo que dicen siempre corresponde a lo que se ve.

La URL guarda los filtros. Algunos atajos (pegar al final de la dirección del archivo):

| Atajo | Muestra |
|---|---|
| `#p=both&t=window` | Estado inicial |
| `#p=both&t=2025` | Solo 2025 |
| `#p=javi&t=window` | Solo Javier |
| `#p=both&t=window&a=Sebastian%20Yatra` | Ficha de Sebastian Yatra abierta |

---

## 3. Guion (unos 7 minutos)

El reparto es una sugerencia; cámbienlo si quieren. Cada bloque dice **qué mostrar**, **qué decir** y **qué clic hacer**.

### 0:00 · Gancho · Gabriel

- **Mostrar:** el encabezado con las dos tarjetas.
- **Decir:** «Le pedimos a Spotify todo lo que sabe de nuestra música: 81 mil reproducciones. Estas son nuestras dos fichas: yo escucho 2,841 horas, el 95% de los días; Javier 713 horas, la mitad de los días. Mismo servicio, dos formas opuestas de usarlo.»

### 0:45 · 00 Cara a cara · Gabriel

- **Mostrar:** la comparativa de 10 medidas y los insights.
- **Decir:**
  - «Cada fila tiene su escala y en negritas va quién está arriba.»
  - «Yo gano en volumen y en variedad: 1,662 artistas. Javier es más fiel: sus 10 artistas son el 28% de su tiempo, contra el 21% mío.»
  - «Cada insight trae una línea de *Para decidir*: si fuéramos Spotify, a Javier hay que reactivarlo y llegarle a las 18 h en la computadora; a mí, en el teléfono.»
- **Clic:** cambiar el periodo a **2025**. «En 2025 la diferencia se dispara: unas 10 veces, porque Javier bajó a 10 horas al mes.» Regresar a **Ventana común**.

### 2:00 · 01 Ritmo: ¿cuándo somos más activos? · Javier

- **Mostrar:** los dos heatmaps.
- **Decir:**
  - «Gabriel escucha todo el día hábil, desde las 6 de la mañana.»
  - «Yo escucho casi solo de 17 a 21 h: es el 40% de mi tiempo. De madrugada, casi nada (0.4%).»
  - «Mi celda más fuerte es el domingo a las 18 h.»
- **Mostrar:** la línea de horas por mes.
  - «Gabriel pasó de unas 42 horas al mes en 2023 a 104 en 2025.»
  - «Yo caí a 10 en 2025 y mi récord fue mayo de 2026: la banda gris es mi estancia en Estados Unidos.»
  - «El final punteado es agosto incompleto, no una caída.»

### 3:15 · 02 Lo más denso: interacciones más intensas · Javier

- **Mostrar:** el top 10 de artistas de cada uno.
- **Decir:** «El de Gabriel es Bad Bunny, 6.2% de su tiempo y 412 streams de *BAILE INoLVIDABLE*. El mío es Alfa, un cantante italiano: nº 1 en 8 de los últimos 9 trimestres.»
- **Mostrar:** la tabla de **Eras**: «Gabriel cambiaba de artista cada trimestre hasta el primero de 2025; desde el segundo, siempre es Bad Bunny.»

### 4:15 · 03 Lo que saltamos: interacciones menos densas · Gabriel

- **Mostrar:** la línea de % saltadas por hora y las barras de shuffle.
- **Decir:**
  - «Lo menos denso son los skips. Yo salto el 27% de noche y el 16% en la mañana.»
  - «Lo contraintuitivo: salto más cuando **yo** elijo qué escuchar (31%) que en shuffle (19%). Las recomendaciones me aciertan más que mi propia búsqueda.»
  - «Javier salta alrededor del 15% siempre.»

### 5:00 · 04 En común · Gabriel

- **Mostrar:** las barras divergentes.
- **Decir:**
  - «Compartimos 205 artistas: son el 41% de mi tiempo y el 42% del de Javier.»
  - «De los que los dos descubrimos dentro de la ventana, Javier llegó primero a 55 y yo a 27.»
- **Clic:** en la barra de **Sebastian Yatra** se abre la ficha. «En la ventana, Javier lo escucha desde julio de 2023; yo, desde octubre de 2024.»

### 5:45 · 05 Contexto y privacidad · Javier

- **Mostrar:** los puntos de días fuera de México.
- **Decir:**
  - «Quitamos la IP en el primer paso, y aun así el país de conexión dice dónde estuvimos y cuándo: el viaje de Gabriel a Europa en junio de 2025 y mi estancia en Estados Unidos, con fecha exacta.»
  - «Gabriel tiene 2,073 reproducciones en modo incógnito, y aparecen completas en el export: privado no significa no registrado.»

### 6:30 · Cierre · los dos

- **Decir:** «Cómo lo hicimos: zips de Spotify, limpieza con DuckDB (hora local por país, regla de 30 s, sin IP), un dashboard que se abre con doble clic y una auditoría que recalcula cada cifra del informe. Todo se regenera con un comando.»
- **Frase final sugerida:** «Para Gabriel la música es el fondo del día; para Javier, un momento de la tarde. Los datos lo dicen solos.»

**Versión corta (4 min):** gancho, cara a cara, ritmo, privacidad.

---

## 4. Cifras para tener en la cabeza

Todas son de la ventana común (jul 2023 a ago 2026) y coinciden con el informe.

| | Gabriel | Javier |
|---|---|---|
| Horas | 2,841 | 713 |
| Días con escucha | 95% | 49% |
| Minutos por día con escucha (mediana) | 139 | 63 |
| Hora pico | 14 h (y 6 h) | 18 h |
| Artistas distintos | 1,662 | 1,058 |
| Peso de sus 10 artistas principales | 21% | 28% |
| Canciones saltadas | 21% | 15% |
| Dispositivo | Android 92% | Windows 70% |
| Podcasts | 0.1% | 5.2% |
| Artista nº 1 | Bad Bunny | Alfa |
| Canción más repetida | BAILE INoLVIDABLE (412) | CI SARÒ (74) |
| Día récord | 8.8 h, 4 dic 2025 | 6.0 h, 2 jun 2026 |

En común: 205 artistas. Quién llegó primero: Javier 55, Gabriel 27.

---

## 5. Preguntas probables

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué no usaron Spark? | Son 81 mil filas: DuckDB lo hace en menos de 2 segundos en una laptop. El stack del curso (MinIO, Spark, ClickHouse, Kafka) quedó montado como ruta de escalado. Elegimos la herramienta por el volumen real. |
| ¿Por qué la ventana empieza en julio de 2023? | Es cuando los dos tenemos datos continuos. Con enero, Javier parecía escuchar más que Gabriel en 2023, solo porque Gabriel no tenía datos esos meses. |
| ¿Qué es un stream? | Una reproducción de 30 s o más, la regla de Spotify. El histograma de duración muestra que separa bien los saltos al instante de las canciones completas. |
| ¿La hora es de México? | Es la hora local del país desde donde se conectó cada reproducción. El dato viene en UTC y marca el **fin** de la canción; calculamos el inicio y lo convertimos. |
| ¿Cómo saben que los números están bien? | Un script recalcula desde los datos las 66 cifras del informe y comprueba que cada una esté escrita igual en el documento: 66 de 66. Está en el repo (`docs/auditoria-cifras.md`). |
| ¿Por qué no hay gráficas de pastel? | La longitud y la posición se comparan mejor que los ángulos. Todas las comparaciones son barras, líneas o heatmaps. |
| ¿Por qué cada heatmap tiene su escala? | Con una escala común, el volumen de Gabriel taparía el patrón de Javier. Comparamos en % del tiempo de cada uno. |
| ¿«Quién llegó primero» es justo? | Solo cuenta artistas que los dos empezamos después de oct 2023, con más de 30 días de diferencia. Aun así tiene un sesgo: el historial de Javier empieza antes. |
| ¿Qué harían con más tiempo? | Correr el mismo pipeline en Spark sobre MinIO, sumar más personas y agrupar perfiles de escucha. |

---

## 6. Si algo falla

| Problema | Qué hacer |
|---|---|
| La página sale en blanco o con un error arriba | Revisar que la carpeta `dashboard/web/` esté completa (`data.js`, `vendor/`, `fonts/`). Si no se arregla, presentar con `out/dashboard.pdf`. |
| Se ve chica o grande | Ctrl + / Ctrl − en el navegador |
| Se quedó un filtro raro | Borrar todo lo que va después de `#` en la dirección y recargar |
| Hay que cambiar una cifra del informe | Editar `pipeline/informe_docx.py`, correr `generar.cmd` y revisar que la auditoría siga en 66 de 66 |
