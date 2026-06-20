# Vue Photo Gallery

一个功能强大的 Vue.js 照片管理系统，支持 Live Photo、元数据展示、时间轴浏览等功能。

## ✨ 特性

- 📸 **Live Photo 支持**: 完整支持 Apple Live Photo 播放
- 🗂️ **多级分类**: 基于文件目录结构的多级分类系统
- 📅 **时间轴浏览**: 按月、按年、树状三种时间轴视图
- 🔍 **智能搜索**: 支持按标题、描述、标签搜索照片
- 📊 **元数据展示**: 显示相机、镜头、焦段、光圈、ISO 等详细信息
- 📱 **响应式设计**: 完美适配桌面、平板和手机设备
- ⚡ **性能优化**: 图片懒加载、虚拟滚动、缓存优化
- 🎨 **现代界面**: 毛玻璃效果、流畅动画、暗色主题
- 📤 **分享功能**: 支持 Web Share API
- 💾 **本地优先**: 纯前端实现，无需服务器

## 🛠️ 技术栈

- **Vue 3**: 组合式 API，更好的 TypeScript 支持
- **Pinia**: 轻量级状态管理
- **Vue Router**: 单页应用路由
- **Vite**: 下一代前端构建工具
- **Sass**: CSS 预处理器
- **Viewer.js**: 图片查看器
- **Exif-js**: EXIF 元数据解析

## 📦 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发运行

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 http://localhost:3000 查看应用

### 构建生产版本

```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

构建后的文件将输出到 `dist` 目录

## 📁 项目结构

```
├── public/                 # 静态资源
├── src/
│   ├── components/         # Vue 组件
│   │   ├── PhotoCard.vue          # 照片卡片
│   │   ├── PhotoListItem.vue      # 照片列表项
│   │   └── ...
│   ├── stores/             # Pinia 状态管理
│   │   └── photoStore.js          # 照片状态管理
│   ├── styles/             # 全局样式
│   │   └── main.scss              # 主样式文件
│   ├── views/              # 页面视图
│   │   ├── PhotoGallery.vue       # 照片画廊
│   │   ├── PhotoDetail.vue        # 照片详情
│   │   └── TimelineView.vue       # 时光轴视图
│   ├── App.vue             # 根组件
│   └── main.js             # 应用入口
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 部署到 Gitee Pages

### 1. 创建 Gitee 仓库

1. 登录 [Gitee](https://gitee.com)
2. 创建一个新的仓库，命名为 `photo-gallery`（或其他你喜欢的名称）
3. 保持仓库为公开（Public）

### 2. 本地配置

在项目根目录执行：

```bash
# 初始化 git 仓库（如果还没有）
git init

# 添加远程仓库
 git remote add origin https://gitee.com/你的用户名/你的仓库名.git

# 创建并切换到 main 分支
git checkout -b main
```

### 3. 构建并部署

```bash
# 构建生产版本
npm run build

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial deployment to Gitee Pages"

# 推送到 Gitee
git push -u origin main
```

### 4. 启用 Gitee Pages

1. 进入你的 Gitee 仓库页面
2. 点击「服务」>「Gitee Pages」
3. 选择部署来源为「部署当前分支: main」
4. 选择部署目录为 `/dist`（或根目录，如果你将构建文件放在根目录）
5. 点击「启动」按钮
6. 等待部署完成，获取你的访问地址

### 5. 自动部署脚本

为了方便部署，你可以在 `package.json` 中添加一个部署脚本：

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

一键构建并部署到 Gitee

## 📸 照片组织

### 目录结构

```
public/
└── photos/
    ├── 风景/
    │   ├── 山川/
    │   │   ├── IMG_001.jpg
    │   │   └── IMG_002.jpg
    │   └── 海滩/
    │       └── IMG_003.jpg
    ├── 人物/
    │   ├── 家人/
    │   └── 朋友/
    └── 宠物/
        └── 猫咪/
            └── IMG_004.jpg
```

### Live Photo 支持

Live Photo 需要两个文件：

```
照片名称.jpg          # 静态图片
照片名称.mov          # Live Photo 视频
```

确保两个文件在同一目录且文件名相同（扩展名不同）

### 元数据支持

系统会自动从图片的 EXIF 数据中提取：

- 拍摄时间
- 相机型号
- 镜头信息
- 拍摄参数（光圈、快门、ISO、焦距）
- GPS 位置信息
- 图片尺寸和文件大小

## 🎨 主题定制

### 修改主色调

编辑 `src/styles/main.scss` 中的 CSS 变量：

```scss
:root {
  --primary-color: #667eea;           // 主色调
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --bg-primary: #fafbfc;              // 背景色
  --text-primary: #2c3e50;            // 文字颜色
  // ... 更多变量
}
```

### 暗色主题

系统支持自动检测和手动切换暗色主题，在 `src/App.vue` 中可以自定义暗色主题的颜色变量。

## 🔧 自定义配置

### 修改默认视图

在 `src/stores/photoStore.js` 中修改默认配置：

```javascript
// 默认排序方式
sortBy.value = 'date'        // 按日期
sortOrder.value = 'desc'     // 降序

// 默认筛选
currentFilter.value = 'all'  // 显示全部

// 默认视图模式
viewMode.value = 'grid'      // 网格视图
```

### 修改分页大小

在 `src/views/PhotoGallery.vue` 中修改：

```javascript
const pageSize = ref(24)  // 每页显示24张照片
```

## 🌐 浏览器支持

- Chrome >= 80
- Firefox >= 75
- Safari >= 13
- Edge >= 80

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue: [GitHub Issues](https://github.com/your-username/vue-photo-gallery/issues)
- 邮箱: your-email@example.com

## 🙏 致谢

感谢以下开源项目：

- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/)
- [Viewer.js](https://fengyuanchen.github.io/viewerjs/)
- [Exif-js](https://github.com/exif-js/exif-js)

---

**享受您的照片时光！** 📸✨