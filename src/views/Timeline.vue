<script setup>

import { useRouter } from 'vue-router';
// import photosData from '@/assets/photos.json'; // 你的数据源
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { computed, onMounted } from 'vue';
import {store} from "@/store.js";

// 设置中文日期格式
dayjs.locale('zh-cn');

const router = useRouter();
onMounted(() => {
  store.initData();
});
/**
 * 🚀 核心优化：图片 CDN 加速处理函数
 * 作用：将原图 URL 转换为压缩后的 WebP 小图 URL
 * 原理：使用 images.weserv.nl 免费服务进行实时压缩
 */
const getOptimizedUrl = (url) => {
  if (!url) return '';

  // 1. 如果是网络图片(http开头)，直接返回
  if (url.startsWith('http')) return url;

  // 2. 配置你的 GitHub 信息
  const user = 'gc-china';       // 用户名
  const repo = 'vue-photo-wall'; // 仓库名
  const branch = 'main';         // 分支名 (注意是 main 还是 master)

  // 3. 处理路径
  let path = url;

  // 💡 关键修正：如果路径以 / 开头，去掉它
  if (path.startsWith('/')) {
    path = path.slice(1);
  }

  // 💡 关键修正：Vite 项目的静态资源通常在 public 文件夹里
  // 如果 GitHub 根目录下没有 thumbs 文件夹，而是在 public/thumbs，这里就要补上
  // 我们判断：如果不是以 public 开头，就给它拼上
  if (!path.startsWith('public/')) {
    path = 'public/' + path;
  }

  // 4. 生成 jsDelivr 链接 (中文自动编码)
  // encodeURI 处理整个路径，确保中文被转换
  // 使用 encodeURIComponent 需要单独处理每一段，简单起见用 encodeURI 即可，
  // 或者让 jsDelivr 自己处理（通常浏览器访问时会自动 encode）
  // 为了代码稳健，我们手动 encode 路径部分
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');

  return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${encodedPath}`;
};

// --- 数据处理：按 年-月-日 分组 ---
const timelineGroups = computed(() => {
  const groups = {};
  const photosData = store.photos || [];

  // 1. 先按时间倒序排序
  const sortedPhotos = [...photosData].sort((a, b) => {
    return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
  });

  // 2. 分组
  sortedPhotos.forEach(photo => {
    // 格式化为：2023年12月12日 星期二
    const dateKey = dayjs(photo.date).format('YYYY年MM月DD日 dddd');

    if (!groups[dateKey]) {
      groups[dateKey] = {
        title: dateKey,
        timestamp: dayjs(photo.date).valueOf(),
        photos: []
      };
    }
    groups[dateKey].photos.push(photo);
  });

  // 3. 返回分组数组
  return Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
});

// 跳转详情
const goToDetail = (id) => {
  router.push(`/photo/${id}`);
};
</script>

<template>
  <div class="timeline-container">
    <h2>⏳ 时间归档</h2>

    <div v-for="group in timelineGroups" :key="group.title" class="time-section">

      <div class="date-header">
        <span class="icon-dot"></span>
        <span class="date-text">{{ group.title }}</span>
        <span class="count">{{ group.photos.length }}张</span>
      </div>

      <div class="day-grid">
        <div
            v-for="photo in group.photos"
            :key="photo.id"
            class="mini-card"
            @click="goToDetail(photo.id)"
        >
          <div class="img-box">
            <img
                :src="getOptimizedUrl(photo.thumb || photo.url)"
                loading="lazy"
                :alt="photo.title"
            />
<!--            <img
                :src="photo.thumb || photo.url"
                loading="lazy"
                :alt="photo.title"
            />-->
          </div>
        </div>
      </div>
    </div>

    <div v-if="timelineGroups.length === 0" class="empty-state">
      暂无照片数据
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.time-section {
  position: relative;
  padding-left: 24px;
  padding-bottom: 30px;
  border-left: 2px solid #e0e0e0;
}

.time-section:last-child {
  border-left: 2px solid transparent;
}

.date-header {
  position: relative;
  margin-left: -31px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.icon-dot {
  width: 14px;
  height: 14px;
  background: #fff;
  border: 3px solid #333;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px #f8f9fa;
}

.date-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-right: 8px;
}

.count {
  font-size: 0.85rem;
  color: #999;
  background: #eee;
  padding: 1px 6px;
  border-radius: 4px;
}

.day-grid {
  display: grid;
  /* 最小宽度设为 120px，适应手机显示 */
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.mini-card {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: #eee;
  transition: transform 0.2s, box-shadow 0.2s;
}

.mini-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1;
}

.img-box {
  width: 100%; height: 100%;
}

.img-box img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 50px;
}
</style>