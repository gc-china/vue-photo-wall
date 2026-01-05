# 维护与故障排查手册 (Operations & Maintenance Manual)

> 系统名称：YuCheng Photo Wall (这个世界归档)  
> 最后更新：2026-01-05

本文档旨在指导运维人员和开发人员对生产环境中的归档系统进行监控、故障排查和日常维护。

## 1. 系统概览

本系统是一个基于 Vue 3 + Vite 的静态单页应用 (SPA)，部署在 CDN/静态服务器上。主要功能包括：
- **相册分类**：按地点/主题分类展示
- **时间归档**：按时间线 (`Timeline`) 倒序展示所有照片
- **详情展示**：提供 EXIF 信息、地图定位、视频播放及平滑过渡动画
- **PWA 支持**：支持离线缓存和安装到桌面

## 2. 问题诊断 (Problem Diagnosis)

### 2.1 全局错误监控
系统已在 `main.js` 中集成了全局错误捕获机制。所有未捕获的 Vue 组件错误和 Promise 异常都会被记录到控制台。

**检查步骤：**
1. 打开浏览器开发者工具 (F12) -> Console 面板。
2. 搜索 `[System Error]` 或 `[System Warning]` 关键字。
3. 查看具体的错误堆栈 (Stack Trace) 和组件信息。

```javascript
// 示例日志输出
[System Error] Global Error Handler Caught: TypeError: Cannot read properties of undefined...
[System Error] Info: { instance: ..., info: "render function" }
```

### 2.2 常见问题速查

| 现象 | 可能原因 | 排查与修复 |
|------|----------|------------|
| **白屏 / 无法加载** | 1. CDN 资源加载失败<br>2. 路由配置错误<br>3. `photos.json` 格式非法 | 1. 检查 Network 面板是否有 404/500 错误<br>2. 检查 `vite.config.js` 中的 `base` 路径配置<br>3. 验证 JSON 文件语法 |
| **图片无法显示** | 1. 路径错误 (Public 目录问题)<br>2. 图片文件损坏<br>3. `theme.css` 缺失 | 1. 确认 `photos.json` 中的 `url` 是否包含 `public/` 前缀 (系统会自动修正，但源数据最好规范)<br>2. 直接访问图片 URL 测试 |
| **PWA 不更新** | Service Worker 缓存策略过强 | 手动注销 SW 或在开发者工具 Application -> Service Workers 中点击 "Unregister" |
| **构建失败** | 依赖版本冲突或路径引用错误 | 1. 检查 `import` 路径是否正确 (区分大小写)<br>2. 删除 `node_modules` 并重新 `npm install` |

## 3. 环境检查 (Environment Check)

### 3.1 构建环境要求
- **Node.js**: v16.0.0+ (推荐 v18/v20 LTS)
- **NPM**: v8.0.0+
- **操作系统**: Windows/Linux/macOS

### 3.2 生产环境配置
确保 `vite.config.js` 配置正确：

```javascript
// 关键配置检查点
export default defineConfig({
  base: '/', // Vercel/Netlify 使用 '/'，GitHub Pages 使用 '/repo-name/'
  build: {
    cssCodeSplit: true, // 启用 CSS 代码分割
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) { ... } // 检查分包策略是否生效
      }
    }
  },
  plugins: [
    viteCompression(), // 确认 gzip 压缩已启用
    VitePWA()          // 确认 PWA 插件已配置
  ]
});
```

### 3.3 资源监控
由于是静态站点，服务器资源主要指 CDN 流量和带宽。
- **优化建议**：使用 `vite-plugin-compression` 生成 `.gz` 文件，并配置 Nginx/CDN 开启 Gzip 传输，可减少 60% 以上的传输体积。

## 4. 解决方案与回滚 (Solutions & Rollback)

### 4.1 紧急修复流程
1. **本地复现**：运行 `npm run preview` 在本地模拟生产环境。
2. **代码修复**：修改代码并通过单元测试 (`npm run test`)。
3. **构建验证**：运行 `npm run build` 确保构建成功且无报错。
4. **部署上线**：推送代码触发 CI/CD 或手动上传 `dist` 目录。

### 4.2 回滚方案
如果新版本上线后出现严重 Bug，请立即执行回滚：

**Git 回滚：**
```bash
# 1. 查找上一个稳定版本的 Commit ID
git log --oneline

# 2. 回退到指定版本 (例如 abc1234)
git reset --hard abc1234

# 3. 强制推送到远程 (慎用，需通知团队)
git push -f origin main
```

**制品回滚：**
如果保留了历史构建的 `dist` 压缩包，直接解压覆盖服务器上的文件即可。

## 5. 改进计划

- **自动化测试**：引入 Cypress 进行端到端 (E2E) 测试，覆盖核心用户路径。
- **日志上报**：接入 Sentry 或 LogRocket，实时收集用户端的异常信息。
- **性能监控**：集成 Lighthouse CI，在每次构建时自动检测性能分数。
