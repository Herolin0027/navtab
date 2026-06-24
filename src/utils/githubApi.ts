import type { GitHubConfig, GitHubFileResponse, BookmarkData } from '@/types';
import yaml from 'js-yaml';

const API_BASE = 'https://api.github.com';

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

// Gist API - 支持 CORS
const GIST_API = 'https://api.github.com/gists';

interface GistFile {
  content: string;
}

interface GistResponse {
  id: string;
  files: Record<string, GistFile>;
}

// 从 Gist 获取文件内容
export async function getFile(config: GitHubConfig): Promise<GitHubFileResponse> {
  // config.repo 作为 Gist ID 使用
  const res = await fetch(`${GIST_API}/${config.repo}`, {
    headers: getHeaders(config.token),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }
  const gist: GistResponse = await res.json();
  const fileName = config.path || 'bookmarks.yml';
  const file = gist.files[fileName];

  if (!file) {
    throw new Error(`File ${fileName} not found in gist`);
  }

  return {
    content: btoa(unescape(encodeURIComponent(file.content))),
    sha: gist.id,
    name: fileName,
    path: fileName,
  };
}

export async function updateFile(
  config: GitHubConfig,
  content: string,
  sha: string,
  message = 'Update bookmarks'
): Promise<{ sha: string }> {
  const fileName = config.path || 'bookmarks.yml';
  const url = `${GIST_API}/${config.repo}`;
  const body = {
    description: message,
    files: {
      [fileName]: {
        content,
      },
    },
  };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(config.token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }
  const gist: GistResponse = await res.json();
  return { sha: gist.id };
}

// 创建新的 Gist
export async function createGist(
  config: GitHubConfig,
  content: string,
  message = 'Initial bookmarks'
): Promise<{ sha: string }> {
  const fileName = config.path || 'bookmarks.yml';
  const body = {
    description: message,
    public: false,
    files: {
      [fileName]: {
        content,
      },
    },
  };
  const res = await fetch(GIST_API, {
    method: 'POST',
    headers: getHeaders(config.token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }
  const gist: GistResponse = await res.json();
  return { sha: gist.id };
}

export async function testConnection(config: GitHubConfig): Promise<boolean> {
  try {
    // 测试 Gist 是否可访问
    const res = await fetch(`${GIST_API}/${config.repo}`, {
      headers: getHeaders(config.token),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function decodeContent(file: GitHubFileResponse): string {
  if (file.content) {
    return decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
  }
  return '';
}

export function parseBookmarks(yamlContent: string): BookmarkData {
  const parsed = yaml.load(yamlContent) as any;
  return {
    settings: {
      theme: parsed.settings?.theme || 'dark',
      background: parsed.settings?.background || 'gradient-blue',
      searchEngine: parsed.settings?.search_engine || 'google',
    },
    categories: (parsed.categories || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      order: cat.order ?? 0,
      links: (cat.links || []).map((link: any) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description,
        icon: link.icon,
        createdAt: link.created_at,
      })),
    })),
  };
}

export function stringifyBookmarks(data: BookmarkData): string {
  const output = {
    settings: {
      theme: data.settings.theme,
      background: data.settings.background,
      search_engine: data.settings.searchEngine,
    },
    categories: data.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      order: cat.order,
      links: cat.links.map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description,
        icon: link.icon,
        created_at: link.createdAt,
      })),
    })),
  };
  return yaml.dump(output, { indent: 2, lineWidth: -1 });
}
