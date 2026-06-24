import { useState } from 'react';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { testConnection } from '@/utils/githubApi';
import { Key, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminSettings() {
  const { config, setConfig, data, updateSettings, error } = useBookmarkStore();

  const [form, setForm] = useState({
    token: config?.token || '',
    repo: config?.repo || '', // Gist ID
    path: config?.path || 'bookmarks.yml',
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
        owner: '',
        repo: form.repo,
        path: form.path,
        branch: '',
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
      owner: '',
      repo: form.repo,
      path: form.path,
      branch: '',
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
        <h3 className="font-medium text-blue-600 dark:text-blue-400">使用 GitHub Gist 同步数据</h3>
        <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
          <li>① 前往 <a href="https://gist.github.com" target="_blank" className="text-blue-500 hover:underline">gist.github.com</a> 创建一个新的 Secret Gist</li>
          <li>② 创建后会得到一个 Gist ID（URL 中 <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">gist.github.com/&lt;此处为ID&gt;</code>）</li>
          <li>③ 生成 Fine-grained PAT，授予 Gist 读写权限（需要 Gist 范围）</li>
          <li>④ 下方填写 Token 和 Gist ID，数据会自动同步</li>
        </ol>
      </div>

      {/* GitHub Config */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <Key className="w-4.5 h-4.5 text-blue-500" />
          GitHub Gist 配置
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
              需要 Gist 范围权限。前往 <a href="https://github.com/settings/tokens?type=beta" target="_blank" className="text-blue-500 hover:underline">GitHub</a> 创建
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Gist ID</label>
            <input
              value={form.repo}
              onChange={(e) => setForm({ ...form, repo: e.target.value })}
              placeholder="8c5a5b5c5a5b5c5a5b5c5a5b5c5a5b5c"
              className="w-full rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition"
            />
            <p className="text-xs text-slate-400 mt-1">Gist URL 中的 ID 部分，例如 gist.github.com/<span className="font-mono bg-slate-200 dark:bg-slate-800 px-1">8c5a5b5c...</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              数据文件名
            </label>
            <input
              value={form.path}
              onChange={(e) => setForm({ ...form, path: e.target.value })}
              placeholder="bookmarks.yml"
              className="w-full rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 transition"
            />
            <p className="text-xs text-slate-400 mt-1">数据存储的文件名，默认 bookmarks.yml</p>
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
