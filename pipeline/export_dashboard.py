"""Silver → dashboard/web/data.js (tabla columnar compacta que el dashboard filtra en el navegador).

Uso: uv run python -m pipeline.export_dashboard

Se escribe como `window.SPOTIFY = {...}` y no como .json para que el HTML funcione abierto con
doble clic (file://), donde fetch() está bloqueado. No incluye ip_addr (silver ya no la tiene).
"""

import json

import duckdb

from pipeline.config import COMMON_WINDOW_START, ROOT, SILVER_PATH

OUT = ROOT / "dashboard" / "web" / "data.js"

# Bits de la columna `f`
STREAM, SKIP, SHUFFLE, EPISODE, INCOGNITO, OFFLINE = 1, 2, 4, 8, 16, 32


def export() -> None:
    con = duckdb.connect()
    con.execute("set TimeZone = 'UTC'")
    con.execute(f"create view p as select * from '{SILVER_PATH.as_posix()}'")

    users = [r[0] for r in con.execute("select distinct user_id from p order by 1").fetchall()]
    artists = [
        r[0]
        for r in con.execute(
            """
            select artist_name from p where artist_name is not null
            group by 1 order by count(*) desc
            """
        ).fetchall()
    ]
    # Una canción = nombre + artista, no URI: la versión single y la del álbum tienen URIs
    # distintas (498 canciones en la ventana) y contarlas aparte parte en dos el conteo.
    tracks = con.execute(
        """
        select track_name, artist_name from p
        where track_uri is not null and track_name is not null
        group by 1, 2 order by count(*) desc
        """
    ).fetchall()
    shows = [
        r[0]
        for r in con.execute(
            "select show_name from p where show_name is not null group by 1 order by count(*) desc"
        ).fetchall()
    ]
    platforms = [
        r[0] for r in con.execute("select distinct platform_family from p order by 1").fetchall()
    ]
    countries = [r[0] for r in con.execute("select distinct country from p order by 1").fetchall()]

    a_idx = {a: i for i, a in enumerate(artists)}
    t_idx = {t: i for i, t in enumerate(tracks)}
    s_idx = {s: i for i, s in enumerate(shows)}

    rows = con.execute(
        f"""
        select user_id,
               -- minutos desde 1970 en hora local (el reloj local se guarda como si fuera UTC)
               (epoch(ts_local) // 60)::bigint m,
               round(ms_played / 1000)::int s,
               artist_name, track_name, show_name,
               (is_stream::int * {STREAM}) + (is_skip::int * {SKIP}) + (shuffle::int * {SHUFFLE})
                 + ((content_type = 'episode')::int * {EPISODE}) + (incognito::int * {INCOGNITO})
                 + (offline::int * {OFFLINE}) f,
               platform_family, country
        from p order by user_id, ts_local
        """
    ).fetchall()

    cols = {k: [] for k in ("u", "m", "s", "a", "k", "w", "f", "p", "c")}
    u_idx = {u: i for i, u in enumerate(users)}
    p_idx = {p: i for i, p in enumerate(platforms)}
    c_idx = {c: i for i, c in enumerate(countries)}
    for user, m, s, artist, track, show, f, plat, country in rows:
        cols["u"].append(u_idx[user])
        cols["m"].append(m)
        cols["s"].append(s)
        cols["a"].append(a_idx.get(artist, -1))
        cols["k"].append(t_idx.get((track, artist), -1))
        cols["w"].append(s_idx.get(show, -1))
        cols["f"].append(f)
        cols["p"].append(p_idx[plat])
        cols["c"].append(c_idx[country])

    payload = {
        "generated": con.execute("select strftime(now(), '%Y-%m-%d')").fetchone()[0],
        "window_start": COMMON_WINDOW_START,
        "users": users,
        "artists": artists,
        "tracks": [[name, a_idx.get(artist, -1)] for name, artist in tracks],
        "shows": shows,
        "platforms": platforms,
        "countries": countries,
        "bits": {
            "stream": STREAM,
            "skip": SKIP,
            "shuffle": SHUFFLE,
            "episode": EPISODE,
            "incognito": INCOGNITO,
            "offline": OFFLINE,
        },
        "rows": cols,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(f"window.SPOTIFY={text};\n", encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(rows):,} filas, {OUT.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    export()
