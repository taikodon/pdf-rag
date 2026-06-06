import { load, Store } from '@tauri-apps/plugin-store';
import type { AppState } from '../types';

let storeInstance: Store | null = null;

async function getStore(): Promise<Store> {
  if (!storeInstance) {
    storeInstance = await load('app-state.json', { defaults: DEFAULTS });
  }
  return storeInstance;
}

const DEFAULTS: AppState = {
  windowWidth: 1440,
  windowHeight: 900,
  windowX: 0,
  windowY: 0,
  lastPaperId: null,
  ollamaUrl: 'http://localhost:11434',
  llmModel: '',
  embedModel: 'nomic-embed-text',
};

export const storeService = {
  async get<K extends keyof AppState>(key: K): Promise<AppState[K]> {
    const store = await getStore();
    const value = await store.get<AppState[K]>(key);
    return value ?? DEFAULTS[key];
  },

  async set<K extends keyof AppState>(key: K, value: AppState[K]): Promise<void> {
    const store = await getStore();
    await store.set(key, value);
    await store.save();
  },

  async getLastPaperId(): Promise<number | null> {
    return this.get('lastPaperId');
  },

  async setLastPaperId(id: number | null): Promise<void> {
    return this.set('lastPaperId', id);
  },

  async getOllamaUrl(): Promise<string> {
    return this.get('ollamaUrl');
  },

  async getLlmModel(): Promise<string> {
    return this.get('llmModel');
  },

  async getEmbedModel(): Promise<string> {
    return this.get('embedModel');
  },
};
