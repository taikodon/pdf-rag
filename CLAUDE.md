# Local LLM RAG PDF Reader

## プロジェクト概要

完全ローカル環境で動作する論文PDF読解アプリ。外部LLM APIを使用せず、Ollama + ChromaDB + Streamlit で構成する。

## 技術スタック

| 用途 | ライブラリ |
|---|---|
| UI | Streamlit |
| PDFレンダリング | streamlit-pdf-viewer |
| RAG | LlamaIndex |
| ベクトルDB | ChromaDB |
| ローカルLLM | Ollama |
| 埋め込み | sentence-transformers (日本語対応) |
| PDFパース | PyMuPDF |
| テスト | pytest |

Python: 3.11+

## 開発コマンド

| コマンド | 内容 |
|---|---|
| `/setup` | venv作成 + 依存インストール |
| `/run` | Streamlitアプリ起動 |
| `/test` | pytestでテスト実行 |

手動実行する場合:
```bash
# 環境構築
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

# アプリ起動
streamlit run src/app.py

# テスト
pytest tests/ -v
```

## アーキテクチャ

### ディレクトリ構成

```
src/
├── app.py              # エントリポイント: Streamlit初期化・レイアウト呼び出し
├── ui/                 # UIレイヤー: Streamlitコンポーネントのみ
│   ├── layout.py       # st.columns(2) で左右分割
│   ├── pdf_viewer.py   # 左カラム: PDFプレビュー
│   └── chat.py         # 右カラム: チャット入出力
├── rag/                # RAG処理レイヤー: LLM・検索ロジック
│   ├── pipeline.py     # RAGパイプライン統合エントリ
│   ├── retriever.py    # ChromaDB 検索
│   └── generator.py    # Ollama 推論・ストリーミング
└── data/               # データ処理レイヤー: PDF→チャンク→ベクトル
    ├── pdf_loader.py   # PyMuPDF でテキスト抽出
    ├── chunker.py      # 論文2段組み対応チャンク分割
    └── embeddings.py   # HuggingFace 埋め込み生成

data/
├── uploads/            # アップロードPDF格納 (gitignore対象)
└── vectorstore/        # ChromaDB 永続化ストレージ (gitignore対象)
```

### レイヤー間依存ルール

`ui → rag → data` の一方向のみ。逆依存禁止。

## コーディング規約

- **識別子:** 英語（変数・関数・クラス・ファイル名）
- **UI文字列・コメント:** 日本語
- **型ヒント:** 全関数に必須（`from __future__ import annotations` を各ファイルの先頭に記述）
- **外部API:** 完全禁止（OpenAI等）。LLMはOllamaのみ使用
- **エラー表示:** Ollama未起動・モデル未取得時はUIに `st.error()` で明示

## 実装上の注意

- **チャンク分割:** 論文の2段組み・図表キャプションを考慮し、セクション境界を優先したチャンク設定を行う
- **ストリーミング:** `st.write_stream()` を使用し、LLM推論結果を逐次表示する
- **ChromaDB永続化:** `data/vectorstore/` に保存。PDFハッシュでインデックスの重複登録を防ぐ
- **モデル選択:** Ollamaのモデルはサイドバーのセレクトボックスでユーザーが選択できるようにする

## git・PR ルール

グローバル `~/.claude/CLAUDE.md` の規則に従う（日本語コミットプレフィックス・自動PR等）。
