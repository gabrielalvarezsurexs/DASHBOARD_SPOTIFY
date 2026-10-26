"""Configuración central leída de variables de entorno (.env)."""

from dataclasses import dataclass
from os import getenv
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"


@dataclass(frozen=True)
class MinioSettings:
    endpoint: str = getenv("MINIO_ENDPOINT", "http://localhost:9000")
    access_key: str = getenv("MINIO_ROOT_USER", "minioadmin")
    secret_key: str = getenv("MINIO_ROOT_PASSWORD", "minioadmin123")
    bucket_bronze: str = getenv("MINIO_BUCKET_BRONZE", "bronze")
    bucket_silver: str = getenv("MINIO_BUCKET_SILVER", "silver")
    bucket_gold: str = getenv("MINIO_BUCKET_GOLD", "gold")


@dataclass(frozen=True)
class ClickHouseSettings:
    host: str = getenv("CLICKHOUSE_HOST", "localhost")
    port: int = int(getenv("CLICKHOUSE_PORT", "8123"))
    user: str = getenv("CLICKHOUSE_USER", "spotify")
    password: str = getenv("CLICKHOUSE_PASSWORD", "spotify123")
    database: str = getenv("CLICKHOUSE_DB", "spotify")


@dataclass(frozen=True)
class KafkaSettings:
    bootstrap_servers: str = getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")
    topic_plays: str = getenv("KAFKA_TOPIC_PLAYS", "spotify.plays")
    replay_speedup: float = float(getenv("REPLAY_SPEEDUP", "3600"))


DEFAULT_TZ = getenv("DEFAULT_TZ", "America/Mexico_City")

# Desde aquí hay datos continuos de ambos (Gabo empieza el 14 jul 2023). Ver docs/bitacora.md.
COMMON_WINDOW_START = "2023-07-01"
SILVER_PATH = DATA_DIR / "silver" / "plays.parquet"

minio = MinioSettings()
clickhouse = ClickHouseSettings()
kafka = KafkaSettings()


def raw_users() -> list[str]:
    """Usuarios disponibles = subcarpetas de data/raw/."""
    if not RAW_DIR.exists():
        return []
    return sorted(p.name for p in RAW_DIR.iterdir() if p.is_dir())
