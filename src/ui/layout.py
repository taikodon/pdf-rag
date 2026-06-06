from __future__ import annotations

import streamlit as st
from rag.generator import list_ollama_models
from rag.pipeline import RAGPipeline
from ui.chat import render_chat
from ui.pdf_viewer import render_pdf_viewer


def render_layout() -> None:
    """サイドバー設定とメインの左右2カラムレイアウトを描画する"""
    # --- サイドバー: モデル選択・ステータス ---
    with st.sidebar:
        st.header("設定")
        available_models = list_ollama_models()
        if not available_models:
            st.error("Ollamaが起動していません。\n`ollama serve` を実行してください。")
            selected_model = st.text_input("モデル名を直接入力", value="llama3")
        else:
            selected_model = st.selectbox("LLMモデル", options=available_models)

        st.divider()
        pipeline_ready = (
            "pipeline" in st.session_state
            and st.session_state.pipeline.pdf_hash is not None
        )
        if pipeline_ready:
            st.success("PDFインデックス: 準備完了")
        else:
            st.info("PDFインデックス: 未作成")

        if st.button("会話履歴をクリア"):
            st.session_state.messages = []
            st.rerun()

    # パイプラインをセッション全体で保持
    if "pipeline" not in st.session_state:
        st.session_state.pipeline = RAGPipeline()
    pipeline: RAGPipeline = st.session_state.pipeline

    # --- メインエリア: 左=PDFビューア / 右=チャット ---
    col_pdf, col_chat = st.columns([1, 1])

    with col_pdf:
        st.subheader("PDFビューア")
        file_bytes = render_pdf_viewer()

        if file_bytes is not None:
            with st.spinner("PDFを解析・インデックス中...（初回は時間がかかります）"):
                try:
                    pipeline.index_pdf(file_bytes, selected_model)
                    st.success("インデックス作成完了")
                except Exception as e:
                    st.error(f"インデックス作成エラー: {e}")

    with col_chat:
        st.subheader("チャット")
        render_chat(pipeline)
