<#
.SYNOPSIS
    Levanta todo el proyecto de golpe.

.DESCRIPTION
    1. Verifica uv (lo instala si falta) y Docker Desktop (lo enciende si está apagado).
    2. Crea .env si no existe y sincroniza el entorno Python.
    3. Descomprime los zips de data/zips/ en data/raw/<usuario>/ (solo los nuevos).
    4. Libera los puertos si los ocupan contenedores de otras tareas (los detiene, no los borra).
    5. docker compose up y espera a que cada servicio responda.

.EXAMPLE
    .\levantar.ps1                 # core: MinIO, ClickHouse, Spark/Jupyter
    .\levantar.ps1 -Streaming      # + Kafka y Kafka UI
    .\levantar.ps1 -Explore        # + Metabase
    .\levantar.ps1 -Todo           # todo lo anterior
    .\levantar.ps1 -Bajar          # detiene todo (los datos de MinIO/ClickHouse se conservan)
#>
param(
    [switch]$Streaming,
    [switch]$Explore,
    [switch]$Todo,
    [switch]$Bajar
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$env:PYTHONIOENCODING = "utf-8"
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
Set-Location -LiteralPath $PSScriptRoot

function Paso($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    [ok] $msg" -ForegroundColor Green }
function Aviso($msg){ Write-Host "    [!]  $msg" -ForegroundColor Yellow }
function Falla($msg){ Write-Host "`n[x] $msg" -ForegroundColor Red; exit 1 }

function Test-Docker {
    $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
    docker info *> $null
    $ok = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = $prev
    return $ok
}

function Wait-Url($nombre, $url, $segundos) {
    $limite = (Get-Date).AddSeconds($segundos)
    while ((Get-Date) -lt $limite) {
        try {
            Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 | Out-Null
            Ok "$nombre responde"
            return
        } catch {
            # 401/403 también significa que el servicio está arriba
            if ($_.Exception.Response) { Ok "$nombre responde"; return }
            Start-Sleep -Seconds 2
        }
    }
    Falla "$nombre no respondió en $segundos s. Revisa: docker compose logs"
}

# ── Perfiles ─────────────────────────────────────────────────────
$perfiles = @()
if ($Streaming -or $Todo) { $perfiles += "--profile", "streaming" }
if ($Explore -or $Todo)   { $perfiles += "--profile", "explore" }

# ── Bajar ────────────────────────────────────────────────────────
if ($Bajar) {
    Paso "Deteniendo el stack"
    if (-not (Test-Docker)) { Ok "Docker no está corriendo; nada que detener"; exit 0 }
    docker compose --profile streaming --profile explore down
    Ok "Stack detenido (volúmenes conservados)"
    exit 0
}

# ── 1. uv ────────────────────────────────────────────────────────
Paso "Revisando uv"
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Aviso "uv no está instalado; instalándolo (instalador oficial de Astral)"
    Invoke-RestMethod https://astral.sh/uv/install.ps1 | Invoke-Expression
    $env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
    if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { Falla "No se pudo instalar uv. Ver https://docs.astral.sh/uv/" }
}
Ok (uv --version)

# ── 2. Docker Desktop ────────────────────────────────────────────
Paso "Revisando Docker"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Falla "Docker no está instalado. Instala Docker Desktop: https://www.docker.com/products/docker-desktop/"
}
if (-not (Test-Docker)) {
    $exe = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path $exe)) { Falla "No encontré Docker Desktop en $exe. Ábrelo a mano y vuelve a correr el script." }
    Aviso "Docker Desktop está apagado; encendiéndolo (puede tardar ~1 min)"
    Start-Process $exe
    $limite = (Get-Date).AddSeconds(180)
    while (-not (Test-Docker)) {
        if ((Get-Date) -gt $limite) { Falla "Docker no arrancó en 3 min. Ábrelo a mano y vuelve a correr el script." }
        Start-Sleep -Seconds 3
    }
}
Ok "Docker corriendo"

# ── 3. Entorno Python ────────────────────────────────────────────
Paso "Entorno Python"
if (-not (Test-Path .env)) { Copy-Item .env.example .env; Ok ".env creado desde .env.example" } else { Ok ".env ya existe" }
uv sync --quiet
if ($LASTEXITCODE -ne 0) { Falla "uv sync falló" }
Ok "Dependencias sincronizadas"

