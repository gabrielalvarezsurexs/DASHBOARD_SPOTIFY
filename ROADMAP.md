# Roadmap

**Entregas reales** ([docs/requisitos.md](docs/requisitos.md)): informe ejecutivo **dom 25 oct 2026**, exposición **lun 26 / mar 27 oct 2026**. **Equipo:** Gabriel (G), Javier (J).

El plan original (12 oct) suponía 13 días de trabajo con FastAPI + ClickHouse + Kafka. Se retomó el 25 oct con el informe venciendo ese mismo día, así que el alcance se recortó a lo que califican los criterios: insights, dashboard (diseño e interactividad), selección de visualizaciones y storytelling. Las decisiones del plan anterior siguen documentadas en [docs/decisiones.md](docs/decisiones.md).

Leyenda: `[ ]` pendiente · `[x]` hecho · **(G)** Gabriel · **(J)** Javier · **(GJ)** ambos.

---

## Hoy · dom 25 oct — Informe ejecutivo (12 pts)

- [x] Instrucciones oficiales y bitácora en [docs/requisitos.md](docs/requisitos.md)
- [x] Silver con DuckDB (`pipeline/build_silver.py`): hora local, regla de 30 s, sin IP, sin duplicados
- [x] EDA: figuras que justificaron cada regla (`pipeline/eda_figures.py`)
- [x] Hallazgos calculados y verificados en la ventana común
- [x] Informe en Word con Montserrat embebida, todo en negro, sin rayas: `out/informe.docx` (fuente: `pipeline/informe_docx.py`)
- [x] Bitácora corta en PDF: `out/bitacora.pdf` (fuente: [docs/bitacora.md](docs/bitacora.md))
- [ ] **(GJ)** Leer el informe y la bitácora; corregir lo que no les suene propio (texto en `pipeline/informe_docx.py` y `docs/bitacora.md`) y regenerar con `generar.cmd`
- [ ] **(GJ)** Poner apellidos y matrícula en el encabezado si la plataforma lo pide
- [ ] **(G)** Subir `out/informe.docx` y `out/bitacora.pdf` antes de la hora límite

## Lun 26 / mar 27 oct — Exposición (8 pts)

- [x] Dashboard interactivo: [dashboard/web/index.html](dashboard/web/index.html): tarjetas de perfil, cara a cara con insights automáticos y 5 capítulos que responden las preguntas de la profesora
  - Filtros de persona (Gabriel / Javier / Ambos), periodo y «solo streams»; el estado se guarda en la URL
  - Titulares calculados con el filtro actual, tooltip en cada gráfica, «Ver tabla», ficha de artista al hacer clic, modo oscuro
- [x] Respaldo `out/dashboard.pdf` y capturas por capítulo en `out/capturas/` por si falla la computadora del salón
- [ ] **(GJ)** Ensayo de 7 min con [docs/guia-presentacion.md](docs/guia-presentacion.md) (guion, clics, cifras y preguntas probables)
- [ ] **(G)** Confirmar si las conexiones desde DE y US del 14 al 18 jul 2023 fueron un viaje
- [ ] **(GJ)** Probar el dashboard en la computadora donde se va a presentar (clonar el repo y abrir `dashboard/web/index.html`; funciona sin internet)
- [ ] **(G)** Crear el repo en GitHub y dar acceso a Javier y a la profesora

### Guion sugerido (storytelling)

1. **Gancho (30 s):** «Pedimos a Spotify todo lo que sabe de nuestra música: 81 mil reproducciones». Las dos tarjetas de perfil.
2. **00 Cara a cara:** la comparativa en 10 medidas y los insights; cambiar el periodo a 2025 para ver cómo se recalculan.
3. **01 Ritmo — ¿cuándo somos más activos?** Los heatmaps: rutina de Gabriel desde las 6 am; Javier de 17 a 21 h. Mostrar el filtro de persona.
4. **02 Lo más denso:** Bad Bunny y Alfa; clic en una barra → ficha del artista. Eras por trimestre.
5. **03 Lo que saltamos:** Gabriel salta más de noche y cuando *no* usa shuffle (hallazgo contraintuitivo).
6. **04 En común:** 205 artistas; Javier llega primero a 2 de cada 3.
7. **05 Contexto + privacidad:** el export revela viajes con fecha exacta y lo escuchado en modo incógnito. Cierre con la reflexión de privacidad.
8. **Cómo lo hicimos (30 s):** pipeline raw → silver → dashboard; cada regla salió del EDA.

## Si sobra tiempo (no prometido)

- [ ] Job de Spark equivalente a `build_silver.py` corriendo sobre MinIO, para mostrar la ruta de escalado
- [ ] Cargar silver en ClickHouse y una consulta en vivo durante la exposición
- [ ] Auditoría completa con la checklist de [docs/buenas-practicas.md](docs/buenas-practicas.md): 320 px y simulador de daltonismo

---

## Registro de cambios de alcance

| Fecha | Cambio | Impacto |
|---|---|---|
| 2026-10-25 | Auditoría: script que recalcula cada cifra del informe (66/66), documentación técnica, guía de presentación y auditoría del dashboard | Se corrigieron 8 afirmaciones del informe y 15 hallazgos del dashboard (ver `docs/tecnico.md` §9.2 y `docs/auditoria-dashboard.md`). Canción = nombre + artista; mes incompleto punteado; insights con «Para decidir». |
| 2026-10-25 | Informe en .docx (Montserrat, todo en negro), bitácora en PDF aparte, nombres completos y datos derivados en el repo | `pipeline/informe_docx.py`, `pipeline/bitacora_pdf.py`; `data.js`, figuras y `out/` dejan de estar en `.gitignore`. |
| 2026-10-25 | Instrucciones oficiales: informe 25 oct, exposición 26–27 oct, bitácora obligatoria, no se exigen herramientas específicas | Se recortó el stack a DuckDB + dashboard estático (decisiones D1–D5, A7). Fases de ClickHouse/Kafka/Airflow fuera. |
