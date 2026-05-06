#!/usr/bin/env python3
"""One-off generator for docs/COURSE_SUBMISSION.pdf (requires: pip install fpdf2)."""

from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parent / "COURSE_SUBMISSION.pdf"


class Doc(FPDF):
    def __init__(self) -> None:
        super().__init__()
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(18, 18, 18)


def link_line(pdf: FPDF, url: str, h: float = 6) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "U", 10)
    pdf.set_text_color(0, 0, 200)
    pdf.multi_cell(pdf.epw, h, url, link=url)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 11)


def para(pdf: FPDF, text: str, h: float = 6) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(pdf.epw, h, text)


def main() -> None:
    pdf = Doc()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 18)
    pdf.multi_cell(0, 10, "TariffMapper - Course Submission")
    pdf.ln(4)

    para(
        pdf,
        "China <-> Indonesia tariff code mapping (MVP). Submission cover sheet with links to "
        "repository, demo video, and documentation.",
    )
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Author / course / date", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    para(
        pdf,
        "Author: [Your name]\n"
        "Course / assignment: [Course code / title]\n"
        "Submission date: May 2026",
    )
    pdf.ln(6)

    # Section 1
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "1. Demo video (Loom)", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, "Video walkthrough:", new_x="LMARGIN", new_y="NEXT")
    link_line(pdf, "https://www.loom.com/share/e41b9eeaede44342bdc956d59c907001")
    pdf.ln(4)

    # Section 2
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "2. Source code repository (GitHub)", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, "Public repository:", new_x="LMARGIN", new_y="NEXT")
    link_line(pdf, "https://github.com/Yash789k/tariff-mapper")
    para(
        pdf,
        "Clone (HTTPS): https://github.com/Yash789k/tariff-mapper.git\n"
        "Clone (SSH): git@github.com:Yash789k/tariff-mapper.git\n\n"
        "App location: open the tariff-mapper/ folder (Next.js: npm install, npm run dev). "
        "Root tariff-mapper.html is the standalone reference prototype.",
    )
    pdf.ln(4)

    # Section 3
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "3. Written reflection", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    para(
        pdf,
        "The reflection is not duplicated on this cover sheet. Full text appears under "
        "Section 11 Reflection in BUILD_DOCUMENTATION.md and in the bundled PDF documentation.",
    )
    pdf.cell(0, 6, "Markdown (Section 11 Reflection):", new_x="LMARGIN", new_y="NEXT")
    link_line(
        pdf,
        "https://github.com/Yash789k/tariff-mapper/blob/main/docs/BUILD_DOCUMENTATION.md",
    )
    pdf.ln(2)

    # Section 4
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "4. Documentation and deliverables", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)

    rows = [
        (
            "Technical build documentation (Markdown)",
            "https://github.com/Yash789k/tariff-mapper/blob/main/docs/BUILD_DOCUMENTATION.md",
        ),
        (
            "Phase 01 engineering build log",
            "https://github.com/Yash789k/tariff-mapper/blob/main/docs/PHASE_01_LOG.md",
        ),
        (
            "Full build documentation (PDF)",
            "https://github.com/Yash789k/tariff-mapper/blob/main/docs/TariffMapper_Build_Documentation.pdf",
        ),
        (
            "Browse all docs/",
            "https://github.com/Yash789k/tariff-mapper/tree/main/docs",
        ),
        (
            "MASTER_SESSION_LOG.md (optional)",
            "https://github.com/Yash789k/tariff-mapper/blob/main/docs/MASTER_SESSION_LOG.md",
        ),
        (
            "TariffMapper_Build_Documentation.html (optional)",
            "https://github.com/Yash789k/tariff-mapper/blob/main/docs/TariffMapper_Build_Documentation.html",
        ),
    ]
    for label, url in rows:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(pdf.epw, 6, label)
        pdf.set_font("Helvetica", "", 11)
        link_line(pdf, url)
        pdf.ln(2)

    # Section 5
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "5. Note on PDF contents", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    para(
        pdf,
        "Architecture, prompts, limitations, deployment, and reflection-adjacent discussion appear "
        "in TariffMapper_Build_Documentation.pdf and BUILD_DOCUMENTATION.md. Phase-by-phase "
        "implementation narrative is in PHASE_01_LOG.md. Use those sources as the canonical "
        "written submission beyond this cover sheet.",
    )

    pdf.ln(8)
    pdf.set_font("Helvetica", "I", 10)
    pdf.set_text_color(80, 80, 80)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(pdf.epw, 5, "Submission summary - Tsunami Advisors TariffMapper")

    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
