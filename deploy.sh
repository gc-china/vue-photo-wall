#!/bin/bash

# Vue Photo Gallery 部署脚本
# 用于自动构建并部署到 Gitee Pages

set -e

echo "🚀 开始部署 Vue Photo Gallery 到 Gitee Pages..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未检测到 Node.js 环境${NC}"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 错误: 未检测到 npm${NC}"
    exit 1
fi

# 检查是否安装了 git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ 错误: 未检测到 Git${NC}"
    echo "请先安装 Git: https://git-scm.com/"
    exit 1
fi

echo -e "${GREEN}✅ 环境检查通过${NC}"

# 检查当前目录是否为项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 当前目录不是 Vue Photo Gallery 项目根目录${NC}"
    echo "请确保在包含 package.json 的目录中运行此脚本"
    exit 1
fi

echo -e "${YELLOW}📦 安装依赖...${NC}"
npm install

echo -e "${YELLOW}🔨 构建生产版本...${NC}"
npm run build

echo -e "${GREEN}✅ 构建完成${NC}"

# 检查是否存在 dist 目录
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 错误: 构建失败，未找到 dist 目录${NC}"
    exit 1
fi

echo -e "${YELLOW}📂 准备部署文件...${NC}"

# 创建临时部署目录
DEPLOY_DIR="gitee-deploy-$(date +%Y%m%d%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# 复制构建文件到临时目录
cp -r dist/* "$DEPLOY_DIR/"

# 复制必要的配置文件
cp README.md "$DEPLOY_DIR/" 2>/dev/null || true
cp LICENSE "$DEPLOY_DIR/" 2>/dev/null || true

# 检查是否是 git 仓库
if [ -d ".git" ]; then
    echo -e "${YELLOW}📝 添加文件到 Git...${NC}"
    
    # 添加所有文件
    git add .
    
    # 检查是否有变更
    if git diff --staged --quiet; then
        echo -e "${YELLOW}📝 没有检测到变更，跳过提交...${NC}"
    else
        # 提交变更
        git commit -m "Deploy Vue Photo Gallery - $(date '+%Y-%m-%d %H:%M:%S')"
        echo -e "${GREEN}✅ 提交完成${NC}"
    fi
    
    # 推送到远程仓库
    echo -e "${YELLOW}☁️ 推送到 Gitee...${NC}"
    git push origin main
    
    echo -e "${GREEN}✅ 推送完成${NC}"
    echo -e "${GREEN}🎉 部署成功！请在 Gitee Pages 页面查看效果${NC}"
    
else
    echo -e "${RED}❌ 错误: 当前目录不是 Git 仓库${NC}"
    echo -e "${YELLOW}请先初始化 Git 仓库并添加远程地址：${NC}"
    echo "1. git init"
    echo "2. git remote add origin https://gitee.com/你的用户名/你的仓库.git"
    echo "3. 然后重新运行此脚本"
    
    # 清理临时目录
    rm -rf "$DEPLOY_DIR"
    exit 1
fi

# 清理临时目录
rm -rf "$DEPLOY_DIR"

echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${YELLOW}📌 提示:${NC}"
echo "1. 访问你的 Gitee 仓库"
echo "2. 进入「服务」>「Gitee Pages」"
echo "3. 确保部署来源设置为 main 分支的 /dist 目录"
echo "4. 点击「启动」或「更新」按钮"
echo "5. 等待部署完成后访问你的照片画廊"