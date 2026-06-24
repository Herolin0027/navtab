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
  LayoutGrid,
  Home as HomeIcon,
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
    updateSettings,
  } = useBookmarkStore();

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.theme]);

  useEffect(() => {
    if (data.categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(data.categories[0].id);
    }
  }, [data.categories, activeCategoryId]);

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

  const timeStr = currentTime.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = currentTime.toLocaleDateString('zh-CN', {
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

  const activeCategory = data.categories.find((c) => c.id === activeCategoryId);

  if (data.settings.layout === 'sidebar') {
    return (
      <div className={`min-h-screen ${bgClass} transition-colors duration-300 flex`}>
        {/* 左侧分类栏 */}
        <aside className="w-16 flex flex-col items-center py-4 gap-1 backdrop-blur-xl bg-black/20 border-r border-white/5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2">
            <LayoutGrid className="w-5 h-5 text-white/60" />
          </div>
          
          <div className="w-8 h-px bg-white/10 my-2" />

          {data.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              title={category.name}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                activeCategoryId === category.id
                  ? 'bg-white/20 text-white scale-105'
                  : 'text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {category.icon}
            </button>
          ))}

          <div className="flex-1" />

          <button
            onClick={() => syncFromGitHub()}
            disabled={syncing}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white/80 transition disabled:opacity-50"
            title="同步"
          >
            <RotateCcw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white/80 transition"
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
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white/80 transition"
            title="设置"
          >
            <Settings className="w-5 h-5" />
          </RouterLink>
        </aside>

        {/* 右侧主内容 */}
        <main className="flex-1 flex flex-col items-center px-8 pt-12 pb-8 overflow-auto">
          {/* 时钟 */}
          <div className="text-center mb-6">
            <div className="text-6xl font-light tracking-tight mb-1 tabular-nums text-white">
              {timeStr}
            </div>
            <div className="text-sm text-white/60">{dateStr}</div>
          </div>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="w-full max-w-xl mb-8 relative">
            <div className="flex items-center rounded-2xl backdrop-blur-xl bg-white/10 border border-white/10 shadow-lg transition-all focus-within:shadow-xl focus-within:bg-white/15">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="pl-4 pr-2 py-3 text-sm text-white/70 hover:text-white whitespace-nowrap"
              >
                {SEARCH_ENGINES[data.settings.searchEngine]?.name || 'Google'}
              </button>
              {searchOpen && (
                <div className="absolute top-full left-0 mt-2 w-28 rounded-xl backdrop-blur-xl bg-white/10 border border-white/10 overflow-hidden z-20">
                  {Object.entries(SEARCH_ENGINES).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        updateSettings({ searchEngine: key });
                        setSearchOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
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
                className="flex-1 bg-transparent px-2 py-3 outline-none text-base text-white placeholder:text-white/40"
              />
              <button
                type="submit"
                className="pr-4 pl-2 py-3 text-white/60 hover:text-white transition"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Loading */}
          {loading && (
            <div className="text-center py-20 text-white/60">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
              加载中...
            </div>
          )}

          {/* 空状态 */}
          {!loading && data.categories.length === 0 && (
            <div className="text-center py-20 text-white/60">
              <p className="mb-4">暂无收藏的网址</p>
              {!config && (
                <RouterLink
                  to="/admin/settings"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-blue-500/80 hover:bg-blue-500 transition backdrop-blur-md text-white"
                >
                  <Settings className="w-4 h-4" />
                  配置 GitHub 同步
                </RouterLink>
              )}
            </div>
          )}

          {/* 当前分类的网址图标 */}
          {!loading && activeCategory && activeCategory.links.length > 0 && (
            <div className="w-full max-w-4xl">
              <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-12 gap-5 justify-items-center">
                {activeCategory.links.map((link, idx) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 w-full"
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10 group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-lg transition-all duration-200">
                      <img
                        src={
                          link.icon ||
                          `https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=64`
                        }
                        alt=""
                        className="w-7 h-7 rounded object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222%22%3E%3Ccircle cx=%2212%22 cy=%2212%22 r=%2210%22/%3E%3Cpath d=%22M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z%22/%3E%3Cpath d=%22M2 12h20%22/%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <span className="text-xs text-white/70 group-hover:text-white text-center truncate w-full transition-colors">
                      {link.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 空分类提示 */}
          {!loading && activeCategory && activeCategory.links.length === 0 && (
            <div className="text-center py-16 text-white/40">
              <HomeIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>该分类下暂无网址</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // 默认顶部布局
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
