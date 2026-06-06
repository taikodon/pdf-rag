export interface Paper {
  id: number;
  title: string;
  file_path: string;
  last_opened_page: number;
  last_zoom_level: number;
  uploaded_at: string;
}

export interface ChatMessage {
  id: number;
  paper_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface DocChunk {
  id: number;
  paper_id: number;
  chunk_index: number;
  content: string;
  page_number: number;
  embedding: string; // JSON float[]
}

export type SidebarTab = 'reader' | 'history' | 'settings';

export interface AppState {
  windowWidth: number;
  windowHeight: number;
  windowX: number;
  windowY: number;
  lastPaperId: number | null;
  ollamaUrl: string;
  llmModel: string;
  embedModel: string;
}

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
