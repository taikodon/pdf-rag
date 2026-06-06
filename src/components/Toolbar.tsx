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
  const [jumpInput, setJumpInput] = useState('');
  const pageInputRef = useRef<HTMLInputElement>(null);

  function handlePageSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p)) onPageChange(p);
    setPageInput('');
    pageInputRef.current?.blur();
  }

  function handleJumpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p)) onPageChange(p);
    setJumpInput('');
  }

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 text-sm flex-shrink-0">
      {/* ブランド */}
      <span className="font-bold text-blue-600 text-sm tracking-tight mr-1">PDF RAG</span>

      <div className="w-px h-5 bg-gray-200" />

      {/* ファイルを開く */}
      <button
        onClick={onOpenFile}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 text-gray-700"
      >
        <FolderOpen size={15} />
        <span>ファイルを開く</span>
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* ページナビゲーション */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage <= 1}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>

      <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
        <input
          ref={pageInputRef}
          type="text"
          value={pageInput || String(currentPage)}
          onChange={e => setPageInput(e.target.value)}
          onFocus={() => setPageInput(String(currentPage))}
          onBlur={() => setPageInput('')}
          className="w-10 text-center border border-gray-300 rounded py-0.5 text-sm"
        />
        <span className="text-gray-500">/ {totalPages}</span>
      </form>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage >= totalPages}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
      >
        <ChevronsRight size={16} />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* ズーム */}
      <button onClick={() => onZoomChange(zoom - 0.1)} className="p-1 rounded hover:bg-gray-100">
        <ZoomOut size={16} />
      </button>
      <span className="w-14 text-center border border-gray-300 rounded py-0.5 text-sm">
        {zoomPercent}%
      </span>
      <button onClick={() => onZoomChange(zoom + 0.1)} className="p-1 rounded hover:bg-gray-100">
        <ZoomIn size={16} />
      </button>

      <button
        onClick={onFitToWidth}
        className="flex items-center gap-1 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-700"
      >
        <Maximize2 size={14} />
        <span>幅に合わせる</span>
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* ページジャンプ */}
      <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
        <input
          type="number"
          placeholder="ページ"
          value={jumpInput}
          onChange={e => setJumpInput(e.target.value)}
          className="w-16 border border-gray-300 rounded py-0.5 px-1 text-sm"
          min={1}
          max={totalPages}
        />
        <button
          type="submit"
          className="px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          移動
        </button>
      </form>

      {filename && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <span className="text-gray-500 truncate max-w-xs">{filename}</span>
        </>
      )}
    </div>
  );
}
