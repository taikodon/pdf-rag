import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FolderOpen,
} from 'lucide-react';

interface ToolbarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  filename: string;
  onOpenFile: () => void;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onFitToWidth: () => void;
}

export function Toolbar({
  currentPage,
  totalPages,
  zoom,
  filename,
  onOpenFile,
  onPageChange,
  onZoomChange,
  onFitToWidth,
}: ToolbarProps) {
  const [pageInput, setPageInput] = useState('');
  const pageInputRef = useRef<HTMLInputElement>(null);

  function handlePageSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p)) onPageChange(p);
    setPageInput('');
    pageInputRef.current?.blur();
  }

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex items-center gap-1.5 px-3 h-11 bg-white border-b border-zinc-200/80 flex-shrink-0 shadow-sm">
      {/* ファイルを開く */}
      <button
        onClick={onOpenFile}
        className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-colors shadow-sm shadow-indigo-500/30"
      >
        <FolderOpen size={13} />
        開く
      </button>

      <Sep />

      {/* ページナビゲーション */}
      <IconBtn onClick={() => onPageChange(1)} disabled={currentPage <= 1} title="最初のページ">
        <ChevronsLeft size={15} />
      </IconBtn>
      <IconBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} title="前のページ">
        <ChevronLeft size={15} />
      </IconBtn>

      <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
        <input
          ref={pageInputRef}
          type="text"
          value={pageInput || String(currentPage)}
          onChange={e => setPageInput(e.target.value)}
          onFocus={() => setPageInput(String(currentPage))}
          onBlur={() => setPageInput('')}
          className="w-9 h-6 text-center border border-zinc-200 rounded-md text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 bg-zinc-50"
        />
        <span className="text-xs text-zinc-400">/ {totalPages || '–'}</span>
      </form>

      <IconBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} title="次のページ">
        <ChevronRight size={15} />
      </IconBtn>
      <IconBtn onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages} title="最後のページ">
        <ChevronsRight size={15} />
      </IconBtn>

      <Sep />

      {/* ズーム */}
      <IconBtn onClick={() => onZoomChange(zoom - 0.1)} title="縮小">
        <ZoomOut size={15} />
      </IconBtn>
      <span className="w-12 h-6 flex items-center justify-center border border-zinc-200 rounded-md text-xs text-zinc-600 bg-zinc-50">
        {zoomPercent}%
      </span>
      <IconBtn onClick={() => onZoomChange(zoom + 0.1)} title="拡大">
        <ZoomIn size={15} />
      </IconBtn>

      <button
        onClick={onFitToWidth}
        title="幅に合わせる"
        className="flex items-center gap-1 px-2 h-6 rounded-md border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 text-xs transition-colors"
      >
        <Maximize2 size={12} />
        幅合わせ
      </button>

      {/* ファイル名 */}
      {filename && (
        <>
          <Sep />
          <span className="text-xs text-zinc-400 truncate max-w-xs">{filename}</span>
        </>
      )}
    </div>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-zinc-200 mx-0.5 flex-shrink-0" />;
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-25 transition-colors"
    >
      {children}
    </button>
  );
}
