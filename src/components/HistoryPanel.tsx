import { useState, useEffect, useCallback } from 'react';
import { FileText, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { dbService } from '../services/db';
import { useApp } from '../contexts/AppContext';
import type { Paper } from '../types';

interface HistoryPanelProps {
  onOpenPaper: (filePath: string) => void;
}

export function HistoryPanel({ onOpenPaper }: HistoryPanelProps) {
  const { currentPaper } = useApp();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [indexedIds, setIndexedIds] = useState<Set<number>>(new Set());

  const loadPapers = useCallback(async () => {
    const all = await dbService.getAllPapers();
    setPapers(all);
    const checks = await Promise.all(all.map(p => dbService.hasDocChunks(p.id)));
    setIndexedIds(new Set(all.filter((_, i) => checks[i]).map(p => p.id)));
  }, []);

  useEffect(() => {
    loadPapers();
  }, [loadPapers, currentPaper]);

  const handleDelete = async (id: number) => {
    await dbService.deletePaper(id);
    setPapers(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-800">論文履歴</h2>
        <p className="text-xs text-zinc-400 mt-0.5">{papers.length} 件</p>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
        {papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Clock size={20} className="text-zinc-200" />
            <p className="text-xs text-zinc-300">履歴がありません</p>
          </div>
        ) : (
          papers.map(p => (
            <PaperCard
              key={p.id}
              paper={p}
              isActive={currentPaper?.id === p.id}
              isIndexed={indexedIds.has(p.id)}
              onOpen={onOpenPaper}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PaperCard({
  paper: p,
  isActive,
  isIndexed,
  onOpen,
  onDelete,
}: {
  paper: Paper;
  isActive: boolean;
  isIndexed: boolean;
  onOpen: (filePath: string) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div
      className={`group mx-2 my-0.5 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-indigo-50 ring-1 ring-indigo-200'
          : 'hover:bg-zinc-50'
      }`}
      onClick={() => onOpen(p.file_path)}
    >
      <div className="px-3 py-2.5 flex items-start gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isActive ? 'bg-indigo-100' : 'bg-zinc-100 group-hover:bg-zinc-200'
        }`}>
          <FileText size={13} className={isActive ? 'text-indigo-500' : 'text-zinc-400'} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate leading-snug ${
            isActive ? 'text-indigo-800' : 'text-zinc-700'
          }`}>
            {p.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-zinc-400">
              {new Date(p.uploaded_at).toLocaleDateString('ja-JP')}
            </span>
            <span className="text-[10px] text-zinc-300">·</span>
            <span className="text-[10px] text-zinc-400">p.{p.last_opened_page}</span>
            {isIndexed && (
              <>
                <span className="text-[10px] text-zinc-300">·</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500">
                  <CheckCircle2 size={9} />
                  RAG
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onDelete(p.id); }}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-400 hover:bg-red-50 transition-all"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
