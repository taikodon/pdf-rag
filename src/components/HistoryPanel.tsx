import { useState, useEffect, useCallback } from 'react';
import { FileText, Trash2, CheckCircle } from 'lucide-react';
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
      <div className="px-3 py-2.5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">論文履歴</h2>
        <p className="text-xs text-gray-400 mt-0.5">{papers.length}件</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {papers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-300 text-xs">
            <p>履歴がありません</p>
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
      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
        isActive ? 'bg-blue-50' : ''
      }`}
      onClick={() => onOpen(p.file_path)}
    >
      <div className="px-3 py-3 flex items-start gap-2">
        <FileText size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-800 truncate">{p.title}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {new Date(p.uploaded_at).toLocaleDateString('ja-JP')}
            {' · '}p.{p.last_opened_page}
          </p>
          {isIndexed && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 mt-0.5">
              <CheckCircle size={10} />
              インデックス済
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(p.id); }}
          className="p-1 text-gray-300 hover:text-red-400 flex-shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
