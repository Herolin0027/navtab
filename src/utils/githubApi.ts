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

export async function getFile(config: GitHubConfig): Promise<GitHubFileResponse> {
  const url = `${API_BASE}/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`;
  const res = await fetch(url, {
    headers: getHeaders(config.token),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }
  return res.json();
}

export async function updateFile(
  config: GitHubConfig,
  content: string,
  sha: string,
  message = 'Update bookmarks'
): Promise<void> {
  const url = `${API_BASE}/repos/${config.owner}/${config.repo}/contents/${config.path}`;
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    sha,
    branch: config.branch,
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(config.token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }
}

export async function testConnection(config: GitHubConfig): Promise<boolean> {
  try {
    const url = `${API_BASE}/repos/${config.owner}/${config.repo}`;
    const res = await fetch(url, {
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
