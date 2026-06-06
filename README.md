# 論文PDF読解アシスタント

ローカルLLM と RAG（Retrieval-Augmented Generation）を組み合わせた、完全ローカル動作の論文PDF読解アプリです。外部APIを一切使用しないため、機密性の高い論文も安全に扱えます。

## 機能

- **PDFビューア** — アップロードしたPDFをブラウザ上でプレビュー
- **RAGチャット** — 論文の内容を参照しながらLLMが質問に回答
- **ストリーミング表示** — 回答をリアルタイムで逐次表示
- **重複インデックス防止** — 同じPDFを再アップロードしても再インデックスしない
- **完全ローカル動作** — Ollama + ChromaDB + HuggingFace埋め込みモデルをローカルで使用

## 技術スタック

| 用途 | ライブラリ |
|---|---|
| UI | [Streamlit](https://streamlit.io/) |
| RAG | [LlamaIndex](https://www.llamaindex.ai/) |
| ベクトルDB | [ChromaDB](https://www.trychroma.com/) |
| ローカルLLM | [Ollama](https://ollama.com/) |
| 埋め込みモデル | [intfloat/multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) |
| PDFパース | [PyMuPDF](https://pymupdf.readthedocs.io/) |

## 必要な環境

- Python 3.11+
- [Ollama](https://ollama.com/) がインストール・起動済みであること

## セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/taikodon/pdf-rag.git
cd pdf-rag

# 2. 依存関係をインストール（仮想環境を推奨）
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Ollamaでモデルを取得（例: llama3）
ollama pull llama3
```

## 起動方法

```bash
# Ollamaを起動（別ターミナルで）
ollama serve

# アプリを起動
source .venv/bin/activate
streamlit run src/app.py
```

ブラウザで `http://localhost:8501` が開きます。

## 使い方

1. サイドバーで使用するOllamaモデルを選択
2. 左カラムにPDFをアップロード（自動でインデックス作成が始まります）
3. 右カラムのチャット欄で論文について質問する

> **初回起動時:** 埋め込みモデル（約117MB）のダウンロードが発生します。

## プロジェクト構成

```
src/
├── app.py              # エントリポイント
├── ui/                 # UIレイヤー
│   ├── layout.py       # 左右2カラムレイアウト
│   ├── pdf_viewer.py   # PDFビューア
│   └── chat.py         # チャットインターフェース
├── rag/                # RAG処理レイヤー
│   ├── pipeline.py     # パイプライン統合
│   ├── retriever.py    # ChromaDB検索
│   └── generator.py    # Ollama推論
└── data/               # データ処理レイヤー
    ├── pdf_loader.py   # PDF読み込み
    ├── chunker.py      # チャンク分割
    └── embeddings.py   # 埋め込み生成
```
