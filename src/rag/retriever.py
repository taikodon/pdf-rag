from __future__ import annotations

from pathlib import Path

import chromadb
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.core.schema import TextNode
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore

COLLECTION_NAME = "current_pdf"


def build_index(
    nodes: list[TextNode],
    embed_model: HuggingFaceEmbedding,
    persist_dir: str | Path,
) -> VectorStoreIndex:
    """ChromaDBにベクトルインデックスを構築する。既存コレクションは置き換える"""
    persist_dir = Path(persist_dir)
    persist_dir.mkdir(parents=True, exist_ok=True)

    chroma_client = chromadb.PersistentClient(path=str(persist_dir))
    try:
        chroma_client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    chroma_collection = chroma_client.create_collection(COLLECTION_NAME)

    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    return VectorStoreIndex(
        nodes,
        storage_context=storage_context,
        embed_model=embed_model,
        show_progress=False,
    )
