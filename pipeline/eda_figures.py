"""Figuras del EDA para el informe: las gráficas que justificaron cada regla de limpieza.

Uso: uv run python -m pipeline.eda_figures   (requiere data/silver/plays.parquet)
Salida: informe/fig/*.png (gitignored)
"""

import duckdb
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import polars as pl  # noqa: E402
from matplotlib import font_manager  # noqa: E402

from pipeline.config import COMMON_WINDOW_START as W  # noqa: E402
from pipeline.config import ROOT, SILVER_PATH  # noqa: E402

FIG_DIR = ROOT / "informe" / "fig"

# Tokens de docs/design.md (modo claro, sobre papel blanco para imprimir)
INK, INK2, INK3, RULE = "#1b1a17", "#57534a", "#6f6a60", "#e4dfd3"
COLOR = {"gabo": "#179443", "javi": "#191414"}  # verde y negro, como el dashboard
NAME = {"gabo": "Gabriel", "javi": "Javier"}

# Misma fuente que el informe (Montserrat, OFL, en informe/fonts)
for _ttf in (ROOT / "informe" / "fonts").glob("Montserrat-*.ttf"):
    font_manager.fontManager.addfont(str(_ttf))

plt.rcParams.update(
    {
        "font.family": ["Montserrat", "Segoe UI", "DejaVu Sans"],
        "font.size": 8.5,
        "text.color": INK,
        "axes.labelcolor": INK2,
        "axes.edgecolor": RULE,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.grid": True,
        "axes.axisbelow": True,
        "grid.color": RULE,
        "grid.linewidth": 0.6,
        "xtick.color": INK3,
        "ytick.color": INK3,
        "xtick.major.size": 0,
        "ytick.major.size": 0,
        "legend.frameon": False,
        "figure.dpi": 200,
        "savefig.bbox": "tight",
    }
)


def con() -> duckdb.DuckDBPyConnection:
    c = duckdb.connect()
    c.execute("set TimeZone = 'UTC'")
    c.execute(f"create view p as select * from '{SILVER_PATH.as_posix()}'")
    c.execute(f"create view pw as select * from p where ts_local >= '{W}'")  # ventana común
    return c


def title(ax, text: str, sub: str = "") -> None:
    if not sub:
        ax.set_title(text, loc="left", fontsize=9.5, fontweight="semibold", color=INK)
        return
    ax.set_title(f"{text}\n", loc="left", fontsize=10.5, fontweight="semibold", color=INK)
    ax.text(0, 1.02, sub, transform=ax.transAxes, fontsize=8.5, color=INK2, va="bottom")


# Las 4 del EDA van en una cuadrícula 2×2 del informe: tamaño de media página, texto a 1:1
HALF = (3.4, 2.3)


def fig_duration(c) -> None:
    """Distribución de ms_played: justifica la regla de 30 s."""
    df = c.sql(
        "select user_id, least(ms_played / 1000, 420)::int s from p where content_type = 'track'"
    ).pl()
    fig, ax = plt.subplots(figsize=HALF)
    bins = list(range(0, 421, 5))
    for u in ("gabo", "javi"):
        s = df.filter(df["user_id"] == u)["s"].to_list()
        w = [100 / len(s)] * len(s)
        ax.hist(s, bins=bins, weights=w, histtype="step", lw=1.3, color=COLOR[u], label=NAME[u])
    ax.axvline(30, color=INK, lw=0.9)
    ax.text(36, ax.get_ylim()[1] * 0.95, "30 s = stream", fontsize=7.5, color=INK, va="top")
    ax.set_xlabel("segundos reproducidos (tope 7 min)")
    ax.set_ylabel("% de reproducciones")
    ax.legend(loc="center right")
    title(ax, "Dos grupos: saltadas al instante y completas")
    fig.savefig(FIG_DIR / "eda_duracion.png")


def fig_coverage(c) -> None:
    """Reproducciones por mes en todo el historial: justifica la ventana común."""
    # Meses sin datos en 0: si no, la línea une 2017 con 2023 y esconde el hueco
    df = c.sql(
        """
        with months as (
            select unnest(generate_series(date '2017-09-01', date '2026-08-01', interval 1 month)) m
        ), users as (select distinct user_id from p),
        n as (select user_id, date_trunc('month', ts_local) m, count(*) n from p group by 1, 2)
        select u.user_id, m.m, coalesce(n.n, 0) n
        from users u cross join months m left join n on n.user_id = u.user_id and n.m = m.m
        order by m.m
        """
    ).pl()
    fig, ax = plt.subplots(figsize=HALF)
    for u in ("gabo", "javi"):
        d = df.filter(df["user_id"] == u)
        ax.plot(d["m"].to_list(), d["n"].to_list(), lw=1.2, color=COLOR[u], label=NAME[u])
    ax.axvspan(*matplotlib.dates.datestr2num([W, "2026-09-01"]), color=RULE, alpha=0.6, lw=0)
    ax.text(
        matplotlib.dates.datestr2num("2023-08-01"),
        ax.get_ylim()[1] * 0.97,
        "ventana\ncomún",
        fontsize=7.5,
        color=INK2,
        va="top",
    )
    ax.xaxis.set_major_locator(matplotlib.dates.YearLocator(2))
    ax.xaxis.set_major_formatter(matplotlib.dates.DateFormatter("%Y"))
    ax.set_ylabel("reproducciones por mes")
    ax.legend(loc="upper left")
    title(ax, "Solo se traslapan desde jul 2023")
    fig.savefig(FIG_DIR / "eda_cobertura.png")


