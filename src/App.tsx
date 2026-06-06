import { useState, useEffect, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';
import { getCurrentWindow, PhysicalSize, PhysicalPosition } from '@tauri-apps/api/window';

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

import { AppProvider, useApp } from './contexts/AppContext';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { PdfCanvas } from './components/PdfCanvas';
import { ChatPanel } from './components/ChatPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { usePdfViewer } from './hooks/usePdfViewer';
import { useChat } from './hooks/useChat';
import { dbService } from './services/db';
import { storeService } from './services/store';

function PdfApp() {
  const {
    currentPaper, setCurrentPaper,
    setCurrentPage, setTotalPages,
    setZoomLevel,
    currentPage,
    sidebarTab,
    ollamaUrl, setOllamaUrl,
    llmModel, setLlmModel,
    embedModel, setEmbedModel,
    isIndexed, setIsIndexed,
  } = useApp();

  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [initialPage, setInitialPage] = useState(1);
  const [initialZoom, setInitialZoom] = useState(1.25);

  const {
    containerRef,
    pagesRef,
    pdfDoc,
    currentPage: viewerPage,
    totalPages,
    zoom,
    isLoading,
    loadPdf,
    goToPage,
    changeZoom,
    fitToWidth,
  } = usePdfViewer({
    onPageChange: (page, total) => {
      setCurrentPage(page);
      setTotalPages(total);
    },
  });

  useEffect(() => { setZoomLevel(zoom); }, [zoom, setZoomLevel]);

  // Persist page/zoom changes
  useEffect(() => {
    if (currentPaper && viewerPage > 0) {
      dbService.updatePaperState(currentPaper.id, viewerPage, zoom).catch(() => {});
    }
  }, [viewerPage, zoom, currentPaper]);

  // Initialize: load settings and last paper
  useEffect(() => {
    if (!isTauri()) return;
    (async () => {
      try {
        const url = await storeService.getOllamaUrl();
        const llm = await storeService.getLlmModel();
        const embed = await storeService.getEmbedModel();
        setOllamaUrl(url);
        setLlmModel(llm);
        setEmbedModel(embed);

        // Restore window position/size
        const win = getCurrentWindow();
        const w = await storeService.get('windowWidth');
        const h = await storeService.get('windowHeight');
        if (w > 0 && h > 0) {
          await win.setSize(new PhysicalSize(w, h)).catch(() => {});
        }
        const x = await storeService.get('windowX');
        const y = await storeService.get('windowY');
        if (x !== 0 || y !== 0) {
          await win.setPosition(new PhysicalPosition(x, y)).catch(() => {});
        }

        // Restore last paper
        const lastId = await storeService.getLastPaperId();
        if (lastId) {
          const paper = await dbService.getPaper(lastId);
          if (paper) {
            await openPaperByPath(paper.file_path, paper.last_opened_page, paper.last_zoom_level, paper);
          }
        }
      } catch (e) {
        console.warn('Init error:', e);
      }
    })();
  }, []);

  // Persist window size/position
  useEffect(() => {
    if (!isTauri()) return;
    const win = getCurrentWindow();
    let t: ReturnType<typeof setTimeout>;
    const unsubPromise = win.onResized(async () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        const { width, height } = await win.innerSize();
        await storeService.set('windowWidth', width);
        await storeService.set('windowHeight', height);
      }, 500);
    });
    return () => { unsubPromise.then(f => f()); };
  }, []);

  const openPaperByPath = useCallback(
    async (filePath: string, page = 1, z = 1.25, paper?: typeof currentPaper) => {
      try {
        const bytes = await readFile(filePath);
        const buffer = bytes.buffer as ArrayBuffer;
        const title = filePath.split('/').pop()?.split('\\').pop() ?? filePath;
        const resolvedPaper = paper ?? (await dbService.upsertPaper(filePath, title));
        setCurrentPaper(resolvedPaper);
        setInitialPage(page);
        setInitialZoom(z);
        setFileData(buffer);
        setIsIndexed(false);
        await storeService.setLastPaperId(resolvedPaper.id);
        // Check if already indexed
        const indexed = await dbService.hasDocChunks(resolvedPaper.id);
        setIsIndexed(indexed);
      } catch (e) {
        console.error('Failed to open file:', e);
      }
    },
    [setCurrentPaper, setIsIndexed]
  );

  useEffect(() => {
    if (fileData) {
      loadPdf(fileData, initialPage, initialZoom);
    }
  }, [fileData]);

  const handleOpenFile = useCallback(async () => {
    if (!isTauri()) return;
    const defaultPath = await invoke<string>('get_default_open_path').catch(() => '');
    const selected = await open({
      multiple: false,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      defaultPath: defaultPath || undefined,
    });
    if (!selected || typeof selected !== 'string') return;
    await openPaperByPath(selected);
  }, [openPaperByPath]);

  const chat = useChat({
    paperId: currentPaper?.id ?? null,
    pdfDoc,
    llmModel,
    embedModel,
    ollamaUrl,
    isIndexed,
  });

  // Load chat history when paper changes
  useEffect(() => {
    if (currentPaper) {
      chat.loadHistory(currentPaper.id);
    }
  }, [currentPaper?.id]);

  const handleIndexPaper = async () => {
    await chat.indexPaper();
    setIsIndexed(true);
  };

  const showSubPanel = sidebarTab === 'history' || sidebarTab === 'settings';

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col">
      <div className="flex flex-1 min-h-0">
        {/* Icon sidebar */}
        <Sidebar />

        {/* Sub-panel (history / settings) */}
        {showSubPanel && (
          <div className="w-60 flex-shrink-0 border-r border-zinc-200 flex flex-col overflow-hidden">
            {sidebarTab === 'history' && (
              <HistoryPanel onOpenPaper={(path) => openPaperByPath(path)} />
            )}
            {sidebarTab === 'settings' && <SettingsPanel />}
          </div>
        )}

        {/* PDF viewer */}
        <div className="flex flex-col flex-1 min-w-0">
          <Toolbar
            currentPage={viewerPage || currentPage}
            totalPages={totalPages}
            zoom={zoom}
            filename={currentPaper?.title ?? ''}
            onOpenFile={handleOpenFile}
            onPageChange={goToPage}
            onZoomChange={changeZoom}
            onFitToWidth={fitToWidth}
          />
          <PdfCanvas
            containerRef={containerRef}
            pagesRef={pagesRef}
            isLoading={isLoading}
            hasFile={!!fileData}
            zoom={zoom}
            changeZoom={changeZoom}
          />
        </div>

        {/* RAG Chat panel */}
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
          <ChatPanel
            messages={chat.messages}
            isLoading={chat.isLoading}
            isIndexing={chat.isIndexing}
            indexProgress={chat.indexProgress}
            isIndexed={isIndexed}
            hasPaper={!!currentPaper}
            onSendMessage={chat.sendMessage}
            onIndexPaper={handleIndexPaper}
            onClearMessages={chat.clearMessages}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 bg-white border-t border-zinc-200 flex items-center px-4 gap-4 text-[11px] text-zinc-400 flex-shrink-0">
        <span className="truncate max-w-xs text-zinc-500">{currentPaper?.title ?? '論文未選択'}</span>
        <span className="text-zinc-300">·</span>
        <span>p.{viewerPage || '–'} / {totalPages || '–'}</span>
        <span className="text-zinc-300">·</span>
        <span>{Math.round(zoom * 100)}%</span>
        {isIndexed && (
          <>
            <span className="text-zinc-300">·</span>
            <span className="text-emerald-500 font-medium">RAG ready</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <PdfApp />
    </AppProvider>
  );
}
