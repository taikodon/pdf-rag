import { useState, useEffect } from 'react';
import { Save, Check, RefreshCw, AlertCircle, Server, Cpu, Layers, Wifi, ExternalLink } from 'lucide-react';
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
  const [detecting, setDetecting] = useState(false);
  const [pingStatus, setPingStatus] = useState<'ok' | 'ng' | null>(null);

  useEffect(() => { setUrlInput(ollamaUrl); }, [ollamaUrl]);
  useEffect(() => { setLlmInput(llmModel); }, [llmModel]);
  useEffect(() => { setEmbedInput(embedModel); }, [embedModel]);

  async function handleDetect() {
    setDetecting(true);
    setError(null);
    setPingStatus(null);
    const detected = await ollamaService.detectUrl();
    if (detected) {
      setUrlInput(detected);
      setPingStatus('ok');
      // モデルも取得
      try {
        const models = await ollamaService.listModels(detected);
        setAvailableModels(models);
        if (models.length > 0 && !llmInput) setLlmInput(models[0]);
      } catch { /* ignore */ }
    } else {
      setPingStatus('ng');
      setError('Ollamaが見つかりませんでした。ollama serve を起動してから再試行してください。');
    }
    setDetecting(false);
  }

  async function fetchModels() {
    setFetching(true);
    setError(null);
    try {
      const models = await ollamaService.listModels(urlInput);
      setAvailableModels(models);
      setPingStatus('ok');
      if (models.length > 0 && !llmInput) setLlmInput(models[0]);
    } catch {
      setPingStatus('ng');
      setError('Ollamaに接続できません。URLを確認してください。');
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

        {/* セットアップ手順 */}
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
          <p className="text-xs font-semibold text-indigo-700">はじめに（未設定の場合）</p>
          <ol className="space-y-1.5">
            {[
              { text: 'Ollamaをインストール', href: 'https://ollama.com' },
              { text: 'ollama serve を起動' },
              { text: 'ollama pull llama3.2' },
              { text: 'ollama pull nomic-embed-text' },
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-indigo-600 font-mono">{step.text}</span>
                {step.href && <ExternalLink size={10} className="text-indigo-400 flex-shrink-0 mt-1" />}
              </li>
            ))}
          </ol>
        </div>

        {/* Ollama URL */}
        <Field icon={<Server size={13} />} label="Ollama URL">
          <div className="flex gap-1.5">
            <div className="flex-1 relative">
              <input
                type="text"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setPingStatus(null); }}
                className={inputCls}
              />
              {pingStatus && (
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium ${pingStatus === 'ok' ? 'text-emerald-500' : 'text-red-400'}`}>
                  {pingStatus === 'ok' ? '接続OK' : 'NG'}
                </span>
              )}
            </div>
            <button
              onClick={fetchModels}
              disabled={fetching}
              title="接続確認 & モデル取得"
              className="px-2.5 h-8 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-500 hover:text-zinc-700 flex-shrink-0 transition-colors"
            >
              <RefreshCw size={13} className={fetching ? 'animate-spin' : ''} />
            </button>
          </div>
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
          >
            <Wifi size={11} className={detecting ? 'animate-pulse' : ''} />
            {detecting ? '検出中...' : 'URLを自動検出（WSL2対応）'}
          </button>
        </Field>

        {/* LLM モデル */}
        <Field icon={<Cpu size={13} />} label="LLM モデル（チャット用）">
          {availableModels.length > 0 ? (
            <select value={llmInput} onChange={e => setLlmInput(e.target.value)} className={inputCls}>
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={llmInput}
              onChange={e => setLlmInput(e.target.value)}
              placeholder="例: llama3.2, mistral"
              className={inputCls}
            />
          )}
        </Field>

        {/* 埋め込みモデル */}
        <Field icon={<Layers size={13} />} label="埋め込みモデル（RAG用）">
          <input
            type="text"
            value={embedInput}
            onChange={e => setEmbedInput(e.target.value)}
            placeholder="nomic-embed-text"
            className={inputCls}
          />
          <p className="text-[10px] text-zinc-400 mt-1">
            RAGに必須。<code className="bg-zinc-100 px-1 rounded text-zinc-500">ollama pull nomic-embed-text</code>
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
    </div>
  );
}

const inputCls =
  'w-full h-8 border border-zinc-200 rounded-lg px-3 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all';

function Field({
  icon, label, children,
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
