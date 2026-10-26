"""Regenera todo a partir de los zips de Spotify: silver, figuras, dashboard, informe y bitácora.

Uso: uv run python -m pipeline.generar   (o doble clic en generar.cmd)

Salidas en out/: informe.docx, bitacora.pdf, dashboard.pdf (+ capturas/), y
docs/auditoria-cifras.md con cada cifra del informe recalculada. El dashboard queda en
dashboard/web/index.html y se abre con doble clic.
"""

import zipfile

from pipeline import (
    auditoria,
    bitacora_pdf,
    build_silver,
    eda_figures,
    export_dashboard,
    informe_docx,
)
from pipeline.config import DATA_DIR, RAW_DIR, ROOT
from pipeline.print_pdf import dashboard_pdf


def unzip_raw() -> None:
    """data/zips/my_spotify_data_<persona>.zip → data/raw/<persona>/ (solo si no existe)."""
    for z in sorted((DATA_DIR / "zips").glob("*.zip")):
        persona = z.stem.removeprefix("my_spotify_data_").lower()
        dest = RAW_DIR / persona
        if dest.exists():
            continue
        with zipfile.ZipFile(z) as f:
            f.extractall(dest)
        print(f"descomprimido {z.name} → {dest.relative_to(ROOT)}")


def main() -> None:
    unzip_raw()
    build_silver.build()
    eda_figures.main()
    export_dashboard.export()
    print(informe_docx.build())
    fallas = auditoria.main()  # cada cifra del informe contra los datos
    bitacora_pdf.build()
    out = ROOT / "out"
    print(
        dashboard_pdf(
            ROOT / "dashboard" / "web" / "index.html", out / "dashboard.pdf", out / "capturas"
        )
    )
    print(f"\nDashboard: {(ROOT / 'dashboard' / 'web' / 'index.html').as_uri()}")
    if fallas:
        raise SystemExit(f"{fallas} cifras del informe no cuadran: ver docs/auditoria-cifras.md")


if __name__ == "__main__":
    main()
