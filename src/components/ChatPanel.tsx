import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Database, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isIndexing: boolean;
  indexProgress: { current: number; total: number };
  isIndexed: boolean;
  hasPaper: boolean;
  onSendMessage: (text: string) => void;
  onIndexPaper: () => void;
  onClearMessages: () => void;
}

export function ChatPanel({
  messages,
  isLoading,
  isIndexing,
  indexProgress,
  isIndexed,
  hasPaper,
  onSendMessage,
  onIndexPaper,
  onClearMessages,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700">RAG チャット</h2>
        <div className="flex items-center gap-2">
          {hasPaper && (
            <button
              onClick={onIndexPaper}
              disabled={isIndexing}
              title={isIndexed ? 'インデックスを再作成' : 'RAGインデックスを作成'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-colors ${
                isIndexed
                  ? 'border-green-300 text-green-700 hover:bg-green-50'
                  : 'border-blue-300 text-blue-700 hover:bg-blue-50'
              } disabled:opacity-50`}
            >
              {isIndexing ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
              {isIndexing
                ? `${indexProgress.current}/${indexProgress.total}`
                : isIndexed ? 'インデックス済' : 'インデックス作成'}
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={onClearMessages}
              title="会話履歴をクリア"
              className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 text-xs gap-2">
            {!hasPaper ? (
              <p>PDFを開いて質問してください</p>
            ) : !isIndexed ? (
              <>
                <p>「インデックス作成」ボタンを押すと</p>
                <p>RAGを使って論文を検索できます</p>
              </>
            ) : (
              <p>論文について質問してください</p>
            )}
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.content || (
                <span className="inline-flex gap-1 items-center text-gray-400">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:0.15s]">●</span>
                  <span className="animate-bounce [animation-delay:0.3s]">●</span>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !hasPaper
                ? 'PDFを開いてください'
                : isIndexing
                ? 'インデックス作成中...'
                : '質問を入力 (Shift+Enter で改行)'
            }
            disabled={!hasPaper || isIndexing || isLoading}
            rows={2}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !hasPaper || isIndexing}
            className="flex-shrink-0 p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
