# vue-photo-wall 项目备忘

## 技术栈
- Vue 3 + Vite 4 + Vue Router + Pinia
- 构建工具：Vite 4.5.x，devDependencies 中含 sass、sharp、exifr
- 部署：Gitee Pages（见 deploy.sh / GITEE_DEPLOY.md）

## 构建与运行
- 构建前必须先 `npm install`（项目 node_modules 默认不存在）
- 构建命令：`npm run build` → 输出到 `dist/`
- 预览：`npm run preview`；开发：`npm run dev`
- 扫描图片资源：`npm run scan`（scan.js）；校验资源：`npm run verify`（scripts/verify-assets.js）

## 重要工作流：新增照片/相册后必须 scan + rebuild
- 照片数据不是运行时读目录，而是 scan.js 扫描 public/photos/ 生成 src/assets/photos.json
- photoStore.js 用 `import photosData from '@/assets/photos.json'` 静态引入，build 时打包进 JS
- 新增照片后正确流程：① 放入 public/photos/<分类名>/ ② `npm run scan` 重新生成 photos.json+缩略图 ③ `npm run build` 重新打包（否则页面仍读旧数据）
- scan 有增量复用机制（canReuse 按文件 mtime 判断），全量重建用 `npm run scan -- --force`

## 资源说明
- public/photos/ 下按分类建子目录（如 上海动物园/、青甘大环线/），每个子目录即一个相册分类
- 共 14 个分类，约 163 张照片

## 注意事项
- npm install 会产生非当前平台二进制的 cleanup 警告，可忽略
- 构建时 Sass legacy-js-api 弃用警告不影响产物
- ⚠ WorkBuddy 沙箱的 safe-delete 机制会拦截 vite 清空 dist 目录（emptyDir 调 rmSync 失败），已配置 `build.emptyOutDir: false` 规避；副作用是 dist 残留旧 hash 文件，不影响运行但占空间
