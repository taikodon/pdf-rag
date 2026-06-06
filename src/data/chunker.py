from __future__ import annotations

from llama_index.core import Document
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import TextNode


def chunk_documents(
    pages: list[dict[str, int | str]],
    chunk_size: int = 512,
    chunk_overlap: int = 64,
) -> list[TextNode]:
    """テキストをチャンクに分割する（論文のセクション境界を考慮）"""
    documents = [
        Document(
            text=str(page["text"]),
            metadata={"page_number": page["page"]},
        )
        for page in pages
    ]
    splitter = SentenceSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        paragraph_separator="\n\n",
    )
    return splitter.get_nodes_from_documents(documents)
