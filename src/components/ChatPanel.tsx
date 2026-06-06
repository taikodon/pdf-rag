import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Sparkles, Loader2, Database, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isIndexing: boolean;
  indexProgress: { current: number; total: number };
  indexError: string | null;
  isIndexed: boolean;
  hasPaper: boolean;
  onSendMessage: (text: string) => void;
  onIndexPaper: () => void;
  onClearMessages: () => void;
  onOpenSettings: () => void;
}

export function ChatPanel({
  messages,
  isLoading,
  isIndexing,
  indexProgress,
  indexError,
  isIndexed,
  hasPaper,
  onSendMessage,
  onIndexPaper,
  onClearMessages,
  onOpenSettings,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading || !hasPaper) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }

  const canSend = !!input.trim() && !isLoading && hasPaper && !isIndexing;

  return (
    <div className="flex flex-col h-full bg-zinc-50 border-l border-zinc-200">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800 leading-none">Research Assistant</p>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">
              {isIndexing
                ? `インデックス作成中... ${indexProgress.current}/${indexProgress.total}`
                : isIndexed
                ? 'RAG インデックス済み'
                : hasPaper
                ? 'インデックス未作成'
                : 'PDF未選択'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hasPaper && (
            <button
              onClick={onIndexPaper}
              disabled={isIndexing}
              title={isIndexed ? 'インデックスを再作成' : 'RAGインデックスを作成'}
              className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
                isIndexed
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
              } disabled:opacity-50`}
            >
              {isIndexing ? (
                <Loader2 size={11} className="animate-spin" />
              ) : isIndexed ? (
                <CheckCircle2 size={11} />
              ) : (
                <Database size={11} />
              )}
              {isIndexed ? '再作成' : 'インデックス'}
            </button>
          )}
          {messages.length > 0 && !isLoading && (
            <button
              onClick={onClearMessages}
              title="会話をクリア"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {indexError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">Ollamaに接続できません</p>
                <p className="text-[11px] text-red-500 mt-0.5">以下を確認してください：</p>
              </div>
            </div>
            <ol className="space-y-1 ml-1">
              {['Ollamaがインストール済みか', 'ollama serve が起動しているか', 'URLが正しいか（設定で変更可）'].map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-red-600">
                  <span className="font-bold">{i + 1}.</span>{s}
                </li>
              ))}
            </ol>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors w-full justify-center"
            >
              <Settings size={12} />
              設定を開いてURLを確認する
            </button>
          </div>
        )}
        {messages.length === 0 && !indexError ? (
          <EmptyState hasPaper={hasPaper} isIndexed={isIndexed} />
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="flex-shrink-0 p-3 bg-white border-t border-zinc-200">
        {hasPaper && !isIndexed && !isIndexing && messages.length === 0 && (
          <div className="flex items-center gap-2 mb-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <AlertCircle size={12} className="flex-shrink-0" />
            <span>まずインデックスを作成するとRAG検索が使えます</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={
                !hasPaper
                  ? 'PDFを開いてください'
                  : isIndexing
                  ? 'インデックス作成中...'
                  : '論文について質問する…'
              }
              disabled={!hasPaper || isIndexing}
              rows={1}
              className="w-full border border-zinc-200 rounded-2xl px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 disabled:bg-zinc-100 disabled:text-zinc-400 bg-white transition-all leading-relaxed"
              style={{ minHeight: '40px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!canSend}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-500/30 hover:shadow-indigo-500/40"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={15} className="translate-x-px" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] bg-indigo-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed shadow-sm shadow-indigo-500/20 whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2.5">
      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <Sparkles size={11} className="text-white" />
      </div>
      <div className="max-w-[82%] bg-white border border-zinc-200 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-zinc-700 leading-relaxed shadow-sm whitespace-pre-wrap">
        {msg.content || <ThinkingDots />}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-4">
      {[0, 150, 300].map(delay => (
        <span
          key={delay}
          className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

function EmptyState({ hasPaper, isIndexed }: { hasPaper: boolean; isIndexed: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-48 gap-3 py-8">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
        <Sparkles size={22} className="text-indigo-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-500">
          {!hasPaper
            ? 'PDFを開いてください'
            : !isIndexed
            ? 'インデックスを作成してください'
            : '論文について質問できます'}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          {!hasPaper
            ? 'ツールバーの「開く」からPDFを選択'
            : !isIndexed
            ? 'ヘッダーの「インデックス」ボタンを押してRAGを有効化'
            : 'Shift+Enterで改行、Enterで送信'}
        </p>
      </div>
    </div>
  );
}
