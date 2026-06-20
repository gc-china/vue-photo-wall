# 快速入门指南

## 🎯 5分钟快速开始

### 1. 克隆或下载项目

```bash
# 如果使用 git
git clone https://gitee.com/你的用户名/vue-photo-gallery.git
cd vue-photo-gallery

# 或者直接下载 ZIP 文件并解压
```

### 2. 安装依赖

```bash
npm install
```

### 3. 添加你的照片

将你的照片按照以下结构放入 `public/photos/` 目录：

```
public/photos/
├── 风景/
│   ├── 山川/
│   │   ├── 照片1.jpg
│   │   └── 照片2.jpg
│   └── 海滩/
│       └── 照片3.jpg
├── 宠物/
│   └── 猫咪/
│       └── 照片4.jpg
└── 人物/
    └── 家人/
        └── 照片5.jpg
```

### 4. 开发运行

```bash
npm run dev
```

打开浏览器访问 `http://localhost:3000`

### 5. 构建部署

```bash
# 构建生产版本
npm run build

# 部署到 Gitee Pages
./deploy.sh
```

## 📂 照片文件说明

### 支持的图片格式

- JPG/JPEG
- PNG
- WebP
- HEIC（需要浏览器支持）

### Live Photo 支持

对于 Apple Live Photo，需要两个文件：

```
照片名.jpg    # 静态图片
照片名.mov    # Live Photo 视频
```

确保两个文件在同一目录且文件名相同。

### 文件命名建议

- 使用有意义的文件名，例如：`2024-元旦-家庭聚餐.jpg`
- 避免特殊字符
- 使用英文或中文命名

## ⚙️ 自定义配置

### 修改默认设置

编辑 `src/stores/photoStore.js`：

```javascript
// 默认排序方式
sortBy.value = 'date'        // 按日期排序
sortOrder.value = 'desc'     // 降序排列

// 默认显示数量
pageSize.value = 24          // 每页24张照片
```

### 修改界面主题

编辑 `src/styles/main.scss`：

```scss
:root {
  --primary-color: #667eea;     // 修改主色调
  --bg-primary: #fafbfc;        // 修改背景色
  --text-primary: #2c3e50;      // 修改文字颜色
}
```

## 🚀 部署到不同平台

### Gitee Pages（推荐）

```bash
# 1. 构建
npm run build

# 2. 运行部署脚本
./deploy.sh

# 3. 在 Gitee Pages 页面启用服务
```

### Netlify

1. 连接你的 Git 仓库到 Netlify
2. 设置构建命令：`npm run build`
3. 设置发布目录：`dist`
4. 部署

### Vercel

1. 导入你的 Git 仓库到 Vercel
2. 自动检测构建配置
3. 部署

### GitHub Pages

```bash
# 1. 修改 vite.config.js
base: '/your-repo-name/'

# 2. 构建
npm run build

# 3. 推送到 gh-pages 分支
```

## 🛠️ 常见问题

### Q: 照片不显示？

A: 检查以下几点：
1. 照片文件是否在 `public/photos/` 目录下
2. 文件格式是否正确（JPG、PNG等）
3. 文件名是否包含特殊字符
4. 浏览器控制台是否有错误信息

### Q: Live Photo 无法播放？

A: 确保：
1. 有对应的 `.mov` 文件
2. 文件名与 `.jpg` 完全一致
3. 浏览器支持视频播放

### Q: 部署后页面空白？

A: 检查：
1. `vite.config.js` 中的 `base` 配置是否正确
2. 构建是否成功
3. 静态资源是否正确上传

### Q: 如何添加更多分类？

A: 直接在 `public/photos/` 目录下创建新的文件夹结构即可，系统会自动识别。

## 📱 移动端优化

项目完全响应式设计，在移动端会自动优化：

- 照片网格自适应屏幕宽度
- 触摸友好的交互设计
- 优化的图片懒加载
- 底部导航栏

## 🎨 功能特色

### 时光轴浏览

- 按月查看：显示每个月的照片
- 按年查看：显示每年的月度统计
- 树状视图：可展开的年月树

### 智能筛选

- 按分类筛选
- 按日期范围筛选
- 关键词搜索
- 多维度排序

### 照片详情

- 完整元数据展示
- Live Photo 播放
- 位置信息
- 分享下载功能

## 🔍 性能优化

- 图片懒加载
- 虚拟滚动
- 缓存策略
- 代码分割
- 压缩优化

## 📊 分析统计

系统会自动统计：
- 总照片数量
- 年份跨度
- 月度分布
- 分类统计

## 🚀 下一步

1. 添加你的第一批照片
2. 自定义主题颜色
3. 配置部署到 Gitee Pages
4. 分享给朋友和家人

享受你的照片时光！📸✨