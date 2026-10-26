@echo off
rem Doble clic o: levantar.cmd [-Streaming] [-Explore] [-Todo] [-Bajar]
rem Llama a levantar.ps1 sin depender de la politica de ejecucion de PowerShell.
where pwsh >nul 2>nul
if %errorlevel%==0 (
    pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0levantar.ps1" %*
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0levantar.ps1" %*
)
if "%~1"=="" pause
