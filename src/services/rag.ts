import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ollamaService } from './ollama';
import { dbService } from './db';

interface PageText {
  page: number;
  text: string;
}

interface Chunk {
  content: string;
  page: number;
  index: number;
}

export const ragService = {
  async extractPages(pdfDoc: PDFDocumentProxy): Promise<PageText[]> {
    const pages: PageText[] = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map(item => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) pages.push({ page: i, text });
    }
    return pages;
  },

  chunkPages(pages: PageText[], size = 400, overlap = 50): Chunk[] {
    const chunks: Chunk[] = [];
    let chunkIndex = 0;
    for (const { page, text } of pages) {
      const words = text.split(' ');
      let i = 0;
      while (i < words.length) {
        const slice = words.slice(i, i + size).join(' ').trim();
        if (slice.length > 20) {
          chunks.push({ content: slice, page, index: chunkIndex++ });
        }
        i += size - overlap;
        if (i + size > words.length && i < words.length) i = Math.max(0, words.length - size);
        else if (i >= words.length) break;
      }
    }
    return chunks;
  },

  async indexPaper(
    paperId: number,
    pdfDoc: PDFDocumentProxy,
    embedModel: string,
    ollamaUrl: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    await dbService.deleteDocChunks(paperId);

    const pages = await this.extractPages(pdfDoc);
    const chunks = this.chunkPages(pages);

    for (let i = 0; i < chunks.length; i++) {
      const { content, page, index } = chunks[i];
      onProgress?.(i + 1, chunks.length);
      const embedding = await ollamaService.embed(embedModel, content, ollamaUrl);
      await dbService.saveDocChunk(paperId, index, content, page, embedding);
    }
  },

  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  },

  async searchChunks(
    paperId: number,
    query: string,
    embedModel: string,
    ollamaUrl: string,
    topK = 3
  ): Promise<string[]> {
    const queryEmbed = await ollamaService.embed(embedModel, query, ollamaUrl);
    const chunks = await dbService.getDocChunks(paperId);
    const scored = chunks.map(chunk => ({
      content: chunk.content,
      score: this.cosineSimilarity(queryEmbed, JSON.parse(chunk.embedding) as number[]),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(c => c.content);
  },
};
