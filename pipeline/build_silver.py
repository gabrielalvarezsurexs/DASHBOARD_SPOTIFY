"""Raw JSON de Spotify → silver (un Parquet limpio con todas las reproducciones).

Uso: uv run python -m pipeline.build_silver

Aplica las reglas de docs/datos.md: hora local por país, regla de 30 s, sin ip_addr,
sin duplicados exactos. Es la versión DuckDB (host, sin Docker) del job de Spark.
"""

import duckdb
from rich.console import Console
from rich.table import Table

from pipeline.config import DATA_DIR, RAW_DIR, SILVER_PATH

# País de conexión → zona IANA. US y BR son aproximaciones (no hay ciudad en el export).
COUNTRY_TZ = {
    "MX": "America/Mexico_City",
    "US": "America/Chicago",
    "BR": "America/Sao_Paulo",
    "GB": "Europe/London",
    "ES": "Europe/Madrid",
    "FR": "Europe/Paris",
    "DE": "Europe/Berlin",
    "CZ": "Europe/Prague",
    "IT": "Europe/Rome",
}

SILVER_SQL = """
with raw as (
    select
        *,
        regexp_extract(replace(filename, '\\', '/'), '/raw/([^/]+)/', 1) as user_id
    from read_json(?, format = 'array', union_by_name = true, filename = true)
),
dedup as (
    select distinct on (user_id, ts, spotify_track_uri, spotify_episode_uri, ms_played) *
    from raw
),
typed as (
    select
        d.user_id,
        d.ts::timestamptz as ts_utc,
        d.ts::timestamptz - to_milliseconds(d.ms_played) as ts_start_utc,
        coalesce(tz.tz, 'America/Mexico_City') as tz,
        d.ms_played,
        d.conn_country as country,
        case
            when d.spotify_track_uri is not null then 'track'
            when d.spotify_episode_uri is not null then 'episode'
            when d.audiobook_uri is not null then 'audiobook'
            else 'unknown'
        end as content_type,
        d.master_metadata_track_name as track_name,
        d.master_metadata_album_artist_name as artist_name,
        d.master_metadata_album_album_name as album_name,
        d.spotify_track_uri as track_uri,
        d.episode_name,
        d.episode_show_name as show_name,
        d.spotify_episode_uri as episode_uri,
        d.reason_start,
        d.reason_end,
        coalesce(d.shuffle, false) as shuffle,
        coalesce(d.skipped, false) as is_skip,
        coalesce(d.offline, false) as offline,
        coalesce(d.incognito_mode, false) as incognito,
        case
            when lower(d.platform) like '%android%' then 'android'
            when lower(d.platform) like 'web_player%' then 'web'
            when lower(d.platform) like '%windows%' then 'windows'
            when lower(d.platform) like 'ios%' then 'ios'
            else 'other'
        end as platform_family
    from dedup d
    left join country_tz tz on tz.country = d.conn_country
)
select
    * exclude (tz),
    timezone(tz, ts_start_utc) as ts_local,
    ms_played >= 30000 as is_stream
from typed
order by user_id, ts_utc
"""


def build() -> duckdb.DuckDBPyConnection:
    con = duckdb.connect()
    # ts viene sin zona: si la sesión no está en UTC, DuckDB lo interpreta en la hora de la máquina.
    con.execute("set TimeZone = 'UTC'")
    con.execute("create table country_tz (country varchar, tz varchar)")
    con.executemany("insert into country_tz values (?, ?)", list(COUNTRY_TZ.items()))

    glob = (RAW_DIR / "*" / "*" / "Streaming_History_*.json").as_posix()
    con.execute(f"create table plays as {SILVER_SQL}", [glob])

    raw_rows = con.execute(
        "select count(*) from read_json(?, format = 'array', union_by_name = true)", [glob]
    ).fetchone()[0]
    SILVER_PATH.parent.mkdir(parents=True, exist_ok=True)
    con.execute(f"copy plays to '{SILVER_PATH.as_posix()}' (format parquet)")
    report(con, raw_rows)
    return con


def report(con: duckdb.DuckDBPyConnection, raw_rows: int) -> None:
    rows = con.execute(
        """
        select user_id, count(*), sum(is_stream::int), round(sum(ms_played) / 3.6e6, 1),
               min(ts_local)::date, max(ts_local)::date,
               count(*) filter (where country not in ('MX')),
               count(*) filter (where artist_name is null)
        from plays group by all order by 1
        """
    ).fetchall()
    table = Table(title=f"silver → {SILVER_PATH.relative_to(DATA_DIR.parent)}")
    for col in (
        "usuario",
        "filas",
        "streams ≥30 s",
        "horas",
        "desde",
        "hasta",
        "fuera de MX",
        "sin artista",
    ):
        table.add_column(col, justify="left" if col in ("usuario", "desde", "hasta") else "right")
    for r in rows:
        table.add_row(*[f"{v:,}" if isinstance(v, int) else str(v) for v in r])
    console = Console(width=max(Console().width, 110))
    console.print(table)
    silver_rows = sum(r[1] for r in rows)
    dupes = raw_rows - silver_rows
    console.print(f"raw: {raw_rows:,} · silver: {silver_rows:,} · duplicados quitados: {dupes:,}")
    cols = [c[0] for c in con.execute("describe plays").fetchall()]
    assert "ip_addr" not in cols, "ip_addr no debe llegar a silver"


if __name__ == "__main__":
    build()
