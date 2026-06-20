# 修复Vite开发服务器白屏和WebSocket连接问题

## 问题诊断
1. **WebSocket连接失败** - Vite的HMR（热模块替换）无法连接到 `ws://localhost:3000`
2. **Service Worker缓存错误** - 尝试缓存Chrome扩展请求导致失败
3. **页面白屏** - 由于上述错误导致应用无法正常加载

## 修复计划

### 1. 修复Vite配置文件 (vite.config.js)
- 添加 `hmr` 配置以确保WebSocket正确连接
- 添加 `host` 配置以确保服务器监听正确的地址
- 配置 `watch` 选项以改善文件监听

### 2. 修复Service Worker (public/sw.js)
- 在缓存前过滤掉非HTTP(S)请求（如chrome-extension、data等）
- 添加请求协议检查，只缓存有效的网络请求

### 3. 可选：优化开发体验
- 禁用开发环境下的Service Worker（仅在生产环境使用）
- 或者改进Service Worker的错误处理

## 预期结果
- WebSocket连接成功，HMR正常工作
- Service Worker不再报错
- 页面正常加载并显示内容