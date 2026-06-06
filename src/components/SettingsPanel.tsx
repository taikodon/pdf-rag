import { useState, useEffect } from 'react';
import { Save, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { storeService } from '../services/store';
import { ollamaService } from '../services/ollama';
import { useApp } from '../contexts/AppContext';

export function SettingsPanel() {
  const { ollamaUrl, setOllamaUrl, llmModel, setLlmModel, embedModel, setEmbedModel } = useApp();

  const [urlInput, setUrlInput] = useState(ollamaUrl);
  const [llmInput, setLlmInput] = useState(llmModel);
  const [embedInput, setEmbedInput] = useState(embedModel);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => { setUrlInput(ollamaUrl); }, [ollamaUrl]);
  useEffect(() => { setLlmInput(llmModel); }, [llmModel]);
  useEffect(() => { setEmbedInput(embedModel); }, [embedModel]);

  async function fetchModels() {
    setFetching(true);
    setError(null);
    try {
      const models = await ollamaService.listModels(urlInput);
      setAvailableModels(models);
      if (models.length > 0 && !llmInput) setLlmInput(models[0]);
    } catch {
      setError('Ollamaに接続できません。`ollama serve` が起動しているか確認してください。');
    } finally {
      setFetching(false);
    }
  }

  async function handleSave() {
    setError(null);
    try {
      await storeService.set('ollamaUrl', urlInput);
      await storeService.set('llmModel', llmInput);
      await storeService.set('embedModel', embedInput);
      setOllamaUrl(urlInput);
      setLlmModel(llmInput);
      setEmbedModel(embedInput);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('設定の保存に失敗しました。');
    }
  }

  return (
    <div className="flex flex-col h-full bg-white p-4 overflow-y-auto">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Ollama 設定</h2>

      <div className="space-y-4">
        {/* Ollama URL */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Ollama URL</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={fetchModels}
              disabled={fetching}
              className="px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
              title="モデル一覧を取得"
            >
              <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* LLM モデル */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">LLM モデル</label>
          {availableModels.length > 0 ? (
            <select
              value={llmInput}
              onChange={e => setLlmInput(e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={llmInput}
              onChange={e => setLlmInput(e.target.value)}
              placeholder="例: llama3, mistral"
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          )}
        </div>

        {/* 埋め込みモデル */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">埋め込みモデル</label>
          <input
            type="text"
            value={embedInput}
            onChange={e => setEmbedInput(e.target.value)}
            placeholder="例: nomic-embed-text"
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            RAG用。`ollama pull nomic-embed-text` で取得できます。
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-1.5 text-xs text-red-600">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? '保存しました' : '保存'}
        </button>
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded text-xs text-blue-700">
        <p className="font-medium mb-1">使い方</p>
        <ol className="space-y-1 text-blue-600 list-decimal list-inside">
          <li>PDFを開く</li>
          <li>「インデックス作成」でRAGを準備</li>
          <li>チャットで論文について質問</li>
        </ol>
      </div>
    </div>
  );
}
