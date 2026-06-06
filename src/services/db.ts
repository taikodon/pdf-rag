import Database from '@tauri-apps/plugin-sql';
import type { Paper, ChatMessage, DocChunk } from '../types';

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:pdfrag.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(database: Database): Promise<void> {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE,
      last_opened_page INTEGER DEFAULT 1,
      last_zoom_level REAL DEFAULT 1.0,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    )
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS doc_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      embedding TEXT NOT NULL,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    )
  `);
}

export const dbService = {
  async upsertPaper(filePath: string, title: string): Promise<Paper> {
    const database = await getDb();
    const existing = await database.select<Paper[]>(
      'SELECT * FROM papers WHERE file_path = ?',
      [filePath]
    );
    if (existing.length > 0) return existing[0];

    const result = await database.execute(
      'INSERT INTO papers (title, file_path) VALUES (?, ?)',
      [title, filePath]
    );
    const inserted = await database.select<Paper[]>(
      'SELECT * FROM papers WHERE id = ?',
      [result.lastInsertId]
    );
    return inserted[0];
  },

  async getPaper(id: number): Promise<Paper | null> {
    const database = await getDb();
    const rows = await database.select<Paper[]>('SELECT * FROM papers WHERE id = ?', [id]);
    return rows[0] ?? null;
  },

  async getAllPapers(): Promise<Paper[]> {
    const database = await getDb();
    return database.select<Paper[]>('SELECT * FROM papers ORDER BY uploaded_at DESC');
  },

  async updatePaperState(id: number, page: number, zoom: number): Promise<void> {
    const database = await getDb();
    await database.execute(
      'UPDATE papers SET last_opened_page = ?, last_zoom_level = ? WHERE id = ?',
      [page, zoom, id]
    );
  },

  async deletePaper(id: number): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM papers WHERE id = ?', [id]);
  },

  async getChatMessages(paperId: number): Promise<ChatMessage[]> {
    const database = await getDb();
    return database.select<ChatMessage[]>(
      'SELECT * FROM chat_messages WHERE paper_id = ? ORDER BY created_at ASC',
      [paperId]
    );
  },

  async saveChatMessage(paperId: number, role: 'user' | 'assistant', content: string): Promise<ChatMessage> {
    const database = await getDb();
    const result = await database.execute(
      'INSERT INTO chat_messages (paper_id, role, content) VALUES (?, ?, ?)',
      [paperId, role, content]
    );
    const inserted = await database.select<ChatMessage[]>(
      'SELECT * FROM chat_messages WHERE id = ?',
      [result.lastInsertId]
    );
    return inserted[0];
  },

  async deleteChatMessages(paperId: number): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM chat_messages WHERE paper_id = ?', [paperId]);
  },

  async saveDocChunk(
    paperId: number,
    chunkIndex: number,
    content: string,
    pageNumber: number,
    embedding: number[]
  ): Promise<void> {
    const database = await getDb();
    await database.execute(
      'INSERT INTO doc_chunks (paper_id, chunk_index, content, page_number, embedding) VALUES (?, ?, ?, ?, ?)',
      [paperId, chunkIndex, content, pageNumber, JSON.stringify(embedding)]
    );
  },

  async getDocChunks(paperId: number): Promise<DocChunk[]> {
    const database = await getDb();
    return database.select<DocChunk[]>(
      'SELECT * FROM doc_chunks WHERE paper_id = ? ORDER BY chunk_index ASC',
      [paperId]
    );
  },

  async deleteDocChunks(paperId: number): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM doc_chunks WHERE paper_id = ?', [paperId]);
  },

  async hasDocChunks(paperId: number): Promise<boolean> {
    const database = await getDb();
    const rows = await database.select<{ cnt: number }[]>(
      'SELECT COUNT(*) as cnt FROM doc_chunks WHERE paper_id = ?',
      [paperId]
    );
    return (rows[0]?.cnt ?? 0) > 0;
  },
};
