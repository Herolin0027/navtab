# NavTab 配置指南

## 配置 GitHub Gist 同步

### 1. 创建 Gist

1. 打开 [https://gist.github.com](https://gist.github.com)
2. **Gist description**（描述）：随便填，比如 `navtab`
3. **Filename including extension**（文件名）：`bookmarks.yml`
4. **内容区域**：可以留空，或者写 `# bookmarks`
5. 点击右下角绿色按钮 **Create secret gist**
6. 创建成功后，从浏览器地址栏复制 Gist ID
   - 例如地址是 `https://gist.github.com/Herolin0027/8c5a5b5c5a5b5c5a5b5c5a5b5c5a5b5c`
   - Gist ID 就是 `8c5a5b5c5a5b5c5a5b5c5a5b5c5a5b5c`

### 2. 创建 Personal Access Token

1. 打开 [https://github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta)
2. 点击 **Generate new token**
3. **Token name**：随便填，比如 `navtab`
4. **Expiration**：选择有效期，建议选 `No expiration`
5. **Repository access**：可以选 `Public Repositories (read-only)` 或不选
6. **Account permissions** → **Gists**：选择 **Read and write**
7. 点击 **Generate token**
8. 复制生成的 Token（以 `ghp_` 开头）

### 3. 在网站中填写配置

1. 打开你的 NavTab 网站
2. 进入 **设置** 页面
3. 填写以下内容：
   - **Personal Access Token**：刚才复制的 `ghp_` 开头的 Token
   - **Gist ID**：刚才复制的 Gist ID
   - **数据文件名**：默认 `bookmarks.yml` 即可
4. 点击 **测试连接** 验证是否成功
5. 点击 **保存配置** 完成设置

配置完成后，数据会自动同步到 GitHub Gist，跨设备只要填写相同的配置即可同步。
