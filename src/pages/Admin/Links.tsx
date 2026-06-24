import { useState } from 'react';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Search,
} from 'lucide-react';

export default function AdminLinks() {
  const { data, addLink, updateLink, removeLink } = useBookmarkStore();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [form, setForm] = useState({
    title: '',
    url: '',
    description: '',
    icon: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    url: '',
    description: '',
    icon: '',
  });

  const filteredCategories = data.categories.map((cat) => ({
    ...cat,
    links: cat.links.filter(
      (link) =>
        link.title.toLowerCase().includes(search.toLowerCase()) ||
        link.url.toLowerCase().includes(search.toLowerCase()) ||
        (link.description || '').toLowerCase().includes(search.toLowerCase())
    ),
  }));

  const handleAdd = () => {
    if (!form.title.trim() || !form.url.trim() || !selectedCategory) return;
    addLink(selectedCategory, {
      title: form.title.trim(),
      url: form.url.trim(),
      description: form.description.trim() || undefined,
      icon: form.icon.trim() || undefined,
    });
    setForm({ title: '', url: '', description: '', icon: '' });
    setShowAdd(false);
  };

  const startEdit = (link: {
    id: string;
    title: string;
    url: string;
    description?: string;
    icon?: string;
  }) => {
    setEditingId(link.id);
    setEditForm({
      title: link.title,
      url: link.url,
      description: link.description || '',
      icon: link.icon || '',
    });
  };

  const saveEdit = (categoryId: string, linkId: string) => {
    updateLink(categoryId, linkId, {
      title: editForm.title.trim(),
      url: editForm.url.trim(),
      description: editForm.description.trim() || undefined,
      icon: editForm.icon.trim() || undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">网址管理</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            管理收藏的网址
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          <Plus className="w-4 h-4" />
          添加网址
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索网址..."
          className="w-full rounded-xl pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-5 space-y-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
          >
            <option value="">选择分类</option>
            {data.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="名称"
              className="rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
            />
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="描述（可选）"
              className="rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
            />
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="图标 URL（可选）"
              className="rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-xl px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="rounded-xl px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              添加
            </button>
          </div>
        </div>
      )}

      {/* Links List */}
      <div className="space-y-6">
        {data.categories.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            还没有分类，先去{' '}
            <a href="#/admin/categories" className="text-blue-500 hover:underline">
              创建分类
            </a>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{cat.icon}</span>
                <span className="font-medium">{cat.name}</span>
                <span className="text-xs text-slate-400">({cat.links.length})</span>
              </div>
              {cat.links.length > 0 ? (
                <div className="space-y-2">
                  {cat.links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      {editingId === link.id ? (
                        <>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm({ ...editForm, title: e.target.value })
                              }
                              className="rounded-lg px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-sm"
                            />
                            <input
                              value={editForm.url}
                              onChange={(e) =>
                                setEditForm({ ...editForm, url: e.target.value })
                              }
                              className="rounded-lg px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-sm"
                            />
                          </div>
                          <button
                            onClick={() => saveEdit(cat.id, link.id)}
                            className="rounded-lg p-1.5 text-green-500 hover:bg-green-500/10 transition"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <img
                            src={
                              link.icon ||
                              `https://www.google.com/s2/favicons?domain=${
                                new URL(link.url).hostname
                              }&sz=64`
                            }
                            alt=""
                            className="w-6 h-6 rounded object-contain shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {link.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {link.url}
                            </div>
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => startEdit(link)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('确定删除此网址吗？')) {
                                removeLink(cat.id, link.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl px-4 py-6 text-center text-sm text-slate-400 bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                  暂无网址
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {search && filteredCategories.every((c) => c.links.length === 0) && (
        <div className="text-center py-16 text-slate-400">
          未找到匹配的网址
        </div>
      )}
    </div>
  );
}
