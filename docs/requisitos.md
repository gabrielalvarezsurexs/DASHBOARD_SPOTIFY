# Requisitos

> Fuente de verdad del alcance. Si algo en el roadmap o en CLAUDE.md contradice este archivo, gana este archivo.

## Fechas

| Qué | Cuándo | Vale |
|---|---|---|
| **Entregable 1** — Informe ejecutivo (PDF, 3–5 páginas) | **dom 25 oct 2026** (hora por confirmar) | 12 pts |
| **Entregable 2** — Exposición en clase del dashboard y hallazgos | **lun 26 / mar 27 oct 2026** | 8 pts |
| Bitácora de obstáculos, dudas y decisiones | durante el desarrollo; se entrega con el informe o como sección de la presentación | — |

La actividad completa vale 10% ("Presentación DASHBOARDS 10%").

## Instrucciones de la profesora (texto original)

### 1. Presentación DASHBOARDS (PDF de la plataforma)

> La presentación del DASHBOARD es sobre los hallazgos, insights más relevantes de su actividad digital en la red social que eligieron. Debe incluir solo el dashboard. Debe presentar a los dos participantes en el mismo dashboard ya sea con un toggle entre usuarios, un tab diferente por usuario, un mismo dashboard con comparativos… lo que se les ocurra. Las preguntas que responde el dashboard son las mismas independientemente de la red social. "Cuando soy mas activo", "cuales son mis interacciones mas densas" "cuales las menos" ... etc no importa la red social, ya que en instagram por ejemplo se traduce en likes, posts o comentarios. En spotify en reproducciones de musica o podcasts, en reddit comentarios, en tik tok visualizaciones, likes y comments. NO NECESITAN HABER ELEGIDO LA MISMA RED SOCIAL para presentar los hábitos y conductas en la red que eligieron, sino que deben saber como presentar los datos independientemente de la red social.
>
> **Dashboard e Insights de la red social que prefieras.**
>
> **Entregable 1: Informe Ejecutivo (PDF, 3-5 páginas) (Se entrega el 25 de Octubre):**
> - Resumen ejecutivo
> - Metodología
> - Principales hallazgos
> - Visualizaciones clave (cuando explorabas los datos qué visualizaciones del EDA te sirvieron para preparar los datos)
> - Reflexiones sobre privacidad digital
> - Conclusiones y aprendizajes
>
> **12 pts**
>
> **Entregable 2: Exposición en clase del Dashboard y los hallazgos principales. (Se presenta el 26 y 27 Octubre) Criterios de evaluación**
> 1. Calidad y Profundidad de los Insights
> 2. Diseño y/o Interactividad del Dashboard
> 3. Efectividad y Selección de Visualizaciones
> 4. Storytelling y Comunicación de Hallazgos
>
> **8 pts**

La entrega es en la plataforma: cuadro de texto + archivos (máx. 2,560 MB).

### 2. Bitácora (punto 8 de las instrucciones)

> **8. Diario de Obstáculos, Dudas y Decisiones (bitácora de desarrollo)**
>
> Durante el desarrollo del proyecto, quiero que mantengas una bitácora estructurada donde registres:
>
> **a) Obstáculos encontrados** — Describe cualquier problema técnico, conceptual o metodológico que enfrentes, por ejemplo: dificultades para interpretar el dump de Instagram o Spotify; problemas con formatos de fecha, zonas horarias o JSON anidados; dudas sobre cómo limpiar o unificar datos; confusión sobre qué métricas son relevantes; retos al aplicar modelos de ML o interpretar resultados.
>
> **b) Dudas que surgieron** — Registra las preguntas que te hiciste mientras avanzabas, como: "¿Qué significa realmente esta columna en el dump?", "¿Cómo decido qué features son útiles para clustering?", "¿Qué hago con datos faltantes o inconsistentes?", "¿Cómo sé si mi modelo está funcionando bien?"
>
> **c) Decisiones tomadas y su justificación** — Explica por qué elegiste un camino y no otro: por qué elegiste cierto modelo, por qué descartaste una métrica, por qué limpiaste datos de cierta forma, por qué decidiste agrupar por semana y no por día, por qué elegiste cierto tipo de visualización.
>
> **d) Aprendizajes obtenidos** — Reflexiona sobre lo que descubriste: nuevas habilidades técnicas, nuevas formas de interpretar tus hábitos digitales, cambios en tu percepción sobre tu propio uso de redes o música, conexiones entre datos de Instagram y Spotify.
>
> **Formato sugerido:** un documento, un cuaderno de Jupyter, un archivo Markdown, un audio o una sección dentro de tu presentación final. Lo importante es que sea honesta, clara y útil para tu propio proceso de aprendizaje.

## Lo que entendemos

- **Lo que se califica son los hallazgos**, no la infraestructura. Los 4 criterios de la exposición son insights, diseño/interactividad, selección de visualizaciones y storytelling. Ningún criterio pide Spark, Kafka ni otra herramienta específica.
- **Los dos en el mismo dashboard.** Elegimos "mismo dashboard con comparativos" más un selector de persona (Gabriel / Javier / ambos).
- **Las preguntas son genéricas de cualquier red social.** El dashboard debe contestar, para cada persona:
  - ¿Cuándo soy más activo? (hora, día, mes, año)
  - ¿Cuáles son mis interacciones más densas? (artistas, canciones, podcasts, sesiones largas)
  - ¿Cuáles las menos? (skips, lo que abandono, horas muertas)
  - …y cómo cambia eso en el tiempo y entre nosotros.
- **"Debe incluir solo el dashboard"**: la exposición se hace con el dashboard, sin diapositivas aparte. El storytelling vive dentro del dashboard (titulares que dicen el hallazgo, orden de capítulos).
- **Visualizaciones del EDA** en el informe: las gráficas exploratorias que nos ayudaron a limpiar (distribución de `ms_played`, regla de 30 s, huecos de fechas, zonas horarias), no las del dashboard final.
- La bitácora se escribe en Markdown ([bitacora.md](bitacora.md)) y se entrega como PDF aparte, corta.

## Entregables (lo que vamos a subir)

1. `out/informe.docx`: informe ejecutivo en Word, 3 a 5 páginas (hoy). Formato pedido por el equipo: Montserrat, todo en negro, títulos discretos, sin rayas (em dash).
2. `out/bitacora.pdf`: bitácora corta, aparte.
3. Dashboard: HTML estático que se abre con doble clic, más `out/dashboard.pdf` con capturas como respaldo.
4. Repositorio en GitHub con el pipeline, el dashboard y sus datos (sin IP). Los zips crudos no se suben.

## Preguntas abiertas para la profesora

- [x] Hora exacta de entrega del informe del 25 de octubre: unas 3 horas después de retomar (lo dijo Gabriel).
- [ ] ¿Qué día presentamos, el 26 o el 27? ¿Cuántos minutos?
- [x] ¿La bitácora se sube aparte? Sí, como PDF corto (decisión del equipo).
- [ ] ¿Quiere el link al repositorio en la entrega?

## Changelog de requisitos

| Fecha | Qué cambió | Fuente (clase, correo, etc.) |
|---|---|---|
| 2026-10-12 | Planteamiento inicial | Gabriel |
| 2026-10-25 | Instrucciones oficiales (PDF "Presentación DASHBOARDS 10%") y punto 8, bitácora. Informe hoy, exposición 26–27 oct. No se exigen herramientas específicas. | Plataforma del curso, vía Gabriel |
| 2026-10-25 | Informe en Word (Montserrat, negro, sin rayas), bitácora en PDF aparte, se pueden mostrar datos personales (viajes, fechas) | Gabriel |
