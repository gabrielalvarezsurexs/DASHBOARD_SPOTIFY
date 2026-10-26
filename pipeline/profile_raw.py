"""Perfil rápido de data/raw con DuckDB, sin levantar Docker.

Sirve para validar que el entorno funciona y que los zips quedaron bien colocados.

    uv run python -m pipeline.profile_raw
"""

import duckdb
from rich.console import Console
from rich.table import Table

from pipeline.config import RAW_DIR, raw_users

QUERY = """
WITH plays AS (
    SELECT
        regexp_extract(replace(filename, '\\', '/'), '/raw/([^/]+)/', 1) AS user_id,
        *
    FROM read_json(?, format = 'array', union_by_name = true, filename = true)
)
SELECT
    user_id,
    count(*)                                              AS filas,
    min(ts)::DATE                                         AS desde,
    max(ts)::DATE                                         AS hasta,
    round(sum(ms_played) / 3.6e6, 1)                      AS horas,
    count(*) FILTER (WHERE ms_played >= 30000)            AS streams,
    count(DISTINCT spotify_track_uri)                     AS canciones,
    count(DISTINCT master_metadata_album_artist_name)     AS artistas,
    round(avg(skipped::INT) * 100, 1)                     AS pct_skipped
FROM plays
GROUP BY user_id
ORDER BY user_id
"""


def main() -> None:
    # Ancho mínimo para que la tabla no se trunque cuando la salida no es una terminal.
    console = Console(width=max(Console().width, 110))
    users = raw_users()
    if not users:
        console.print(f"[red]No hay carpetas en {RAW_DIR}. Ver data/README.md[/red]")
        raise SystemExit(1)

    pattern = (RAW_DIR / "*" / "*" / "Streaming_History_*.json").as_posix()
    rows = duckdb.execute(QUERY, [pattern]).fetchall()
    columns = [
        "usuario",
        "filas",
        "desde",
        "hasta",
        "horas",
        "streams ≥30s",
        "canciones",
        "artistas",
        "% skipped",
    ]

    table = Table(title="Extended Streaming History — data/raw")
    for col in columns:
        table.add_column(col, justify="left" if col == "usuario" else "right")
    for row in rows:
        table.add_row(*(f"{v:,}" if isinstance(v, int) else str(v) for v in row))
    console.print(table)


if __name__ == "__main__":
    main()
