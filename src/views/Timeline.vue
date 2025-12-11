<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router'; // 1. 引入路由
import photosData from '@/assets/photos.json';
import dayjs from 'dayjs';

const router = useRouter(); // 2. 获取路由实例

// --- 数据处理：按年份-月份分组 ---
const timelineGroups = computed(() => {
  const groups = {};

  photosData.forEach(photo => {
    // 获取 "2023年12月" 这样的 Key
    const dateKey = dayjs(photo.date).format('YYYY年MM月');

    if (!groups[dateKey]) {
      groups[dateKey] = {
        title: dateKey,
        photos: []
      };
    }
    groups[dateKey].photos.push(photo);
  });

  // 把对象转为数组，并按时间倒序
  return Object.values(groups).sort((a, b) => {
    return b.title.localeCompare(a.title);
  });
});

// --- 3. 核心修复：跳转函数 ---
const goToDetail = (id) => {
  router.push(`/photo/${id}`);
};
</script>

<template>
  <div class="timeline-container">
    <h2>⏳ 时间归档</h2>

    <div v-for="group in timelineGroups" :key="group.title" class="time-section">
      <h3 class="month-title">
        <span class="icon-dot"></span>
        {{ group.title }}
        <span class="count">({{ group.photos.length }}张)</span>
      </h3>

      <div class="month-grid">
        <div
            v-for="photo in group.photos"
            :key="photo.id"
            class="mini-card"
            @click="goToDetail(photo.id)"
        >
          <div class="img-box">
            <img :src="photo.thumb || photo.url" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* 左侧的时间线效果 */
.time-section {
  position: relative;
  padding-left: 20px;
  margin-bottom: 40px;
  border-left: 2px solid #eee; /* 竖线 */
}

.month-title {
  font-size: 1.2rem;
  margin: 0 0 15px -26px; /* 向左偏移，对齐竖线 */
  display: flex;
  align-items: center;
  background: #f4f4f4; /* 背景色盖住线条 */
  display: inline-block;
  padding: 5px 10px;
  border-radius: 4px;
}

.icon-dot {
  display: inline-block;
  width: 12px; height: 12px;
  background: #333;
  border-radius: 50%;
  margin-right: 8px;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #eee;
}

.count {
  font-size: 0.8rem;
  color: #999;
  font-weight: normal;
  margin-left: 5px;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); /* 小方格布局 */
  gap: 10px;
}

.mini-card {
  aspect-ratio: 1; /* 正方形 */
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.mini-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.img-box {
  width: 100%; height: 100%;
}

.img-box img {
  width: 100%; height: 100%;
  object-fit: cover;
}
</style>