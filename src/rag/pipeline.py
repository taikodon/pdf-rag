from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Generator

from llama_index.core import PromptTemplate, Settings
from llama_index.core.query_engine import RetrieverQueryEngine

from data.chunker import chunk_documents
from data.embeddings import get_embedding_model
from data.pdf_loader import load_pdf
from rag.generator import get_llm
from rag.retriever import build_index

_PROJECT_ROOT = Path(__file__).parent.parent.parent
VECTORSTORE_DIR = _PROJECT_ROOT / "data" / "vectorstore"
UPLOADS_DIR = _PROJECT_ROOT / "data" / "uploads"

_QA_PROMPT = PromptTemplate(
    "あなたは論文の内容を分析する研究者です。\n"
    "以下の文脈を参考に、質問に日本語で回答してください。\n"
    "文脈に関連する情報がない場合は、その旨を伝えてください。\n\n"
    "文脈:\n{context_str}\n\n"
    "質問: {query_str}\n\n"
    "回答:"
)


def _get_pdf_hash(file_bytes: bytes) -> str:
    return hashlib.md5(file_bytes).hexdigest()


class RAGPipeline:
    def __init__(self) -> None:
        self.pdf_hash: str | None = None
        self.query_engine: RetrieverQueryEngine | None = None
        self._embed_model = None

    def _get_embed_model(self):
        if self._embed_model is None:
            self._embed_model = get_embedding_model()
        return self._embed_model

    def index_pdf(self, file_bytes: bytes, model_name: str) -> None:
        """PDFをインデックス化する。同じPDFなら再インデックスをスキップする"""
        pdf_hash = _get_pdf_hash(file_bytes)
        if pdf_hash == self.pdf_hash and self.query_engine is not None:
            return

        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        pdf_path = UPLOADS_DIR / f"{pdf_hash}.pdf"
        pdf_path.write_bytes(file_bytes)

        embed_model = self._get_embed_model()
        llm = get_llm(model_name)
        Settings.embed_model = embed_model
        Settings.llm = llm

        pages = load_pdf(pdf_path)
        if not pages:
            raise ValueError("PDFからテキストを抽出できませんでした。")

        nodes = chunk_documents(pages)
        index = build_index(nodes, embed_model, VECTORSTORE_DIR)

        self.query_engine = index.as_query_engine(
            llm=llm,
            streaming=True,
            similarity_top_k=3,
            text_qa_template=_QA_PROMPT,
        )
        self.pdf_hash = pdf_hash

    def stream_query(self, question: str) -> Generator[str, None, None]:
        """質問に対してストリーミングで回答を生成する"""
        if self.query_engine is None:
            yield "PDFをアップロードしてインデックスを作成してください。"
            return
        try:
            response = self.query_engine.query(question)
            for token in response.response_gen:
                yield str(token)
        except Exception as e:
            yield f"\n\nエラーが発生しました: {e}"
