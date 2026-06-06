# PDF RAG

## プロジェクト概要

Tauri v2 + React + TypeScript 製のローカルLLM RAG論文PDF読解デスクトップアプリ。
外部APIを一切使用せず、Ollama（ローカルLLM）のみで動作する。

## 技術スタック

| 用途 | ライブラリ |
|---|---|
| デスクトップフレームワーク | Tauri v2 |
| フロントエンド | React 19 + TypeScript |
| スタイリング | Tailwind CSS |
| PDFレンダリング | pdfjs-dist |
| SQLite永続化 | @tauri-apps/plugin-sql |
| 設定永続化 | @tauri-apps/plugin-store |
| ローカルLLM/埋め込み | Ollama (`/api/chat`, `/api/embed`) |
| RAGパイプライン | TypeScriptで自前実装（cosine similarity） |
| ビルドツール | Vite |

## 開発コマンド

```bash
# 依存インストール
npm install

# 開発サーバー起動（デスクトップウィンドウが開く）
npm run tauri dev

# フロントエンドのみビルド確認
npm run build

# 型チェック
npm run typecheck
```

## ディレクトリ構成

```
src/
├── main.tsx                  # React エントリポイント
├── App.tsx                   # ルートコンポーネント・レイアウト
├── index.css                 # Tailwind + PDF.js テキスト層スタイル
├── components/
│   ├── Sidebar.tsx           # アイコンサイドバー (reader/history/settings)
│   ├── Toolbar.tsx           # ページ操作・ズーム
│   ├── PdfCanvas.tsx         # PDF ビューア (Ctrl+ホイールズーム)
│   ├── ChatPanel.tsx         # RAG チャット UI（常時右側表示）
│   ├── HistoryPanel.tsx      # 論文履歴一覧
│   └── SettingsPanel.tsx     # Ollama URL・モデル設定
├── contexts/
│   └── AppContext.tsx        # グローバル状態管理
├── hooks/
│   ├── usePdfViewer.ts       # PDF.js 統合フック
│   └── useChat.ts            # RAG チャット管理フック
├── services/
│   ├── db.ts                 # SQLite CRUD
│   ├── store.ts              # 永続設定 (ollamaUrl, llmModel, embedModel)
│   ├── ollama.ts             # Ollama クライアント (listModels, chat, embed)
│   └── rag.ts                # RAGパイプライン (extract, chunk, index, search)
└── types/
    └── index.ts              # Paper, ChatMessage, DocChunk 等の型定義

src-tauri/
├── src/
│   ├── main.rs               # Tauri エントリポイント
│   └── lib.rs                # get_default_open_path() コマンド (WSL2対応)
├── Cargo.toml
├── tauri.conf.json           # productName: "PDF RAG"
└── capabilities/
    └── default.json
```

## アプリレイアウト

```
┌────┬──────────┬──────────────────────┬─────────────┐
│    │          │                      │             │
│icon│ サブパネル│     PDF ビューア      │  RAGチャット │
│bar │(履歴/設定)│                      │   (常時表示) │
│    │          │                      │             │
└────┴──────────┴──────────────────────┴─────────────┘
  48px  260px(任意)      flex-1                320px
```

## データベーススキーマ (SQLite)

```sql
CREATE TABLE papers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  last_opened_page INTEGER DEFAULT 1,
  last_zoom_level REAL DEFAULT 1.0,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE TABLE doc_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  embedding TEXT NOT NULL,  -- JSON float[] として保存
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);
```

## RAG パイプライン

1. PDF.js `getTextContent()` でページ別テキスト抽出
2. スライディングウィンドウでチャンク分割（400語、50語オーバーラップ）
3. Ollama `/api/embed` (nomic-embed-text) でベクトル化
4. SQLite に embedding を JSON 文字列として保存
5. 質問時: 同様に埋め込み → cosine similarity → 上位3チャンク → Ollama `/api/chat`

## 前提条件

- [Ollama](https://ollama.com/) のインストールと `ollama serve` の起動
- LLM モデル: `ollama pull llama3` 等
- 埋め込みモデル: `ollama pull nomic-embed-text`

## git・PR ルール

グローバル `~/.claude/CLAUDE.md` の規則に従う（日本語コミットプレフィックス・自動PR等）。
