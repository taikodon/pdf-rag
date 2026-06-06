from __future__ import annotations

import ollama
from llama_index.llms.ollama import Ollama

OLLAMA_BASE_URL = "http://localhost:11434"


def get_llm(model_name: str) -> Ollama:
    """OllamaのLLMクライアントを初期化する"""
    return Ollama(
        model=model_name,
        base_url=OLLAMA_BASE_URL,
        request_timeout=120.0,
    )


def list_ollama_models() -> list[str]:
    """利用可能なOllamaモデルの一覧を取得する。Ollama未起動時は空リストを返す"""
    try:
        result = ollama.list()
        models = getattr(result, "models", None) or result.get("models", [])
        return [
            getattr(m, "model", None) or m.get("name", "") for m in models
        ]
    except Exception:
        return []
