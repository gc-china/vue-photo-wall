<script setup>
import { ref, computed } from 'vue';
import photosData from '@/assets/photos.json';
import dayjs from 'dayjs';

// --- 数据处理 ---
// 将照片数据转换为： { "2023": { "12月": [photos...], "10月": [photos...] } }
const timelineData = computed(() => {
  const groups = {};

  // 先按时间倒序排一下源数据
  const sortedPhotos = [...photosData].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedPhotos.forEach(photo => {
    const d = dayjs(photo.date);
    const year = d.format('YYYY');
    const month = d.format('MMMM'); // 例如 "December" 或 "12月" (取决于你的dayjs locale)

    if (!groups[year]) groups[year] = {};
    if (!groups[year][month]) groups[year][month] = [];

    groups[year][month].push(photo);
  });

  return groups;
});

// 记录加载状态
const loadedImages = ref(new Set());
const onImageLoad = (id) => loadedImages.value.add(id);
</script>

<template>
  <div class="timeline-container">
    <header class="page-header">
      <h2>Timeline</h2>
      <p>A journey through time.</p>
    </header>

    <div v-for="(months, year) in timelineData" :key="year" class="year-section">
      <div class="year-label">{{ year }}</div>

      <div class="timeline-track">
        <div v-for="(photos, month) in months" :key="month" class="month-group">

          <div class="time-node">
            <div class="dot"></div>
            <span class="month-name">{{ month }}</span>
          </div>

          <div class="month-grid">
            <div
                v-for="photo in photos"
                :key="photo.id"
                class="t-photo-card"
            >
              <div class="img-wrapper" :class="{ 'loaded': loadedImages.has(photo.id) }">
                <img
                    :src="photo.url"
                    loading="lazy"
                    @load="onImageLoad(photo.id)"
                />
                <div class="date-tag">{{ dayjs(photo.date).format('DD') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-container { padding: 40px 60px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 60px; text-align: center; }
.page-header h2 { font-size: 32px; font-weight: 300; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
.page-header p { color: #888; font-family: serif; font-style: italic; }

/* 年份区块 */
.year-section { position: relative; margin-bottom: 60px; }
.year-label {
  font-size: 60px; font-weight: 900; color: rgba(0,0,0,0.05);
  position: absolute; top: -30px; left: -20px; z-index: 0;
  font-family: Arial, sans-serif; pointer-events: none;
}

/* 时间轴轨道 */
.timeline-track {
  border-left: 2px solid #e5e5e5;
  margin-left: 20px;
  padding-left: 40px; /* 给圆点和文字留空间 */
  padding-top: 10px;
}

.month-group { margin-bottom: 50px; position: relative; }

/* 时间节点（圆点+月份） */
.time-node {
  position: absolute; left: -49px; top: 0;
  display: flex; align-items: center;
}
.dot {
  width: 16px; height: 16px; background: #fff; border: 3px solid #333;
  border-radius: 50%; box-shadow: 0 0 0 4px #fff;
}
.month-name {
  margin-left: 20px; font-weight: 600; font-size: 16px; color: #333;
  text-transform: uppercase; letter-spacing: 1px;
}

/* 照片网格 */
.month-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px; margin-top: 20px;
}

/* 小照片卡片 */
.t-photo-card {
  aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: zoom-in;
}

.img-wrapper {
  width: 100%; height: 100%; background: #f0f0f0; position: relative;
}
.img-wrapper img {
  width: 100%; height: 100%; object-fit: cover;
  opacity: 0; transition: opacity 0.5s ease, transform 0.5s ease;
}
.img-wrapper:hover img { transform: scale(1.1); }
.img-wrapper.loaded img { opacity: 1; }

/* 日期小角标 */
.date-tag {
  position: absolute; bottom: 5px; right: 5px;
  background: rgba(0,0,0,0.6); color: #fff;
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  backdrop-filter: blur(2px);
}

@media (max-width: 768px) {
  .timeline-container { padding: 20px; }
  .timeline-track { margin-left: 10px; padding-left: 25px; }
  .time-node { left: -34px; }
  .year-label { font-size: 40px; top: -20px; }
}
</style>
