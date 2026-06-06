import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Paper, SidebarTab } from '../types';

interface AppContextValue {
  currentPaper: Paper | null;
  setCurrentPaper: (paper: Paper | null) => void;

  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (total: number) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;

  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;

  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
  llmModel: string;
  setLlmModel: (model: string) => void;
  embedModel: string;
  setEmbedModel: (model: string) => void;

  isIndexed: boolean;
  setIsIndexed: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPaper, setCurrentPaper] = useState<Paper | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.25);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('reader');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [llmModel, setLlmModel] = useState('');
  const [embedModel, setEmbedModel] = useState('nomic-embed-text');
  const [isIndexed, setIsIndexed] = useState(false);

  return (
    <AppContext.Provider
      value={{
        currentPaper, setCurrentPaper,
        currentPage, setCurrentPage,
        totalPages, setTotalPages,
        zoomLevel, setZoomLevel,
        sidebarTab, setSidebarTab,
        ollamaUrl, setOllamaUrl,
        llmModel, setLlmModel,
        embedModel, setEmbedModel,
        isIndexed, setIsIndexed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
