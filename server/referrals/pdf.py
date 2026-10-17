"""Minimal text-and-table PDF writer (no dependency; see docs/REUSE_LOG.md, Phase 2).

Uses the standard PDF base-14 fonts (Helvetica, Courier), so nothing is embedded. Latin-1 text only:
other characters become '?'. Telugu printouts are made on the phone (expo-print) in Phase 5.
"""

PAGE_W, PAGE_H = 595, 842  # A4 in points
MARGIN = 40
ROW_H = 12
ROWS_PER_PAGE = 52


def _esc(text):
    text = str(text).encode("latin-1", "replace").decode("latin-1")
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _text(x, y, font, size, text):
    return f"BT /{font} {size} Tf {x} {y} Td ({_esc(text)}) Tj ET"


def table_pdf(banner, header_lines, columns, rows):
    """One banner on every page, header lines, then a monospaced table that paginates."""
    widths = [max(len(str(c)) for c in col) for col in zip(columns, *rows)] if rows else [len(c) for c in columns]
    fmt = lambda cells: "  ".join(str(c).ljust(w) for c, w in zip(cells, widths))  # noqa: E731
    chunks = [rows[i:i + ROWS_PER_PAGE] for i in range(0, len(rows), ROWS_PER_PAGE)] or [[]]

    streams = []
    for page_no, chunk in enumerate(chunks, 1):
        y = PAGE_H - MARGIN
        ops = [
            f"0.95 0.85 0.3 rg {MARGIN} {y - 22} {PAGE_W - 2 * MARGIN} 26 re f 0 g",
            _text(MARGIN + 8, y - 14, "F2", 13, banner),
        ]
        y -= 44
        for line in header_lines:
            ops.append(_text(MARGIN, y, "F1", 10, line))
            y -= 14
        y -= 6
        ops.append(_text(MARGIN, y, "F4", 8, fmt(columns)))
        y -= ROW_H
        for row in chunk:
            ops.append(_text(MARGIN, y, "F3", 8, fmt(row)))
            y -= ROW_H
        ops.append(_text(MARGIN, MARGIN - 10, "F1", 8, f"Page {page_no} of {len(chunks)}"))
        streams.append("\n".join(ops).encode("latin-1"))

    # Objects: 1 catalog, 2 pages, 3-6 fonts, then (page, content) pairs.
    n_pages = len(streams)
    page_ids = [7 + 2 * i for i in range(n_pages)]
    fonts = "<< /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >>"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        f"<< /Type /Pages /Kids [{' '.join(f'{p} 0 R' for p in page_ids)}] /Count {n_pages} >>".encode(),
    ]
    for base in ("Helvetica", "Helvetica-Bold", "Courier", "Courier-Bold"):
        objects.append(f"<< /Type /Font /Subtype /Type1 /BaseFont /{base} /Encoding /WinAnsiEncoding >>".encode())
    for pid, stream in zip(page_ids, streams):
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] "
            f"/Resources << /Font {fonts} >> /Contents {pid + 1} 0 R >>".encode()
        )
        objects.append(b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream")

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(objects, 1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i + obj + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)
    out += b"".join(b"%010d 00000 n \n" % o for o in offsets)
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objects) + 1, xref)
    return bytes(out)
