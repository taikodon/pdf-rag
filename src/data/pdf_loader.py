from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF


def load_pdf(file_path: str | Path) -> list[dict[str, int | str]]:
    """PDFからページごとにテキストを抽出する"""
    doc = fitz.open(str(file_path))
    pages = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        if text.strip():
            pages.append({"page": page_num + 1, "text": text})
    doc.close()
    return pages
