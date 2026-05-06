#!/usr/bin/env python3
"""Render docs/Tarriff-mapper.md to docs/Tarriff-mapper.pdf (requires: pip install fpdf2)."""

from __future__ import annotations

import html
import re
from pathlib import Path

from fpdf import FPDF

MD_PATH = Path(__file__).resolve().parent / "Tarriff-mapper.md"
OUT_PATH = Path(__file__).resolve().parent / "Tarriff-mapper.pdf"

LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
BOLD_RE = re.compile(r"\*\*([^*]+)\*\*")
CODE_RE = re.compile(r"`([^`]+)`")


class Doc(FPDF):
    def __init__(self) -> None:
        super().__init__()
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(18, 18, 18)


def ascii_fold(s: str) -> str:
    return (
        s.replace("↔", "<->")
        .replace("§", "Sec.")
        .replace("\u2014", "-")  # em dash
        .replace("\u2013", "-")  # en dash
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
    )


def fragment_to_html(s: str, *, allow_code: bool = True) -> str:
    """Convert one line's inline markdown to HTML."""
    s = ascii_fold(s)
    links: list[tuple[str, str]] = []

    def stash_link(m: re.Match[str]) -> str:
        idx = len(links)
        links.append((m.group(1), m.group(2)))
        return f"\ue000{idx}\ue001"

    t = LINK_RE.sub(stash_link, s)
    t = BOLD_RE.sub(lambda m: "<b>" + html.escape(m.group(1)) + "</b>", t)
    if allow_code:
        t = CODE_RE.sub(lambda m: "<code>" + html.escape(m.group(1)) + "</code>", t)
    else:
        t = CODE_RE.sub(lambda m: '"' + html.escape(m.group(1)) + '"', t)
    t = html.escape(t)
    # Unescape the tags we inserted (escaped as &lt;b&gt; etc.)
    t = (
        t.replace("&lt;b&gt;", "<b>")
        .replace("&lt;/b&gt;", "</b>")
        .replace("&lt;code&gt;", "<code>")
        .replace("&lt;/code&gt;", "</code>")
    )
    for i, (label, url) in enumerate(links):
        repl = (
            f'<a href="{html.escape(url, quote=True)}">'
            f"{html.escape(ascii_fold(label))}</a>"
        )
        t = t.replace(html.escape(f"\ue000{i}\ue001"), repl)
    return t


def parse_table_row(line: str) -> list[str]:
    line = line.strip()
    if not (line.startswith("|") and line.endswith("|")):
        return []
    inner = line[1:-1]
    return [c.strip() for c in inner.split("|")]


def is_separator_row(cells: list[str]) -> bool:
    if not cells:
        return False
    return all(re.fullmatch(r"-+", (c or "").replace(" ", "")) for c in cells)


def table_to_html(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    body_start = 1
    if len(rows) > 1 and is_separator_row(rows[1]):
        body_start = 2
    header = rows[0]
    body = rows[body_start:]

    parts = ['<table width="100%" border="1"><thead><tr>']
    for h in header:
        parts.append(f"<th>{fragment_to_html(h, allow_code=False)}</th>")
    parts.append("</tr></thead><tbody>")
    for row in body:
        parts.append("<tr>")
        for cell in row:
            parts.append(f"<td>{fragment_to_html(cell, allow_code=False)}</td>")
        parts.append("</tr>")
    parts.append("</tbody></table>")
    return "".join(parts)


def render_markdown(md_text: str, pdf: Doc) -> None:
    lines = md_text.splitlines()
    i = 0
    while i < len(lines):
        raw = lines[i]
        line = raw.strip()

        if not line:
            i += 1
            continue

        if line == "---":
            pdf.ln(4)
            i += 1
            continue

        if line.startswith("|"):
            tbl: list[list[str]] = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = parse_table_row(lines[i])
                if cells:
                    tbl.append(cells)
                i += 1
            html_tbl = table_to_html(tbl)
            if html_tbl:
                pdf.set_x(pdf.l_margin)
                pdf.write_html(html_tbl)
                pdf.ln(6)
            continue

        if line.startswith("# "):
            pdf.write_html(f"<h1>{fragment_to_html(line[2:].strip())}</h1>")
            pdf.ln(2)
        elif line.startswith("## "):
            pdf.write_html(f"<h2>{fragment_to_html(line[3:].strip())}</h2>")
            pdf.ln(3)
        elif line.startswith("### "):
            pdf.write_html(f"<h3>{fragment_to_html(line[4:].strip())}</h3>")
            pdf.ln(2)
        elif line.startswith("*") and line.endswith("*") and line.count("*") == 2:
            inner = line.strip("*").strip()
            pdf.set_font("Helvetica", "I", 11)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(pdf.epw, 6, ascii_fold(inner))
            pdf.set_font("Helvetica", "", 11)
        else:
            pdf.set_x(pdf.l_margin)
            pdf.write_html(f"<p>{fragment_to_html(line)}</p>")

        i += 1


def main() -> None:
    if not MD_PATH.exists():
        raise SystemExit(f"Missing {MD_PATH}")

    text = MD_PATH.read_text(encoding="utf-8")
    pdf = Doc()
    pdf.add_page()
    render_markdown(text, pdf)
    pdf.output(str(OUT_PATH))
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
