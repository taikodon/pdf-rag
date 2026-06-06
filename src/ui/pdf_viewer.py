from __future__ import annotations

import streamlit as st
from streamlit_pdf_viewer import pdf_viewer


def render_pdf_viewer() -> bytes | None:
    """PDFアップローダーとプレビューを表示する。アップロードされたバイト列を返す"""
    uploaded_file = st.file_uploader(
        "PDFをアップロード",
        type="pdf",
        label_visibility="collapsed",
    )
    if uploaded_file is None:
        st.info("PDFファイルをアップロードしてください")
        return None

    file_bytes = uploaded_file.read()
    pdf_viewer(input=file_bytes, width=700)
    return file_bytes
