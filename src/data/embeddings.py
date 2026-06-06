from __future__ import annotations

from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# 日本語・英語両対応の軽量多言語モデル（約117MB）
DEFAULT_EMBED_MODEL = "intfloat/multilingual-e5-small"


def get_embedding_model(
    model_name: str = DEFAULT_EMBED_MODEL,
) -> HuggingFaceEmbedding:
    """HuggingFace埋め込みモデルを初期化する"""
    return HuggingFaceEmbedding(model_name=model_name, max_length=512)
