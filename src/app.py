from __future__ import annotations

import sys
from pathlib import Path

# src/ をモジュール検索パスに追加（streamlit run src/app.py 実行時の解決）
sys.path.insert(0, str(Path(__file__).parent))

import streamlit as st
from ui.layout import render_layout

st.set_page_config(
    page_title="論文PDF読解アシスタント",
    page_icon="📄",
    layout="wide",
)
st.title("論文PDF読解アシスタント")
render_layout()