# ── 4. Datos ─────────────────────────────────────────────────────
Paso "Datos (data/zips -> data/raw)"
New-Item -ItemType Directory -Force data\zips, data\raw | Out-Null
foreach ($zip in Get-ChildItem data\zips -Filter *.zip) {
    # my_spotify_data_<usuario>.zip -> <usuario>; cualquier otro nombre -> nombre del archivo
    $usuario = ($zip.BaseName -replace '^my_spotify_data_', '').ToLower() -replace '[^a-z0-9_-]', '_'
    $destino = Join-Path "data\raw" $usuario
    $yaEsta = (Test-Path $destino) -and (Get-ChildItem $destino -Recurse -Filter "Streaming_History_*.json" | Select-Object -First 1)
    if ($yaEsta) { Ok "$usuario ya descomprimido"; continue }
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destino -Force
    Ok "$usuario descomprimido desde $($zip.Name)"
}
if (-not (Get-ChildItem data\raw -Directory)) {
    Aviso "No hay datos. Pon tu zip de Spotify en data\zips\ (ej. my_spotify_data_<tu_nombre>.zip) y vuelve a correr."
} else {
    uv run python -m pipeline.profile_raw
}

# ── 5. Puertos ───────────────────────────────────────────────────
Paso "Revisando puertos"
$puertos = @(9000, 9001, 8888, 4040, 8123, 9010)
if ($Streaming -or $Todo) { $puertos += 9094, 8080 }
if ($Explore -or $Todo)   { $puertos += 3001 }

$detenidos = @()
# Sin comillas dentro del template: PowerShell 5.1 se las come al pasarlo a docker.exe
$lineas = docker ps --format '{{.ID}}|{{.Names}}|{{.Ports}}|{{.Labels}}'
foreach ($linea in $lineas) {
    $id, $nombre, $ports, $labels = $linea -split '\|', 4
    if ($labels -match 'com\.docker\.compose\.project=spotify(,|$)') { continue }
    $choca = $puertos | Where-Object { $ports -match ":$_->" }
    if ($choca) {
        docker stop $id | Out-Null
        $detenidos += "$nombre (puerto $($choca -join ', '))"
    }
}
if ($detenidos) {
    foreach ($d in $detenidos) { Aviso "Detuve el contenedor de otra tarea: $d" }
    Aviso "Se reanudan con: docker start <nombre>"
}

$ocupados = foreach ($p in $puertos) {
    $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue |
        Where-Object { (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName -notmatch 'docker|wslrelay|vpnkit' }
    if ($c) { "$p ($((Get-Process -Id $c[0].OwningProcess).ProcessName))" }
}
# Solo cuentan los que no son del propio stack
$propios = docker compose ps --format '{{.Ports}}' 2>$null
$ocupados = $ocupados | Where-Object { $p = ($_ -split ' ')[0]; -not ($propios -match ":$p->") }
if ($ocupados) { Falla "Puertos ocupados por otros programas: $($ocupados -join ', '). Ciérralos y vuelve a correr." }
Ok "Puertos libres"

# ── 6. Stack ─────────────────────────────────────────────────────
Paso "Levantando contenedores (la primera vez descarga imágenes, puede tardar)"
docker compose @perfiles up -d
if ($LASTEXITCODE -ne 0) { Falla "docker compose up falló. Revisa el mensaje de arriba." }

Paso "Esperando servicios"
Wait-Url "MinIO"      "http://localhost:9000/minio/health/live" 120
Wait-Url "ClickHouse" "http://localhost:8123/ping"              120
Wait-Url "Jupyter"    "http://localhost:8888/api"               180
if ($Streaming -or $Todo) { Wait-Url "Kafka UI" "http://localhost:8080" 180 }
if ($Explore -or $Todo)   { Wait-Url "Metabase" "http://localhost:3001/api/health" 300 }

# Buckets: minio-init es de una sola ejecución; confirmar que terminó bien
$limite = (Get-Date).AddSeconds(60)
do {
    $estado = docker compose ps -a minio-init --format '{{.State}}|{{.ExitCode}}'
    if ($estado -match '^exited\|0') { break }
    if ($estado -match '^exited') { Falla "minio-init falló: docker compose logs minio-init" }
    Start-Sleep -Seconds 2
} while ((Get-Date) -lt $limite)
Ok "Buckets bronze / silver / gold listos"

# ── Listo ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Todo arriba." -ForegroundColor Green
Write-Host "  MinIO consola   http://localhost:9001   (minioadmin / minioadmin123)"
Write-Host "  JupyterLab      http://localhost:8888"
Write-Host "  ClickHouse      http://localhost:8123/play   (spotify / spotify123)"
if ($Streaming -or $Todo) { Write-Host "  Kafka UI        http://localhost:8080" }
if ($Explore -or $Todo)   { Write-Host "  Metabase        http://localhost:3001" }
Write-Host ""
Write-Host "Para detener:  .\levantar.ps1 -Bajar"
