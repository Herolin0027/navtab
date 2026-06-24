// NavTab Extension Popup
// Pure vanilla JS, no build step needed

const API_BASE = 'https://api.github.com';

function getHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

async function getFile(config) {
  const url = `${API_BASE}/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`;
  const res = await fetch(url, { headers: getHeaders(config.token) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function updateFile(config, content, sha, message = 'Add bookmark via extension') {
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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

function decodeContent(file) {
  if (file.content) {
    return decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
  }
  return '';
}

function parseYaml(yamlContent) {
  const result = { settings: {}, categories: [] };

  try {
    const settingsMatch = yamlContent.match(/settings:\s*\n((?:\s+\w+:\s*.*\n)*)/);
    if (settingsMatch) {
      const sLines = settingsMatch[1].split('\n');
      for (const sl of sLines) {
        const m = sl.match(/^\s+(\w+):\s*(.*)$/);
        if (m) result.settings[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }

    const catMatches = yamlContent.matchAll(
      /- id:\s*(\S+)\s*\n(?:\s+name:\s*(.*?)\s*\n)(?:\s+icon:\s*(.*?)\s*\n)(?:\s+order:\s*(\d+)\s*\n)(?:\s+links:\s*\n((?:\s+-\s+id:.*?\n(?:\s+\w+:.*?\n)*)*))?/gs
    );

    for (const cm of catMatches) {
      const cat = {
        id: cm[1],
        name: cm[2].replace(/^["']|["']$/g, ''),
        icon: cm[3].replace(/^["']|["']$/g, ''),
        order: parseInt(cm[4]) || 0,
        links: [],
      };

      if (cm[5]) {
        const linkMatches = cm[5].matchAll(
          /-\s+id:\s*(\S+)\s*\n(?:\s+title:\s*(.*?)\s*\n)(?:\s+url:\s*(.*?)\s*\n)(?:\s+description:\s*(.*?)\s*\n)?(?:\s+icon:\s*(.*?)\s*\n)?(?:\s+created_at:\s*(.*?)\s*\n)?/gs
        );
        for (const lm of linkMatches) {
          cat.links.push({
            id: lm[1],
            title: lm[2].replace(/^["']|["']$/g, ''),
            url: lm[3].replace(/^["']|["']$/g, ''),
            description: lm[4]?.replace(/^["']|["']$/g, '') || undefined,
            icon: lm[5]?.replace(/^["']|["']$/g, '') || undefined,
            created_at: lm[6]?.replace(/^["']|["']$/g, '') || new Date().toISOString(),
          });
        }
      }

      result.categories.push(cat);
    }
  } catch (e) {
    console.error('Parse error', e);
  }

  return result;
}

function stringifyYaml(data) {
  let out = 'settings:\n';
  for (const [k, v] of Object.entries(data.settings)) {
    out += `  ${k}: ${v}\n`;
  }
  out += '\ncategories:\n';
  for (const cat of data.categories) {
    out += `  - id: ${cat.id}\n`;
    out += `    name: "${cat.name}"\n`;
    out += `    icon: "${cat.icon}"\n`;
    out += `    order: ${cat.order}\n`;
    out += `    links:\n`;
    for (const link of cat.links) {
      out += `      - id: ${link.id}\n`;
      out += `        title: "${link.title}"\n`;
      out += `        url: "${link.url}"\n`;
      if (link.description) out += `        description: "${link.description}"\n`;
      if (link.icon) out += `        icon: "${link.icon}"\n`;
      out += `        created_at: "${link.created_at || link.createdAt || new Date().toISOString()}"\n`;
    }
  }
  return out;
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showConfigScreen(onSaved) {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="header"><div class="icon"></div><h1>配置 GitHub 同步</h1></div>
    <div id="msg"></div>
    <div class="field">
      <label>Token</label>
      <input type="password" id="token" placeholder="github_pat_..." />
    </div>
    <div class="field">
      <label>仓库所有者</label>
      <input type="text" id="owner" placeholder="你的 GitHub 用户名" />
    </div>
    <div class="field">
      <label>仓库名称</label>
      <input type="text" id="repo" placeholder="navtab-data" />
    </div>
    <div class="field">
      <label>文件路径</label>
      <input type="text" id="path" value="data/bookmarks.yml" />
    </div>
    <div class="field">
      <label>分支</label>
      <input type="text" id="branch" value="main" />
    </div>
    <button class="btn" id="saveBtn">保存配置</button>
    <p class="info">配置会保存在浏览器本地，安全可靠</p>
  `;

  chrome.storage.local.get(['navtab_config'], (result) => {
    const config = result.navtab_config;
    if (config) {
      document.getElementById('token').value = config.token || '';
      document.getElementById('owner').value = config.owner || '';
      document.getElementById('repo').value = config.repo || '';
      document.getElementById('path').value = config.path || 'data/bookmarks.yml';
      document.getElementById('branch').value = config.branch || 'main';
    }
  });

  document.getElementById('saveBtn').addEventListener('click', async () => {
    const token = document.getElementById('token').value.trim();
    const owner = document.getElementById('owner').value.trim();
    const repo = document.getElementById('repo').value.trim();
    const path = document.getElementById('path').value.trim();
    const branch = document.getElementById('branch').value.trim();
    const msg = document.getElementById('msg');

    if (!token || !owner || !repo) {
      msg.innerHTML = '<div class="error">请填写 Token、仓库所有者和仓库名称</div>';
      return;
    }

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';

    const config = { token, owner, repo, path, branch };

    try {
      await getFile(config);
      await chrome.storage.local.set({ navtab_config: config });
      msg.innerHTML = '<div class="success">配置成功！</div>';
      btn.textContent = '已保存';
      setTimeout(() => onSaved && onSaved(config), 800);
    } catch (e) {
      msg.innerHTML = `<div class="error">测试失败: ${e.message}，请检查配置</div>`;
      btn.disabled = false;
      btn.textContent = '保存配置';
    }
  });
}

async function showBookmarkScreen(config) {
  const root = document.getElementById('root');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageTitle = tab.title || '';
    const pageUrl = tab.url || '';
    let pageIcon = '';
    try {
      pageIcon = `https://www.google.com/s2/favicons?domain=${new URL(pageUrl).hostname}&sz=64`;
    } catch (e) {}

    let fileData;
    try {
      fileData = await getFile(config);
    } catch (e) {
      root.innerHTML = `
        <div class="header"><div class="icon"></div><h1>收藏到 NavTab</h1></div>
        <div class="error">无法读取 GitHub 数据</div>
        <p class="info">${e.message}</p>
        <a href="#" class="config-link" id="configLink">重新配置</a>
      `;
      document.getElementById('configLink').addEventListener('click', (e) => {
        e.preventDefault();
        showConfigScreen(showBookmarkScreen);
      });
      return;
    }

    const content = decodeContent(fileData);
    const data = parseYaml(content);

    const categoryOptions = data.categories
      .map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`)
      .join('');

    root.innerHTML = `
      <div class="header"><div class="icon"></div><h1>收藏到 NavTab</h1></div>
      <div id="msg"></div>
      <div class="field">
        <label>名称</label>
        <input type="text" id="title" value="${escapeHtml(pageTitle)}" />
      </div>
      <div class="field">
        <label>链接</label>
        <input type="text" id="url" value="${escapeHtml(pageUrl)}" />
      </div>
      <div class="field">
        <label>分类</label>
        <select id="category">
          <option value="">选择分类</option>
          ${categoryOptions}
        </select>
      </div>
      <div class="field">
        <label>描述（可选）</label>
        <input type="text" id="description" placeholder="简短描述..." />
      </div>
      <button class="btn" id="saveBtn">保存收藏</button>
      <a href="#" class="config-link" id="configLink">配置设置</a>
    `;

    document.getElementById('configLink').addEventListener('click', (e) => {
      e.preventDefault();
      showConfigScreen(showBookmarkScreen);
    });

    document.getElementById('saveBtn').addEventListener('click', async () => {
      const title = document.getElementById('title').value.trim();
      const url = document.getElementById('url').value.trim();
      const categoryId = document.getElementById('category').value;
      const description = document.getElementById('description').value.trim();
      const msg = document.getElementById('msg');

      if (!title || !url || !categoryId) {
        msg.innerHTML = '<div class="error">请填写完整信息并选择分类</div>';
        return;
      }

      const btn = document.getElementById('saveBtn');
      btn.disabled = true;
      btn.textContent = '保存中...';

      try {
        const latestFile = await getFile(config);
        const latestData = parseYaml(decodeContent(latestFile));

        const newLink = {
          id: generateId(),
          title,
          url,
          description: description || undefined,
          icon: pageIcon,
          created_at: new Date().toISOString(),
        };

        const cat = latestData.categories.find((c) => c.id === categoryId);
        if (cat) {
          cat.links.push(newLink);
        }

        const newContent = stringifyYaml(latestData);
        await updateFile(config, newContent, latestFile.sha);

        msg.innerHTML = '<div class="success">收藏成功！</div>';
        btn.textContent = '已保存';

        setTimeout(() => window.close(), 1200);
      } catch (e) {
        msg.innerHTML = `<div class="error">保存失败: ${e.message}</div>`;
        btn.disabled = false;
        btn.textContent = '保存收藏';
      }
    });
  } catch (e) {
    root.innerHTML = `
      <div class="header"><div class="icon"></div><h1>NavTab 收藏助手</h1></div>
      <div class="error">出错了: ${e.message}</div>
    `;
  }
}

// Main
(async () => {
  const stored = await chrome.storage.local.get(['navtab_config']);
  const config = stored.navtab_config;

  if (!config || !config.token) {
    showConfigScreen(showBookmarkScreen);
  } else {
    showBookmarkScreen(config);
  }
})();
