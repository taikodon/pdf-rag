# PDF RAG

ローカルLLM と RAG（Retrieval-Augmented Generation）を使って論文PDFを読解する、完全ローカル動作のデスクトップアプリです。外部APIを一切使用しないため、機密性の高い論文も安全に扱えます。

## 機能

- **PDF ビューア** — ローカルのPDFをネイティブアプリ上でレンダリング（Ctrl+ホイールでズーム）
- **RAG チャット** — 論文の内容をベクトル検索で参照しながらLLMが回答（常時右側に表示）
- **ストリーミング表示** — 回答をリアルタイムで逐次表示
- **論文履歴** — 開いた論文を自動保存し、最後のページ・ズームを復元
- **完全ローカル動作** — Ollama のみで動作。外部API不使用

## 技術スタック

| 用途 | ライブラリ |
|---|---|
| デスクトップフレームワーク | [Tauri v2](https://tauri.app/) |
| フロントエンド | React 19 + TypeScript |
| スタイリング | Tailwind CSS |
| PDF レンダリング | [pdfjs-dist](https://mozilla.github.io/pdf.js/) |
| SQLite 永続化 | @tauri-apps/plugin-sql |
| 設定永続化 | @tauri-apps/plugin-store |
| ローカル LLM / 埋め込み | [Ollama](https://ollama.com/)（`/api/chat`, `/api/embed`） |
| RAG パイプライン | TypeScript 自前実装（cosine similarity） |

## 必要な環境

- [Rust](https://www.rust-lang.org/) + [Node.js](https://nodejs.org/) 18+
- [Ollama](https://ollama.com/) がインストール・起動済みであること
- LLM モデル（例: `llama3`）と埋め込みモデル（`nomic-embed-text`）

## セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/taikodon/pdf-rag.git
cd pdf-rag

# 2. 依存関係をインストール
npm install

# 3. Ollama でモデルを取得
ollama pull llama3
ollama pull nomic-embed-text
```

## 起動方法

```bash
# Ollama を起動（別ターミナルで）
ollama serve

# アプリを起動（デスクトップウィンドウが開く）
npm run tauri dev
```

## 使い方

1. ツールバーの **「開く」** からPDFを選択
2. チャットパネルの **「インデックス」** ボタンを押してRAGを準備
3. チャット欄で論文について日本語で質問する

> **初回起動時:** Rust クレートのコンパイルに数分かかります。

## プロジェクト構成

```
src/
├── App.tsx                   # ルートコンポーネント・レイアウト
├── components/
│   ├── Sidebar.tsx           # アイコンサイドバー
│   ├── Toolbar.tsx           # ページ操作・ズーム
│   ├── PdfCanvas.tsx         # PDF ビューア
│   ├── ChatPanel.tsx         # RAG チャット UI
│   ├── HistoryPanel.tsx      # 論文履歴一覧
│   └── SettingsPanel.tsx     # Ollama 設定
├── hooks/
│   ├── usePdfViewer.ts       # PDF.js 統合フック
│   └── useChat.ts            # RAG チャット管理フック
├── services/
│   ├── db.ts                 # SQLite CRUD
│   ├── store.ts              # 永続設定
│   ├── ollama.ts             # Ollama クライアント
│   └── rag.ts                # RAG パイプライン
└── types/index.ts            # 型定義

src-tauri/                    # Rust バックエンド（Tauri v2）
```

## 変更履歴

### 2026-06-06
- **UI リデザイン** — ダークサイドバー（インディゴアクセント）、Research Assistant チャットパネル、カード型履歴リストに刷新
- **Tauri v2 + React に全面移行** — Python/Streamlit から完全書き直し。PDF.js によるネイティブレンダリング、Ollama の `/api/embed` を使ったRAGパイプラインをTypeScriptで自前実装
