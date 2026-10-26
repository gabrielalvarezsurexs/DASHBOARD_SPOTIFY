@echo off
rem Regenera todo desde data\zips: silver, figuras, dashboard y out\ (informe.docx, bitacora.pdf, dashboard.pdf).
rem No necesita Docker. Solo uv y Edge o Chrome.
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
uv run python -m pipeline.generar || (pause & exit /b 1)
start "" "%~dp0dashboard\web\index.html"
if "%~1"=="" pause
