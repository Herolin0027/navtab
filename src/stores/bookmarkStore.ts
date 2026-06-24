import { create } from 'zustand';
import type { BookmarkData, Category, Link, GitHubConfig, AppSettings } from '@/types';
import {
  getLocalData,
  setLocalData,
  getLocalConfig,
  setLocalConfig,
  setLastSync,
} from '@/utils/idb';
import {
  getFile,
  updateFile,
  parseBookmarks,
  stringifyBookmarks,
  decodeContent,
} from '@/utils/githubApi';

interface BookmarkState {
  data: BookmarkData;
  config: GitHubConfig | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  fileSha: string | null;

  // actions
  init: () => Promise<void>;
  loadLocalDataFile: () => Promise<void>;
  setConfig: (config: GitHubConfig) => Promise<void>;
  syncFromGitHub: () => Promise<void>;
  syncToGitHub: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'links'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  reorderCategories: (ids: string[]) => void;
  addLink: (categoryId: string, link: Omit<Link, 'id' | 'createdAt'>) => void;
  updateLink: (categoryId: string, linkId: string, updates: Partial<Link>) => void;
  removeLink: (categoryId: string, linkId: string) => void;
  reorderLinks: (categoryId: string, linkIds: string[]) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getDefaultData(): BookmarkData {
  return {
    settings: {
      theme: 'dark',
      background: 'gradient-blue',
      searchEngine: 'google',
    },
    categories: [],
  };
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  data: getDefaultData(),
  config: null,
  loading: true,
  syncing: false,
  error: null,
  fileSha: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      const [localData, localConfig] = await Promise.all([
        getLocalData(),
        getLocalConfig(),
      ]);

      const data = localData || getDefaultData();
      set({ data, config: localConfig, loading: false });

      if (localConfig) {
        await get().syncFromGitHub();
      } else if (import.meta.env.VITE_DATA_FILE) {
        await get().loadLocalDataFile();
      }
    } catch (err: any) {
      set({ error: err.message || '初始化失败', loading: false });
    }
  },

  loadLocalDataFile: async () => {
    try {
      const response = await fetch(import.meta.env.VITE_DATA_FILE);
      if (!response.ok) throw new Error('文件不存在');
      const content = await response.text();
      const data = parseBookmarks(content);
      await setLocalData(data);
      set({ data, loading: false });
    } catch (err: any) {
      console.log('本地文件加载失败，使用默认数据:', err.message);
    }
  },

  setConfig: async (config) => {
    await setLocalConfig(config);
    set({ config });
    await get().syncFromGitHub();
  },

  syncFromGitHub: async () => {
    const { config } = get();
    if (!config) return;

    set({ syncing: true, error: null });
    try {
      const file = await getFile(config);
      const content = decodeContent(file);
      const data = parseBookmarks(content);
      await setLocalData(data);
      await setLastSync(Date.now());
      set({ data, fileSha: file.sha, syncing: false });
    } catch (err: any) {
      set({ error: err.message || '同步失败', syncing: false });
    }
  },

  syncToGitHub: async () => {
    const { config, data, fileSha } = get();
    if (!config) {
      set({ error: '未配置 GitHub' });
      return;
    }

    set({ syncing: true, error: null });
    try {
      let currentSha = fileSha;
      if (!currentSha) {
        const file = await getFile(config);
        currentSha = file.sha;
      }
      const content = stringifyBookmarks(data);
      await updateFile(config, content, currentSha);
      await setLastSync(Date.now());

      // refresh sha
      const newFile = await getFile(config);
      set({ fileSha: newFile.sha, syncing: false });
    } catch (err: any) {
      set({ error: err.message || '推送失败', syncing: false });
    }
  },

  addCategory: (category) => {
    const newCat: Category = {
      ...category,
      id: generateId(),
      links: [],
    };
    set((state) => ({
      data: {
        ...state.data,
        categories: [...state.data.categories, newCat],
      },
    }));
  },

  updateCategory: (id, updates) => {
    set((state) => ({
      data: {
        ...state.data,
        categories: state.data.categories.map((cat) =>
          cat.id === id ? { ...cat, ...updates } : cat
        ),
      },
    }));
  },

  removeCategory: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        categories: state.data.categories.filter((cat) => cat.id !== id),
      },
    }));
  },

  reorderCategories: (ids) => {
    set((state) => {
      const map = new Map(state.data.categories.map((c) => [c.id, c]));
      const categories = ids
        .map((id) => map.get(id))
        .filter(Boolean)
        .map((cat, index) => ({ ...cat!, order: index }));
      return { data: { ...state.data, categories } };
    });
  },

  addLink: (categoryId, link) => {
    const newLink: Link = {
      ...link,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      data: {
        ...state.data,
        categories: state.data.categories.map((cat) =>
          cat.id === categoryId
            ? { ...cat, links: [...cat.links, newLink] }
            : cat
        ),
      },
    }));
  },

  updateLink: (categoryId, linkId, updates) => {
    set((state) => ({
      data: {
        ...state.data,
        categories: state.data.categories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                links: cat.links.map((link) =>
                  link.id === linkId ? { ...link, ...updates } : link
                ),
              }
            : cat
        ),
      },
    }));
  },

  removeLink: (categoryId, linkId) => {
    set((state) => ({
      data: {
        ...state.data,
        categories: state.data.categories.map((cat) =>
          cat.id === categoryId
            ? { ...cat, links: cat.links.filter((link) => link.id !== linkId) }
            : cat
        ),
      },
    }));
  },

  reorderLinks: (categoryId, linkIds) => {
    set((state) => ({
      data: {
        ...state.data,
        categories: state.data.categories.map((cat) => {
          if (cat.id !== categoryId) return cat;
          const map = new Map(cat.links.map((l) => [l.id, l]));
          const links = linkIds
            .map((id) => map.get(id))
            .filter(Boolean) as Link[];
          return { ...cat, links };
        }),
      },
    }));
  },

  updateSettings: (settings) => {
    set((state) => ({
      data: {
        ...state.data,
        settings: { ...state.data.settings, ...settings },
      },
    }));
  },
}));
