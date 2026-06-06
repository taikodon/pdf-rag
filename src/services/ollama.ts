import type { OllamaMessage } from '../types';

const TIMEOUT_MS = 30_000;

function withTimeout(ms: number): AbortController {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl;
}

export const ollamaService = {
  async listModels(baseUrl: string): Promise<string[]> {
    const ctrl = withTimeout(5_000);
    const res = await fetch(`${baseUrl}/api/tags`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Ollama接続エラー: ${res.status}`);
    const data = await res.json() as { models?: { name: string }[] };
    return data.models?.map(m => m.name) ?? [];
  },

  async ping(baseUrl: string): Promise<boolean> {
    try {
      const ctrl = withTimeout(3_000);
      const res = await fetch(`${baseUrl}/api/tags`, { signal: ctrl.signal });
      return res.ok;
    } catch {
      return false;
    }
  },

  async chat(
    model: string,
    messages: OllamaMessage[],
    onToken: (token: string) => void,
    baseUrl: string
  ): Promise<string> {
    const ctrl = withTimeout(TIMEOUT_MS);
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`LLMエラー: ${res.status}`);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data = JSON.parse(line) as { message?: { content: string }; done?: boolean };
          if (data.message?.content) {
            onToken(data.message.content);
            fullText += data.message.content;
          }
        } catch {
          // 不完全な JSON は無視
        }
      }
    }
    return fullText;
  },

  async embed(model: string, text: string, baseUrl: string): Promise<number[]> {
    const ctrl = withTimeout(TIMEOUT_MS);
    const res = await fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: text }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`埋め込みエラー: ${res.status}`);
    const data = await res.json() as { embeddings?: number[][]; embedding?: number[] };
    return data.embeddings?.[0] ?? data.embedding ?? [];
  },
};
