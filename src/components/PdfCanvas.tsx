import { useRef, useCallback, useEffect } from 'react';

interface PdfCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pagesRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  hasFile: boolean;
  zoom: number;
  changeZoom: (zoom: number) => void;
}

export function PdfCanvas({ containerRef, pagesRef, isLoading, hasFile, zoom, changeZoom }: PdfCanvasProps) {
  // Ctrl+ホイールでズーム (passive: false が必要)
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
      className="relative flex-1 overflow-auto bg-gray-400 flex flex-col items-center"
      onWheel={handleWheel}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-400/60 z-10">
          <span className="text-white text-sm bg-black/40 px-4 py-2 rounded">読み込み中...</span>
        </div>
      )}

      {!hasFile && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-gray-200">
          <p className="text-lg font-medium">PDFファイルを開いてください</p>
          <p className="text-sm mt-2 text-gray-300">左上の「ファイルを開く」から選択</p>
        </div>
      )}

      <div ref={pagesRef} className="flex flex-col items-center w-full py-6 pb-8 gap-3" />
    </div>
  );
}
