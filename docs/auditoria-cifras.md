# Auditoría de cifras del informe

Generado por `uv run python -m pipeline.auditoria` (también corre dentro de `generar.cmd`). No editar a mano. Método en [tecnico.md](tecnico.md) §9.

- **Cita**: texto literal que se busca en `out/informe.docx`.
- **Esperado**: el valor que afirma la cita, con el redondeo del informe.
- **Calculado**: el mismo valor recalculado desde `data/silver/plays.parquet`.
- **OK**: la cita está en el informe y el valor calculado es idéntico.

Ventana común: desde 2023-07-01. Resultado: **66 de 66 OK**.

| ID | § | Afirmación | Cita en el informe | Esperado | Calculado | Estado |
|---|---|---|---|---|---|---|
| A01 | 1, 2 | Reproducciones en silver | 81,418 reproducciones | 81,418 | 81,418 | OK |
| A02 | 2 | Reproducciones de Gabriel | Gabriel aporta 61,422 reproducciones | 61,422 | 61,422 | OK |
| A03 | 2 | Reproducciones de Javier | Javier 19,996 | 19,996 | 19,996 | OK |
| A04 | 2 | Duplicados exactos eliminados | Se quitan 11 duplicados | 11 | 11 | OK |
| A05 | 2 | Campos por reproducción en el export | 23 campos | 23 | 23 | OK |
| A06 | 5 | Reproducciones con IP en el export (≈81 mil) | Son 81 mil puntos | 81,429 | 81,429 | OK |
| A07 | 5 | Silver no tiene columna de IP | La eliminamos en el primer paso | 0 | 0 | OK |
| B01 | 1 | Horas, Gabriel | 2,841 | 2,841 | 2,841 | OK |
| B02 | 1 | Horas, Javier | 713 | 713 | 713 | OK |
| B03 | 1 | Gabriel escucha unas 4 veces más horas | unas 4 veces más horas | 4.0 | 4.0 | OK |
| B04 | 1 | Días con escucha, Gabriel | 95% (1,087 días) | 95% (1,087 días) | 95% (1,087 días) | OK |
| B05 | 1 | Días con escucha, Javier | 49% (546 días) | 49% (546 días) | 49% (546 días) | OK |
| B06 | 1 | Mediana por día con escucha, Gabriel | 139 min | 139 min | 139 min | OK |
| B07 | 1 | Mediana por día con escucha, Javier | 63 min | 63 min | 63 min | OK |
| B08 | 1 | Hora pico, Gabriel | 14 h (y otro a las 6 h) | 14 | 14 | OK |
| B09 | 1 | Hora pico, Javier | 18 h | 18 | 18 | OK |
| B10 | 1 | Segundo pico de Gabriel a las 6 h (% del tiempo a las 6 h) | y otro a las 6 h | 6.7% | 6.7% | OK |
| B11 | 1 | Artistas distintos, Gabriel | 1,662 | 1,662 | 1,662 | OK |
| B12 | 1 | Artistas distintos, Javier | 1,058 | 1,058 | 1,058 | OK |
| B13 | 1 | Peso de sus 10 artistas principales, Gabriel | 21% del tiempo | 21% | 21% | OK |
| B14 | 1 | Peso de sus 10 artistas principales, Javier | 28% del tiempo | 28% | 28% | OK |
| B15 | 1 | Canciones saltadas, Gabriel | 21% | 21% | 21% | OK |
| B16 | 1 | Canciones saltadas, Javier | 15% | 15% | 15% | OK |
| B17 | 1, 3 | Dispositivo principal, Gabriel | Android (92%) | Android 92% | Android 92% | OK |
| B18 | 1, 3 | Dispositivo principal, Javier | Windows (70%) | Windows 70% | Windows 70% | OK |
| B19 | 1 | Tiempo en podcasts, Gabriel | 0.1% | 0.1% | 0.1% | OK |
| B20 | 1 | Tiempo en podcasts, Javier | 5.2% | 5.2% | 5.2% | OK |
| C01 | 1 | Javier: tiempo entre 17 y 21 h | concentra el 40% de su tiempo entre las 17 y las 21 h | 40% | 40% | OK |
| C02 | 1 | Javier: tiempo de madrugada (0 a 6 h) | (0.4%) | 0.4% | 0.4% | OK |
| C03 | 1 | Gabriel: horas por mes en 2023 | unas 42 horas al mes en 2023 | 42 | 42 | OK |
| C04 | 1 | Gabriel: horas por mes en 2025 | a 104 en 2025 | 104 | 104 | OK |
| C05 | 1 | Javier: horas por mes en 2025 | bajó a 10 horas al mes en 2025 | 10 | 10 | OK |
| C06 | 1 | Bad Bunny, nº 1 de Gabriel: trimestres seguidos | seis trimestres seguidos | 6 | 6 | OK |
| C07 | 1 | Alfa, nº 1 de Javier en los últimos 9 trimestres | 8 de los últimos 9 trimestres | 8 | 8 | OK |
| C08 | 1, 3 | Compartidos / Gabriel llegó primero / Javier llegó primero | Javier llegó primero a 55 y Gabriel a 27 | 205 / 27 / 55 | 205 / 27 / 55 | OK |
| D01 | 3 | Gabriel: fin de semana, % del tiempo | (20% del tiempo contra el 29% esperado) | 20% | 20% | OK |
| D02 | 3 | Javier: celda más fuerte del heatmap | el domingo a las 18 h | dom 18 h | dom 18 h | OK |
| D03 | 3 | Día récord, Gabriel | 8.8 horas el 4 de diciembre de 2025 | 8.8 h, 2025-12-04 | 8.8 h, 2025-12-04 | OK |
| D04 | 3 | Día récord, Javier | (6 horas) fue el 2 de junio de 2026 | 6.0 h, 2026-06-02 | 6.0 h, 2026-06-02 | OK |
| D05 | 3 | Streams de «BAILE INoLVIDABLE» (Gabriel) | con 412 streams | 412 | 412 | OK |
| D06 | 3 | Bad Bunny, % del tiempo de Gabriel en música | Bad Bunny ocupa el 6.2% | 6.2% | 6.2% | OK |
| D07 | 3 | Streams de «Tu No» (Javier) | «Tu No», 70 | 70 | 70 | OK |
| D08 | 3 | Streams de «CI SARÒ» (Javier) | «CI SARÒ», 74 streams | 74 | 74 | OK |
| D09 | 3 | Alfa, % del tiempo de Javier en música | ocupa el 5.3% de su tiempo | 5.3% | 5.3% | OK |
| D10 | 3 | Podcast principal de Javier (francés) en horas | francés (23 horas) | 23 | 23 | OK |
| D18 | 3 | Canción más repetida de Gabriel (nombre + artista) | «BAILE INoLVIDABLE» de Bad Bunny | BAILE INoLVIDABLE (412) | BAILE INoLVIDABLE (412) | OK |
| D19 | 3 | Canción más repetida de Javier (nombre + artista) | repite a Alfa («CI SARÒ» | CI SARÒ (74) | CI SARÒ (74) | OK |
| D11 | 3 | Gabriel: skips de noche (18 a 24 h) | salta el 27% de las canciones de noche | 27% | 27% | OK |
| D12 | 3 | Gabriel: skips en la mañana (6 a 12 h) | y el 16% en la mañana | 16% | 16% | OK |
| D13 | 3 | Gabriel: skips sin shuffle | (31% contra 19%) | 31% | 31% | OK |
| D14 | 3 | Gabriel: skips con shuffle | (31% contra 19%) | 19% | 19% | OK |
| D15 | 3 | Javier: skips por bloque del día (alrededor del 15%) | alrededor del 15% | 13 a 16% | 13 a 16% | OK |
| D16 | 3 | Artistas compartidos: % del tiempo de Gabriel | el 41% del tiempo de Gabriel | 41% | 41% | OK |
| D17 | 3 | Artistas compartidos: % del tiempo de Javier | el 42% del de Javier | 42% | 42% | OK |
| E01 | 4 | Inicio de los datos continuos de Gabriel | 14 de julio de 2023 | 2023-07-14 | 2023-07-14 | OK |
| E02 | 4 | Horas Gabriel / Javier en todo 2023 (ventana desde enero) | (0.9 a 1) | 0.9 | 0.9 | OK |
| E03 | 4 | Horas Gabriel / Javier en jul a dic 2023 | Gabriel escuchó el doble | 2.0 | 2.0 | OK |
| E06 | 3 | Último dato (Figura 2 omite agosto de 2026) | terminan el 3 (Javier) y el 25 (Gabriel) | gabo 2026-08-25, javi 2026-08-03 | gabo 2026-08-25, javi 2026-08-03 | OK |
| E07 | 3 | Inicio del historial continuo de Javier (primer mes de una racha sin huecos con 50 reproducciones o más al mes) | empieza en noviembre de 2022, ocho meses antes | 2022-11 | 2022-11 | OK |
| E04 | 4 | Canciones de Gabriel saltadas en 0 a 5 s | (10% de las reproducciones de | 10% | 10% | OK |
| E05 | 4 | % skipped en fwdbtn / backbtn / endplay / trackdone | vale 97 a 98% | 97 / 98 / 98 / 0 | 97 / 98 / 98 / 0 | OK |
| F01 | 5 | Viaje de Gabriel (países y fechas) | España, Reino Unido, Francia, Chequia, Alemania e Italia entre el 18 de junio y el 9 de julio de 2025 | ES,GB,FR,CZ,DE,IT 2025-06-18 a 2025-07-09 | ES,GB,FR,CZ,DE,IT 2025-06-18 a 2025-07-09 | OK |
| F02 | 5 | Javier conectado desde Estados Unidos | entre el 30 de marzo y el 2 de junio de 2026 | US 2026-03-30 a 2026-06-02 | US 2026-03-30 a 2026-06-02 | OK |
| F03 | 5 | Reproducciones de Gabriel en incógnito | Las 2,073 reproducciones | 2,073 | 2,073 | OK |
| F04 | 5 | Primera reproducción en incógnito | desde noviembre de 2024 | 2024-11 | 2024-11 | OK |
| G01 | dashboard | data.js contiene todas las filas y las mismas horas | (dashboard) | 81,418 filas; diferencia de horas: gabo 0.0000%, javi 0.0000% | 81,418 filas; diferencia de horas: gabo 0.0026%, javi 0.0003% | OK |
