from __future__ import annotations

import streamlit as st
from rag.pipeline import RAGPipeline


def render_chat(pipeline: RAGPipeline) -> None:
    """チャットインターフェースを表示する"""
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # 会話履歴の表示
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    if prompt := st.chat_input("PDFについて質問してください"):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            if pipeline.query_engine is None:
                response_text = "まずPDFをアップロードして、インデックスの作成を完了させてください。"
                st.markdown(response_text)
            else:
                response_text = st.write_stream(pipeline.stream_query(prompt))

        st.session_state.messages.append(
            {"role": "assistant", "content": response_text}
        )
