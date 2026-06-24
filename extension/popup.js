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
  // Simple YAML parser for our specific format
  const lines = yamlContent.split('\n');
  const result = { settings: {}, categories: [] };
  let currentCategory = null;
  let currentLink = null;
  let indentLevel = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.search(/\S/);
    const level = indent === -1 ? 0 : Math.floor(indent / 2);

    if (level === 0 && trimmed.endsWith(':')) {
      const key = trimmed.slice(0, -1);
      if (key === 'settings') {
        currentCategory = null;
        currentLink = null;
      } else if (key === 'categories') {
        currentCategory = null;
        currentLink = null;
      }
    } else if (level === 1 && trimmed === '- id:') {
      // Start of new category
    } else if (level === 1 && trimmed.startsWith('- ')) {
      // Category start
    } else if (level === 2 && currentCategory && !currentLink) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        const key = trimmed.slice(0, colonIdx).trim();
        const val = trimmed.slice(colonIdx + 1).trim();
        if (key === 'links') {
          // links array start
        } else {
          currentCategory[key] = val.replace(/^["']|["']$/g, '');
        }
      }
    }
  }

  // Fallback: use a more robust approach with regex
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

// Main
(async () => {
  const root = document.getElementById('root');

  try {
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageTitle = tab.title || '';
    const pageUrl = tab.url || '';
    const pageIcon = `https://www.google.com/s2/favicons?domain=${new URL(pageUrl).hostname}&sz=64`;

    // Get stored config
    const stored = await chrome.storage.local.get(['navtab_config']);
    const config = stored.navtab_config;

    if (!config) {
      root.innerHTML = `
        <div class="header"><div class="icon"></div><h1>NavTab 收藏助手</h1></div>
        <div class="error">尚未配置 GitHub 同步</div>
        <p class="info">请先在 NavTab 后台管理中配置 GitHub Token</p>
      `;
      return;
    }

    // Fetch current data from GitHub
    let fileData;
    try {
      fileData = await getFile(config);
    } catch (e) {
      root.innerHTML = `
        <div class="header"><div class="icon"></div><h1>NavTab 收藏助手</h1></div>
        <div class="error">无法读取 GitHub 数据，请检查配置</div>
        <p class="info">${e.message}</p>
      `;
      return;
    }

    const content = decodeContent(fileData);
    const data = parseYaml(content);

    // Build UI
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
      <p class="info">数据将同步到你的 GitHub 仓库</p>
    `;

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
        // Re-fetch to get latest sha
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
})();

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
