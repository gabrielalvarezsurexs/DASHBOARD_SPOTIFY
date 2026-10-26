"""PDFs con Edge/Chrome headless (ya vienen en Windows).

- print_pdf: imprime una página HTML (el informe).
- dashboard_pdf: una captura por capítulo del dashboard, unidas en un PDF. Imprimir el dashboard
  directo cortaba el final del documento; las capturas salen idénticas a la pantalla.

Uso: uv run python -m pipeline.print_pdf informe/informe.html out/informe.pdf
"""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

from pipeline.config import ROOT

BROWSERS = [
    Path(os.environ.get("PROGRAMFILES(X86)", "")) / "Microsoft/Edge/Application/msedge.exe",
    Path(os.environ.get("PROGRAMFILES", "")) / "Microsoft/Edge/Application/msedge.exe",
    Path(os.environ.get("PROGRAMFILES", "")) / "Google/Chrome/Application/chrome.exe",
]
CHAPTERS = ["resumen", "c0", "c1", "c2", "c3", "c4", "c5"]


def _browser(args: list[str]) -> None:
    browser = next((b for b in BROWSERS if b.exists()), None)
    if browser is None:
        raise SystemExit("No encontré Edge ni Chrome para generar el PDF")
    # Perfil aparte: si el usuario tiene Edge abierto, headless no se cuelga de esa ventana
    with tempfile.TemporaryDirectory() as profile:
        base = [str(browser), "--headless", "--disable-gpu", f"--user-data-dir={profile}"]
        subprocess.run(base + args, check=True, capture_output=True)


def print_pdf(html: Path, pdf: Path, budget_ms: int = 8000) -> Path:
    pdf.parent.mkdir(parents=True, exist_ok=True)
    _browser(
        [
            "--no-pdf-header-footer",
            f"--virtual-time-budget={budget_ms}",  # deja cargar las fuentes
            f"--print-to-pdf={pdf.resolve()}",
            html.resolve().as_uri(),
        ]
    )
    return pdf


def _trim_bottom(img: Image.Image, margin: int = 64) -> Image.Image:
    """Recorta el fondo vacío de abajo (la ventana se pide más alta que el contenido)."""
    bg = img.getpixel((2, img.height - 2))
    px = img.load()
    y = img.height - 1
    while y > 0 and all(px[x, y] == bg for x in range(0, img.width, 7)):
        y -= 1
    return img.crop((0, 0, img.width, min(img.height, y + margin)))


def dashboard_pdf(html: Path, pdf: Path, shots_dir: Path) -> Path:
    shots_dir.mkdir(parents=True, exist_ok=True)
    for old in shots_dir.glob("*.png"):  # si cambian los capítulos no quedan capturas viejas
        old.unlink()
    pages = []
    for i, part in enumerate(CHAPTERS):
        png = shots_dir / f"{i:02d}_{part}.png"
        _browser(
            [
                "--hide-scrollbars",
                "--window-size=1366,3600",
                "--force-device-scale-factor=1.5",
                "--virtual-time-budget=8000",
                f"--screenshot={png.resolve()}",
                f"{html.resolve().as_uri()}#th=dark&only={part}",
            ]
        )
        img = _trim_bottom(Image.open(png).convert("RGB"))
        img.save(png)
        pages.append(img)
    pdf.parent.mkdir(parents=True, exist_ok=True)
    pages[0].save(pdf, save_all=True, append_images=pages[1:], resolution=144)
    return pdf


if __name__ == "__main__":
    src, dst = (ROOT / a for a in sys.argv[1:3])
    print(print_pdf(src, dst))
