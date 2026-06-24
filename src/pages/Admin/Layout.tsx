import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import {
  LayoutGrid,
  Link2,
  FolderOpen,
  Settings,
  ArrowLeft,
  Save,
  RotateCcw,
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { syncing, error, syncToGitHub, syncFromGitHub, data } = useBookmarkStore();

  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.theme]);

  const navItems = [
    { to: '/admin/settings', icon: Settings, label: '同步设置' },
    { to: '/admin/categories', icon: FolderOpen, label: '分类管理' },
    { to: '/admin/links', icon: Link2, label: '网址管理' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <LayoutGrid className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">NavTab 后台</span>
          </div>

          <div className="flex items-center gap-2">
            {error && (
              <span className="text-xs text-red-500 bg-red-500/10 px-3 py-1 rounded-full">
                {error}
              </span>
            )}
            <button
              onClick={() => syncFromGitHub()}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              拉取
            </button>
            <button
              onClick={() => syncToGitHub()}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              推送
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block sticky top-14 h-[calc(100vh-3.5rem)] border-r border-slate-200 dark:border-slate-800 p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition ${
                  isActive
                    ? 'text-blue-500'
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
