<script setup>
import {computed} from 'vue';
import {useRouter} from 'vue-router';
import photosData from '@/assets/photos.json'; // 保持你原有的引用方式
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn'; // 引入中文包，以便显示 "星期几"

dayjs.locale('zh-cn'); // 设置全局语言为中文

const router = useRouter();

// --- 数据处理：按 年-月-日 分组 ---
const timelineGroups = computed(() => {
  const groups = {};

  // 1. 先按时间倒序排序源数据（防止JSON里是乱序的）
  const sortedPhotos = [...photosData].sort((a, b) => {
    return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
  });

  sortedPhotos.forEach(photo => {
    // 核心修改：格式化改为 "2023年12月12日 星期二"
    // 你也可以只用 'YYYY年MM月DD日'
    const dateKey = dayjs(photo.date).format('YYYY年MM月DD日 dddd');

    if (!groups[dateKey]) {
      groups[dateKey] = {
        title: dateKey,    // 显示标题：2023年12月12日 星期二
        timestamp: dayjs(photo.date).valueOf(), // 用于后续排序
        photos: []
      };
    }
    groups[dateKey].photos.push(photo);
  });

  // 2. 将分组对象转为数组
  // 虽然源数据排过序，但对象键遍历顺序不稳定，建议再次按组的时间戳排序
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
            <img :src="photo.thumb || photo.url" loading="lazy"/>
          </div>
        </div>
      </div>
    </div>

    <div v-if="timelineGroups.length === 0" style="text-align:center; color:#999; padding:50px;">
      暂无照片数据
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  padding: 20px;
  max-width: 900px; /*稍微宽一点适应照片墙*/
  margin: 0 auto;
}

/* 左侧的时间线竖线 */
.time-section {
  position: relative;
  padding-left: 24px;
  padding-bottom: 30px; /* 每组之间的间距 */
  border-left: 2px solid #e0e0e0;
}

/* 最后一组去掉竖线（可选，看个人喜好） */
.time-section:last-child {
  border-left: 2px solid transparent;
}

/* 日期标题区域 */
.date-header {
  position: relative;
  margin-left: -31px; /* 向左偏移以对齐圆点 */
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

/* 时间轴上的圆点 */
.icon-dot {
  width: 14px;
  height: 14px;
  background: #fff;
  border: 3px solid #333; /* 实心圈风格 */
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px #f8f9fa; /* 利用阴影做遮挡线的间隔 */
}

/* 日期文字 */
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

/* 网格布局 */
.day-grid {
  display: grid;
  /* 响应式：最小宽度120px，自动填满 */
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.mini-card {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: #eee; /* 图片加载前的占位色 */
  transition: transform 0.2s, box-shadow 0.2s;
}

.mini-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.img-box {
  width: 100%;
  height: 100%;
}

.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>