import type { OllamaMessage } from '../types';

export const ollamaService = {
  async listModels(baseUrl: string): Promise<string[]> {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (!res.ok) throw new Error(`Ollama接続エラー: ${res.status}`);
    const data = await res.json() as { models?: { name: string }[] };
    return data.models?.map(m => m.name) ?? [];
  },

  async chat(
    model: string,
    messages: OllamaMessage[],
    onToken: (token: string) => void,
    baseUrl: string
  ): Promise<string> {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
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
    const res = await fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: text }),
    });
    if (!res.ok) throw new Error(`埋め込みエラー: ${res.status}`);
    const data = await res.json() as { embeddings?: number[][]; embedding?: number[] };
    return data.embeddings?.[0] ?? data.embedding ?? [];
  },
};
