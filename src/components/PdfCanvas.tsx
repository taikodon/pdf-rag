import { useRef, useCallback, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface PdfCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pagesRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  hasFile: boolean;
  zoom: number;
  changeZoom: (zoom: number) => void;
}

export function PdfCanvas({ containerRef, pagesRef, isLoading, hasFile, zoom, changeZoom }: PdfCanvasProps) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [containerRef]);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const changeZoomRef = useRef(changeZoom);
  changeZoomRef.current = changeZoom;

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      changeZoomRef.current(zoomRef.current + (e.deltaY > 0 ? -0.1 : 0.1));
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-auto bg-zinc-200 flex flex-col items-center"
      onWheel={handleWheel}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-200/70 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3 bg-white/90 shadow-lg rounded-2xl px-5 py-3">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-zinc-600 font-medium">読み込み中...</span>
          </div>
        </div>
      )}

      {!hasFile && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
          <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center">
            <FileText size={28} className="text-zinc-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-400">PDFを開いてください</p>
            <p className="text-xs text-zinc-300 mt-1">ツールバーの「開く」から選択</p>
          </div>
        </div>
      )}

      <div ref={pagesRef} className="flex flex-col items-center w-full py-6 pb-8 gap-4" />
    </div>
  );
}
