# Gitee Pages 部署指南

## 📋 目录

- [准备工作](#准备工作)
- [创建 Gitee 仓库](#创建-gitee-仓库)
- [本地配置](#本地配置)
- [部署步骤](#部署步骤)
- [自动部署](#自动部署)
- [常见问题](#常见问题)
- [高级配置](#高级配置)

## 🔧 准备工作

### 需要的工具

- Node.js (>= 14.0.0)
- npm 或 yarn 或 pnpm
- Git
- Gitee 账号

### 检查环境

```bash
# 检查 Node.js
node --version

# 检查 npm
npm --version

# 检查 Git
git --version
```

## 🏗️ 创建 Gitee 仓库

### 步骤 1: 登录 Gitee

1. 访问 https://gitee.com
2. 登录你的账号（如果没有，请先注册）

### 步骤 2: 创建新仓库

1. 点击右上角的 "+" 号
2. 选择 "新建仓库"
3. 填写仓库信息：
   - **仓库名称**: `photo-gallery`（或你喜欢的名称）
   - **仓库介绍**: 一个功能强大的 Vue.js 照片管理系统
   - **归属**: 选择你的个人账号或组织
   - **公开/私有**: 选择 "公开"（Gitee Pages 需要公开仓库）
   - **初始化仓库**: ✓ 勾选 "使用 README 文件初始化仓库"

4. 点击 "创建"

### 步骤 3: 获取仓库地址

创建完成后，复制仓库地址：

```bash
# HTTPS 地址
https://gitee.com/你的用户名/photo-gallery.git

# SSH 地址（推荐）
gitee.com:你的用户名/photo-gallery.git
```

## 💻 本地配置

### 1. 初始化 Git 仓库

在项目根目录执行：

```bash
# 如果还没有初始化 git
git init

# 添加远程仓库地址
git remote add origin https://gitee.com/你的用户名/photo-gallery.git

# 如果是 HTTPS 地址，建议使用凭据管理
git config --global credential.helper store
```

### 2. 创建并切换到 main 分支

```bash
git checkout -b main
```

### 3. 首次提交

```bash
# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Vue Photo Gallery"

# 推送到远程
git push -u origin main
```

## 🚀 部署步骤

### 方法 1: 使用部署脚本（推荐）

我们提供了一个自动部署脚本：

```bash
# 给脚本添加执行权限（只需要一次）
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

脚本会自动完成以下操作：
1. 安装依赖
2. 构建生产版本
3. 提交代码
4. 推送到 Gitee

### 方法 2: 手动部署

#### 步骤 1: 构建项目

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

构建完成后，会生成 `dist` 目录。

#### 步骤 2: 提交代码

```bash
# 添加所有变更
git add .

# 提交
git commit -m "Deploy Vue Photo Gallery"

# 推送到 main 分支
git push origin main
```

#### 步骤 3: 启用 Gitee Pages

1. 进入你的 Gitee 仓库页面
2. 点击顶部菜单的 "服务"
3. 选择 "Gitee Pages"
4. 配置部署选项：
   - **部署来源**: 部署当前分支: main
   - **部署目录**: `/dist`（或根目录 `/`）
   - **强制使用 HTTPS**: 建议开启
5. 点击 "启动" 按钮
6. 等待部署完成（通常需要 1-2 分钟）

#### 步骤 4: 访问你的照片画廊

部署完成后，Gitee 会提供一个访问地址，例如：

```
https://你的用户名.gitee.io/photo-gallery
```

## 🔄 自动部署

### 设置自动部署脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "deploy": "npm run build && git add . && git commit -m 'Deploy to Gitee' && git push origin main"
  }
}
```

然后使用：

```bash
npm run deploy
```

一键完成构建和部署。

### GitHub Actions（可选）

如果你使用 GitHub 镜像，可以设置自动部署：

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Gitee

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Gitee
      run: |
        git config --global user.name "GitHub Actions"
        git config --global user.email "actions@github.com"
        git add .
        git commit -m "Auto deploy from GitHub Actions"
        git push https://${{ secrets.GITEE_TOKEN }}@gitee.com/your-username/photo-gallery.git main
```

## 🛠️ 高级配置

### 自定义域名

1. 在 Gitee Pages 设置页面
2. 找到 "自定义域名" 选项
3. 输入你的域名
4. 按照提示添加 DNS 解析记录
5. 等待生效

### HTTPS 配置

Gitee Pages 自动提供 HTTPS 支持，建议始终开启。

### 缓存配置

为了提高访问速度，可以配置浏览器缓存：

```javascript
// 在 vite.config.js 中
export default defineConfig({
  // ...
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          utils: ['exif-js', 'moment', 'viewerjs']
        }
      }
    }
  }
})
```

### 404 页面

对于 SPA 应用，需要配置 404 页面重定向：

在项目根目录创建 `404.html`：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vue Photo Gallery</title>
  <script>
    window.location.href = '/photo-gallery/';
  </script>
</head>
<body>
  <p>正在重定向...</p>
</body>
</html>
```

## 🐛 常见问题

### 问题 1: 部署后页面空白

**原因**: 路径配置不正确

**解决**: 

1. 检查 `vite.config.js` 中的 `base` 配置：

```javascript
// 如果使用自定义域名
cbase: '/'

// 如果使用 Gitee Pages 默认地址
base: '/photo-gallery/'
```

2. 重新构建并部署

### 问题 2: 图片无法加载

**原因**: 图片路径错误

**解决**:

1. 确保图片在 `public/photos/` 目录下
2. 检查文件名是否正确
3. 检查浏览器控制台错误信息

### 问题 3: 部署失败

**原因**: 构建失败或权限问题

**解决**:

1. 检查本地构建是否成功：`npm run build`
2. 检查是否有足够的 Git 权限
3. 检查 Gitee 仓库是否公开

### 问题 4: 更新后页面没有变化

**原因**: 浏览器缓存

**解决**:

1. 强制刷新页面：`Ctrl + F5` 或 `Cmd + Shift + R`
2. 清除浏览器缓存
3. 检查 Gitee Pages 是否已更新部署

### 问题 5: Live Photo 无法播放

**原因**: 浏览器不支持或文件路径错误

**解决**:

1. 确保有对应的 `.mov` 文件
2. 检查浏览器是否支持视频播放
3. 检查文件是否已上传到 Gitee

## 📊 性能优化

### 图片优化

1. 使用适当的图片格式：
   - 照片：JPEG
   - 图标：PNG 或 SVG
   - 需要透明度：PNG

2. 压缩图片大小：
   - 使用工具如 TinyPNG、ImageOptim
   - 保持合适的分辨率（建议最大 2000px）

### 懒加载

系统已内置图片懒加载，确保：

```javascript
<img loading="lazy" :src="photo.image" />
```

### CDN 加速

如果需要，可以使用 CDN 加速静态资源：

```javascript
// 在 index.html 中使用 CDN
<link rel="preconnect" href="https://cdn.jsdelivr.net">
```

## 🔍 调试技巧

### 本地调试

```bash
# 开发模式
npm run dev

# 预览生产构建
npm run preview
```

### 浏览器开发者工具

1. **Network 面板**: 检查资源加载
2. **Console 面板**: 查看错误信息
3. **Application 面板**: 检查本地存储

### 日志调试

在代码中添加：

```javascript
console.log('Debug info:', data)
```

## 📚 相关资源

- [Vite 官方文档](https://vitejs.dev/)
- [Vue 3 官方文档](https://vuejs.org/)
- [Gitee Pages 文档](https://gitee.com/help/articles/4136)
- [Git 文档](https://git-scm.com/doc)

## 🆘 获取帮助

- 查看 [README.md](README.md)
- 查看 [QUICK_START.md](QUICK_START.md)
- 提交 Issue 到项目仓库
- 发送邮件至项目维护者

## 🎉 成功部署

部署成功后，你就可以：

1. 📸 上传和管理你的照片
2. 🗂️ 创建多级分类
3. 📅 浏览时光轴
4. 🔍 搜索和筛选
5. 📱 在手机上查看
6. 🤝 分享给朋友

享受你的照片时光！✨