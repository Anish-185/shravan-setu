import re

from referrals.pdf import ROWS_PER_PAGE, table_pdf


def test_paginates_and_escapes():
    rows = [[f"Student {i}", "x"] for i in range(ROWS_PER_PAGE * 2 + 1)]
    pdf = table_pdf("SCREENING, NOT DIAGNOSIS", ["a (b) \\ c", "Telugu: తెలుగు"], ["Name", "Col"], rows)
    assert b"/Count 3" in pdf
    assert pdf.count(b"(SCREENING, NOT DIAGNOSIS)") == 3  # banner on every page
    assert b"a \\(b\\) \\\\ c" in pdf
    assert b"Telugu: ??????" in pdf  # non-Latin-1 replaced, never crashes


def test_xref_offsets_point_at_objects():
    pdf = table_pdf("B", [], ["c"], [["r"]])
    xref_at = int(re.search(rb"startxref\n(\d+)", pdf).group(1))
    entries = re.findall(rb"(\d{10}) 00000 n", pdf[xref_at:])
    for i, off in enumerate(entries, 1):
        assert pdf[int(off):].startswith(b"%d 0 obj" % i)
