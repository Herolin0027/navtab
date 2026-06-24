export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
  branch: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  background: string;
  searchEngine: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  links: Link[];
}

export interface BookmarkData {
  settings: AppSettings;
  categories: Category[];
}

export interface GitHubFileResponse {
  content: string;
  sha: string;
  name: string;
  path: string;
}
