import { useEffect, useState, useCallback } from 'react';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { Link as RouterLink } from 'react-router-dom';
import {
  Settings,
  Search,
  Sun,
  Moon,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

const SEARCH_ENGINES: Record<string, { name: string; url: string }> = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
};

export default function Home() {
  const {
    data,
    config,
    loading,
    syncing,
    init,
    syncFromGitHub,
    syncToGitHub,
    updateSettings,
  } = useBookmarkStore();

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.theme]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;
      const engine = SEARCH_ENGINES[data.settings.searchEngine] || SEARCH_ENGINES.google;
      window.location.href = engine.url + encodeURIComponent(query);
    },
    [query, data.settings.searchEngine]
  );

  const toggleTheme = () => {
    updateSettings({
      theme: data.settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = now.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const bgClass =
    data.settings.background === 'gradient-blue'
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900'
      : data.settings.background === 'gradient-purple'
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900'
      : data.settings.background === 'dark-solid'
      ? 'bg-slate-900'
      : 'bg-slate-50';

  return (
    <div
      className={`min-h-screen ${bgClass} transition-colors duration-300 text-slate-100 dark:text-slate-100`}
    >
      {/* Header */}
      <header className="flex items-center justify-end gap-3 px-6 py-4">
        <button
          onClick={() => syncFromGitHub()}
          disabled={syncing}
          className="rounded-xl p-2.5 backdrop-blur-md bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
          title="从 GitHub 同步"
        >
          <RotateCcw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2.5 backdrop-blur-md bg-white/10 hover:bg-white/20 transition"
          title="切换主题"
        >
          {data.settings.theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
        <RouterLink
          to="/admin"
          className="rounded-xl p-2.5 backdrop-blur-md bg-white/10 hover:bg-white/20 transition"
          title="后台管理"
        >
          <Settings className="w-5 h-5" />
        </RouterLink>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* Clock */}
        <div className="text-center mb-10">
          <div className="text-7xl font-light tracking-tight mb-2 tabular-nums">
            {timeStr}
          </div>
          <div className="text-lg opacity-70">{dateStr}</div>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="max-w-2xl mx-auto mb-12 relative"
        >
          <div className="flex items-center rounded-2xl backdrop-blur-xl bg-white/10 border border-white/10 shadow-lg transition-all focus-within:shadow-xl focus-within:bg-white/15">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="pl-4 pr-2 py-3.5 text-sm opacity-80 hover:opacity-100 whitespace-nowrap"
            >
              {SEARCH_ENGINES[data.settings.searchEngine]?.name || 'Google'}
            </button>
            {searchOpen && (
              <div className="absolute top-full left-0 mt-2 w-32 rounded-xl backdrop-blur-xl bg-white/10 border border-white/10 overflow-hidden z-20">
                {Object.entries(SEARCH_ENGINES).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      updateSettings({ searchEngine: key });
                      setSearchOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition"
                  >
                    {val.name}
                  </button>
                ))}
              </div>
            )}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索..."
              className="flex-1 bg-transparent px-2 py-3.5 outline-none text-base placeholder:text-white/40"
            />
            <button
              type="submit"
              className="pr-4 pl-2 py-3.5 opacity-70 hover:opacity-100 transition"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 opacity-60">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            加载中...
          </div>
        )}

        {/* Empty State */}
        {!loading && data.categories.length === 0 && (
          <div className="text-center py-20 opacity-60">
            <p className="mb-4">暂无收藏的网址</p>
            {!config && (
              <RouterLink
                to="/admin/settings"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-blue-500/80 hover:bg-blue-500 transition backdrop-blur-md"
              >
                <Settings className="w-4 h-4" />
                配置 GitHub 同步
              </RouterLink>
            )}
          </div>
        )}

        {/* Categories & Links */}
        <div className="space-y-10">
          {data.categories.map((category, ci) => (
            <section key={category.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-400 to-violet-400" />
                <span className="text-xl font-medium">
                  {category.icon} {category.name}
                </span>
                <span className="text-sm opacity-40">
                  {category.links.length}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {category.links.map((link, li) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-2xl p-4 backdrop-blur-md bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                    style={{
                      animationDelay: `${(ci * 50 + li * 30)}ms`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          link.icon ||
                          `https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=64`
                        }
                        alt=""
                        className="w-8 h-8 rounded-lg object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22%3E%3Ccircle cx=%2212%22 cy=%2212%22 r=%2210%22/%3E%3Cpath d=%22M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z%22/%3E%3Cpath d=%22M2 12h20%22/%3E%3C/svg%3E';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {link.title}
                        </div>
                        {link.description && (
                          <div className="text-xs opacity-50 truncate">
                            {link.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="absolute top-2 right-2 w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition" />
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
