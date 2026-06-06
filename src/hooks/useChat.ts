import { useState, useCallback, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ChatMessage } from '../types';
import { dbService } from '../services/db';
import { ollamaService } from '../services/ollama';
import { ragService } from '../services/rag';

interface UseChatOptions {
  paperId: number | null;
  pdfDoc: PDFDocumentProxy | null;
  llmModel: string;
  embedModel: string;
  ollamaUrl: string;
  isIndexed: boolean;
}

export function useChat({ paperId, pdfDoc, llmModel, embedModel, ollamaUrl, isIndexed }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState({ current: 0, total: 0 });
  const [indexError, setIndexError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const loadHistory = useCallback(async (id: number) => {
    const history = await dbService.getChatMessages(id);
    setMessages(history);
  }, []);

  const indexPaper = useCallback(async (): Promise<boolean> => {
    if (!paperId || !pdfDoc) return false;
    setIsIndexing(true);
    setIndexError(null);
    setIndexProgress({ current: 0, total: 0 });
    try {
      await ragService.indexPaper(paperId, pdfDoc, embedModel, ollamaUrl, (current, total) => {
        setIndexProgress({ current, total });
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'インデックス作成に失敗しました';
      setIndexError(msg);
      return false;
    } finally {
      setIsIndexing(false);
    }
  }, [paperId, pdfDoc, embedModel, ollamaUrl]);

  const sendMessage = useCallback(async (question: string) => {
    if (!paperId || isLoading || !question.trim()) return;
    setIsLoading(true);

    const tempUserId = -(Date.now());
    const tempAssistId = -(Date.now() + 1);
    const now = new Date().toISOString();

    setMessages(prev => [
      ...prev,
      { id: tempUserId, paper_id: paperId, role: 'user', content: question, created_at: now },
      { id: tempAssistId, paper_id: paperId, role: 'assistant', content: '', created_at: now },
    ]);

    try {
      let contextText = '';
      if (isIndexed) {
        const chunks = await ragService.searchChunks(paperId, question, embedModel, ollamaUrl);
        contextText = chunks.join('\n\n---\n\n');
      }

      const systemPrompt = contextText
        ? `あなたは論文の内容を分析する研究者です。以下の論文の抜粋を参考に、質問に日本語で回答してください。文脈に関連する情報がない場合はその旨を伝えてください。\n\n【論文の抜粋】\n${contextText}`
        : 'あなたは論文の内容を分析する研究者です。質問に日本語で回答してください。';

      const history = messagesRef.current
        .filter(m => m.id !== tempUserId && m.id !== tempAssistId)
        .slice(-8);

      const ollamaMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: question },
      ];

      let fullResponse = '';
      await ollamaService.chat(llmModel, ollamaMessages, (token) => {
        fullResponse += token;
        setMessages(prev =>
          prev.map(m => m.id === tempAssistId ? { ...m, content: fullResponse } : m)
        );
      }, ollamaUrl);

      await dbService.saveChatMessage(paperId, 'user', question);
      const saved = await dbService.saveChatMessage(paperId, 'assistant', fullResponse);
      setMessages(prev =>
        prev.map(m => m.id === tempAssistId ? { ...saved } : m.id === tempUserId ? { ...m, id: saved.id - 1 } : m)
      );
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'エラーが発生しました';
      setMessages(prev =>
        prev.map(m => m.id === tempAssistId ? { ...m, content: `エラー: ${errorMsg}` } : m)
      );
    } finally {
      setIsLoading(false);
    }
  }, [paperId, isLoading, isIndexed, embedModel, ollamaUrl, llmModel]);

  const clearMessages = useCallback(async () => {
    if (!paperId) return;
    await dbService.deleteChatMessages(paperId);
    setMessages([]);
  }, [paperId]);

  return { messages, isLoading, isIndexing, indexProgress, indexError, loadHistory, indexPaper, sendMessage, clearMessages };
}
