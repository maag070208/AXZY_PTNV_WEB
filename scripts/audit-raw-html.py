#!/usr/bin/env python3
"""Cuenta "HTML a mano" donde el UI system ya tiene componente.

El dueño exige que las pantallas usen SOLO el sistema (ITFlex, ITText, ITCard,
ITChip, ITBento*…). Este medidor cuenta las etiquetas crudas y los estilos en
línea para poder bajar el número pantalla por pantalla.

Uso:
    python3 -I web/scripts/audit-raw-html.py            # resumen por módulo
    python3 -I web/scripts/audit-raw-html.py --files    # peores archivos
"""
import os
import re
import sys
import collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = ["src/pages", "src/features", "src/widgets", "src/shared/ui"]
# Pantallas que no aplican: PDFs, landing pública, generadores de documentos.
SKIP = (
    "pages/landing/",
    "widgets/tickets/ticket-pdf/",
    "widgets/purchase-order-pdf/",
    "widgets/custody-letter/",
    "widgets/reports/",
    "widgets/time-clock-dashboard/",
    "features/kitchen/",
)

PATTERNS = {
    "div": re.compile(r'<div\b'),
    "p": re.compile(r'<p\b'),
    "span": re.compile(r'<span\b'),
    "style": re.compile(r'style=\{\{'),
}


def main() -> int:
    files = len(sys.argv) > 1 and "--files" in sys.argv
    by_file: dict[str, collections.Counter] = {}
    for d in DIRS:
        for base, _, names in os.walk(os.path.join(ROOT, d)):
            for name in names:
                if not name.endswith(".tsx"):
                    continue
                path = os.path.join(base, name)
                rel = os.path.relpath(path, ROOT)
                if rel.startswith(SKIP):
                    continue
                text = open(path, encoding="utf-8").read()
                counts = collections.Counter({k: len(rx.findall(text)) for k, rx in PATTERNS.items()})
                if sum(counts.values()):
                    by_file[rel] = counts

    totals = collections.Counter()
    for counts in by_file.values():
        totals.update(counts)

    print(f"{'archivo':70} {'div':>5} {'p':>4} {'span':>5} {'style':>6} {'total':>6}")
    rows = sorted(by_file.items(), key=lambda kv: -sum(kv[1].values()))
    for rel, counts in (rows if files else rows[:15]):
        print(f"{rel:70} {counts['div']:5} {counts['p']:4} {counts['span']:5} {counts['style']:6} {sum(counts.values()):6}")
    print(f"\nTOTAL archivos={len(by_file)} div={totals['div']} p={totals['p']} span={totals['span']} style={totals['style']} suma={sum(totals.values())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
