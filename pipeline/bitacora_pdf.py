"""docs/bitacora.md → out/bitacora.pdf (Montserrat, todo en negro, carta).

Uso: uv run python -m pipeline.bitacora_pdf
La bitácora se edita en Markdown; este script solo le da formato e imprime con Edge/Chrome.
"""

import markdown

from pipeline.config import ROOT
from pipeline.print_pdf import print_pdf

SRC = ROOT / "docs" / "bitacora.md"
HTML = ROOT / "out" / "bitacora.html"
OUT = ROOT / "out" / "bitacora.pdf"
FONTS = (ROOT / "informe" / "fonts").as_uri()

CSS = f"""
@font-face {{ font-family: Montserrat; src: url({FONTS}/Montserrat-Regular.ttf); }}
@font-face {{ font-family: Montserrat; font-weight: 700; src: url({FONTS}/Montserrat-Bold.ttf); }}
@font-face {{ font-family: Montserrat; font-weight: 600;
              src: url({FONTS}/Montserrat-SemiBold.ttf); }}
@page {{ size: Letter; margin: 16mm 18mm; }}
body {{ font: 9pt/1.45 Montserrat, sans-serif; color: #000; margin: 0; }}
h1 {{ font-size: 14pt; margin: 0 0 4pt; }}
h2 {{ font-size: 10.5pt; margin: 14pt 0 4pt; break-after: avoid; }}
p {{ margin: 0 0 6pt; }}
table {{ border-collapse: collapse; width: 100%; font-size: 8.3pt; }}
th {{ text-align: left; font-weight: 600; border-top: 0.75pt solid #000;
      border-bottom: 0.75pt solid #000; padding: 3pt 8pt 3pt 0; }}
td {{ border-bottom: 0.5pt solid #000; padding: 3pt 8pt 3pt 0; vertical-align: top; }}
tr {{ break-inside: avoid; }}
h2:first-of-type + table td:first-child {{ white-space: nowrap; }}  /* columna de fecha */
code {{ font-family: Montserrat, sans-serif; font-weight: 600; }}
ul {{ padding-left: 14pt; margin: 0; }} li {{ margin-bottom: 3pt; }}
"""


def build() -> None:
    body = markdown.markdown(SRC.read_text(encoding="utf-8"), extensions=["tables"])
    HTML.parent.mkdir(parents=True, exist_ok=True)
    HTML.write_text(
        f'<!doctype html><html lang="es-MX"><meta charset="utf-8"><title>Bitácora</title>'
        f"<style>{CSS}</style><body>{body}</body></html>",
        encoding="utf-8",
    )
    print(print_pdf(HTML, OUT))


if __name__ == "__main__":
    build()
