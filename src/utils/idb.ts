import { get, set, del } from 'idb-keyval';
import type { BookmarkData, GitHubConfig } from '@/types';

const KEYS = {
  DATA: 'navtab:data',
  CONFIG: 'navtab:config',
  LAST_SYNC: 'navtab:lastSync',
};

export async function getLocalData(): Promise<BookmarkData | null> {
  return get(KEYS.DATA);
}

export async function setLocalData(data: BookmarkData): Promise<void> {
  return set(KEYS.DATA, data);
}

export async function clearLocalData(): Promise<void> {
  return del(KEYS.DATA);
}

export async function getLocalConfig(): Promise<GitHubConfig | null> {
  return get(KEYS.CONFIG);
}

export async function setLocalConfig(config: GitHubConfig): Promise<void> {
  return set(KEYS.CONFIG, config);
}

export async function clearLocalConfig(): Promise<void> {
  return del(KEYS.CONFIG);
}

export async function getLastSync(): Promise<number | null> {
  return get(KEYS.LAST_SYNC);
}

export async function setLastSync(time: number): Promise<void> {
  return set(KEYS.LAST_SYNC, time);
}