def fig_timezone(c) -> None:
    """Hora UTC vs hora local de Javi: justifica convertir con la zona del país."""
    d = c.sql(
        "select hour(ts_start_utc) hu, hour(ts_local) hl, ms_played from pw where user_id = 'javi'"
    ).pl()
    tot = d["ms_played"].sum()
    fig, ax = plt.subplots(figsize=HALF)
    for col, color, lab, ls in (
        ("hu", INK3, "UTC (crudo)", "--"),
        ("hl", COLOR["javi"], "hora local", "-"),
    ):
        g = d.group_by(col).agg(pl.col("ms_played").sum().alias("ms")).sort(col)
        ax.plot(
            g[col].to_list(),
            [100 * v / tot for v in g["ms"].to_list()],
            color=color,
            lw=1.4,
            ls=ls,
            label=lab,
        )
    ax.set_xticks([0, 6, 12, 18, 23])
    ax.set_xlabel("hora del día")
    ax.set_ylabel("% del tiempo de Javier")
    ax.legend(loc="upper center", fontsize=7.5)
    title(ax, "En UTC, Javier escucharía a medianoche")
    fig.savefig(FIG_DIR / "eda_zona_horaria.png")


def fig_skip(c) -> None:
    """skipped vs reason_end: justifica usar `skipped` como definición de skip."""
    df = c.sql(
        """
        select reason_end, count(*) n, 100 * avg(is_skip::int) pct from p
        where content_type = 'track'
          and reason_end in ('trackdone', 'logout', 'fwdbtn', 'endplay', 'backbtn')
        group by 1 order by pct, n
        """
    ).pl()
    fig, ax = plt.subplots(figsize=HALF)
    ax.barh(df["reason_end"].to_list(), df["pct"].to_list(), color=INK2, height=0.6)
    for y, (pct, n) in enumerate(zip(df["pct"].to_list(), df["n"].to_list(), strict=True)):
        ax.text(pct + 2, y, f"{pct:.0f}%  ({n:,})", va="center", fontsize=7, color=INK2)
    ax.set_xlim(0, 150)
    ax.set_xticks([0, 50, 100])
    ax.set_xlabel("% marcadas como skipped (filas)")
    ax.grid(axis="y", visible=False)
    title(ax, "skipped = botones de saltar")
    fig.savefig(FIG_DIR / "eda_skip.png")


def fig_heatmap(c) -> None:
    """Hallazgo: cuándo somos más activos (hora × día, % del tiempo de cada persona)."""
    df = c.sql(
        """
        select user_id, isodow(ts_local) dow, hour(ts_local) h, sum(ms_played)::double ms from pw
        group by all
        """
    ).pl()
    fig, axes = plt.subplots(1, 2, figsize=(6.4, 2.3), sharey=True)
    days = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]
    for ax, u in zip(axes, ("gabo", "javi"), strict=True):
        d = df.filter(df["user_id"] == u)
        tot = d["ms"].sum()
        grid = [[0.0] * 24 for _ in range(7)]
        for dow, h, ms in d.select("dow", "h", "ms").iter_rows():
            grid[dow - 1][h] = 100 * ms / tot
        cmap = matplotlib.colors.LinearSegmentedColormap.from_list(u, ["#f1ede4", COLOR[u]])
        ax.imshow(grid, aspect="auto", cmap=cmap, vmin=0)
        ax.set_xticks([0, 6, 12, 18, 23])
        ax.set_yticks(range(7), days)
        ax.grid(False)
        ax.set_xlabel(f"hora local · {NAME[u]}")
        for s in ax.spines.values():
            s.set_visible(False)
    title(
        axes[0],
        "Gabriel escucha todo el día entre semana; Javier, de 17 a 21 h",
        "% del tiempo de escucha de cada persona, jul 2023 a ago 2026",
    )
    fig.savefig(FIG_DIR / "hallazgo_heatmap.png")


def fig_monthly(c) -> None:
    """Hallazgo: horas por mes en el tiempo."""
    df = c.sql(
        """
        select user_id, date_trunc('month', ts_local) m, sum(ms_played) / 3.6e6 h from pw
        -- sin el último mes: está incompleto (los datos terminan a media mes) y parece caída
        where ts_local < (select date_trunc('month', min(mx))
                          from (select max(ts_local) mx from pw group by user_id))
        group by all order by 2
        """
    ).pl()
    fig, ax = plt.subplots(figsize=(6.4, 2.3))
    for u in ("gabo", "javi"):
        d = df.filter(df["user_id"] == u)
        ax.plot(d["m"].to_list(), d["h"].to_list(), lw=1.6, color=COLOR[u], label=NAME[u])
    ax.set_ylabel("horas por mes")
    ax.set_ylim(0)
    meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    ax.xaxis.set_major_locator(matplotlib.dates.MonthLocator(bymonth=(1, 7)))
    ax.xaxis.set_major_formatter(
        matplotlib.ticker.FuncFormatter(
            lambda x, _: (d := matplotlib.dates.num2date(x)) and f"{meses[d.month - 1]} {d.year}"
        )
    )
    ax.legend(loc="upper left")
    title(
        ax,
        "Gabriel pasó de ~40 a ~100 horas al mes; Javier cayó a ~10 en 2025",
        "Horas por mes, jul 2023 a jul 2026",
    )
    fig.savefig(FIG_DIR / "hallazgo_mensual.png")


def main() -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    c = con()
    for f in (fig_duration, fig_coverage, fig_timezone, fig_skip, fig_heatmap, fig_monthly):
        f(c)
        plt.close("all")
        print(f"ok {f.__name__}")


if __name__ == "__main__":
    main()
