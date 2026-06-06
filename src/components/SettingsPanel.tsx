import { useState, useEffect } from 'react';
import { Save, Check, RefreshCw, AlertCircle, Server, Cpu, Layers } from 'lucide-react';
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
      setError('Ollamaに接続できません。ollama serve が起動しているか確認してください。');
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
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      <div className="px-4 py-3 border-b border-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-800">設定</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Ollama 接続と使用モデル</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Ollama URL */}
        <Field icon={<Server size={13} />} label="Ollama URL">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className={inputCls}
            />
            <button
              onClick={fetchModels}
              disabled={fetching}
              title="モデル一覧を取得"
              className="px-2.5 h-8 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-500 hover:text-zinc-700 flex-shrink-0 transition-colors"
            >
              <RefreshCw size={13} className={fetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </Field>

        {/* LLM モデル */}
        <Field icon={<Cpu size={13} />} label="LLM モデル">
          {availableModels.length > 0 ? (
            <select
              value={llmInput}
              onChange={e => setLlmInput(e.target.value)}
              className={inputCls}
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
              className={inputCls}
            />
          )}
        </Field>

        {/* 埋め込みモデル */}
        <Field icon={<Layers size={13} />} label="埋め込みモデル">
          <input
            type="text"
            value={embedInput}
            onChange={e => setEmbedInput(e.target.value)}
            placeholder="例: nomic-embed-text"
            className={inputCls}
          />
          <p className="text-[10px] text-zinc-400 mt-1.5">
            RAG用。<code className="bg-zinc-100 px-1 rounded text-zinc-500">ollama pull nomic-embed-text</code> で取得
          </p>
        </Field>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-4 h-8 rounded-lg text-sm font-medium transition-all ${
            saved
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
          }`}
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? '保存しました' : '保存'}
        </button>
      </div>

      {/* 使い方 */}
      <div className="mx-4 mb-4 p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl">
        <p className="text-xs font-semibold text-zinc-600 mb-2">使い方</p>
        <ol className="space-y-1.5">
          {[
            'PDFを「開く」から選択',
            '「インデックス」でRAGを準備',
            'チャットで論文について質問',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-xs text-zinc-500">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const inputCls =
  'w-full h-8 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all';

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-1.5">
        <span className="text-zinc-400">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
