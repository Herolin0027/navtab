import { useState } from 'react';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { testConnection } from '@/utils/githubApi';
import { Key, GitBranch, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminSettings() {
  const { config, setConfig, data, updateSettings, error } = useBookmarkStore();

  const [form, setForm] = useState({
    token: config?.token || '',
    owner: config?.owner || '',
    repo: config?.repo || '',
    path: config?.path || 'data/bookmarks.yml',
    branch: config?.branch || 'main',
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await setConfig({
        token: form.token,
        owner: form.owner,
        repo: form.repo,
        path: form.path,
        branch: form.branch,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('保存失败:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const ok = await testConnection({
      token: form.token,
      owner: form.owner,
      repo: form.repo,
      path: form.path,
      branch: form.branch,
    });
    setTestResult(ok);
    setTesting(false);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">同步设置</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          配置 GitHub 仓库，实现跨设备数据同步
        </p>
      </div>

      {/* Quick Start Guide */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-3">
        <h3 className="font-medium text-blue-600 dark:text-blue-400">双仓库模式（代码 + 数据分离）</h3>
        <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
          <li>① 创建代码仓库 <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">navtab</code>（存放前端代码，部署到 Pages）</li>
          <li>② 创建数据仓库 <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">navtab-data</code>（存放收藏数据）</li>
          <li>③ 生成 Fine-grained PAT，授予数据仓库 Contents 读写权限</li>
          <li>④ 下方表单填写数据仓库信息，数据自动存到 <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">data/bookmarks.yml</code></li>
        </ol>
      </div>

      {/* GitHub Config */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <Key className="w-4.5 h-4.5 text-blue-500" />
          GitHub 配置
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Personal Access Token
            </label>
            <input
              type="password"
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition"
            />
            <p className="text-xs text-slate-400 mt-1">
              前往 <a href="https://github.com/settings/tokens?type=beta" target="_blank" className="text-blue-500 hover:underline">GitHub</a> 创建 Fine-grained PAT，授予目标仓库 Contents 读写权限
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">仓库所有者（用户名）</label>
              <input
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                placeholder="your-username"
                className="w-full rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">仓库名称</label>
              <input
                value={form.repo}
                onChange={(e) => setForm({ ...form, repo: e.target.value })}
                placeholder="navtab"
                className="w-full rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                数据文件路径
              </label>
              <input
                value={form.path}
                onChange={(e) => setForm({ ...form, path: e.target.value })}
                placeholder="data/bookmarks.yml"
                className="w-full rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition"
              />
              <p className="text-xs text-slate-400 mt-1">数据会以 YAML 格式存储在这个文件中</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                分支
              </label>
              <input
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                placeholder="main"
                className="w-full rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="rounded-xl px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            {testing ? '测试中...' : '测试连接'}
          </button>
          {testResult !== null && (
            <span
              className={`flex items-center gap-1 text-sm ${
                testResult ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {testResult ? (
                <>
                  <Check className="w-4 h-4" /> 连接成功
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" /> 连接失败
                </>
              )}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto rounded-xl px-5 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition disabled:bg-blue-400 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                已保存
              </>
            ) : (
              '保存配置'
            )}
          </button>
          {error && (
            <div className="w-full mt-2 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 space-y-5">
        <h2 className="font-semibold">外观设置</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">主题</label>
            <div className="flex gap-2">
              {[
                { value: 'dark', label: '深色' },
                { value: 'light', label: '浅色' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => updateSettings({ theme: t.value as 'dark' | 'light' })}
                  className={`rounded-xl px-4 py-2 text-sm border transition ${
                    data.settings.theme === t.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">背景</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'gradient-blue', label: '蓝紫渐变' },
                { value: 'gradient-purple', label: '紫粉渐变' },
                { value: 'dark-solid', label: '纯黑' },
                { value: 'light-solid', label: '纯白' },
              ].map((b) => (
                <button
                  key={b.value}
                  onClick={() => updateSettings({ background: b.value })}
                  className={`rounded-xl px-4 py-2 text-sm border transition ${
                    data.settings.background === b.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
