<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
// import photosData from '@/assets/photos.json'; // ❌ 删除
import { store } from "@/store.js"; // ✅ 引入 store

const router = useRouter();

// 核心：CDN 加速函数 (和前面一样)
const getOptimizedUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  const user = 'gc-china';
  const repo = 'vue-photo-wall';
  const branch = 'main';

  let path = url;
  if (path.startsWith('/')) path = path.slice(1);
  if (!path.startsWith('public/')) path = 'public/' + path;

  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${encodedPath}`;
};

// 使用 store 中的数据
const photosData = computed(() => store.photos || []);

const albums = computed(() => {
  const map = new Map();
  // 使用 .value 来访问 computed 的值
  photosData.value.forEach(photo => {
    if (!map.has(photo.category)) {
      map.set(photo.category, {
        name: photo.category,
        cover: photo.url,
        count: 0,
        year: photo.date ? new Date(photo.date).getFullYear() : ''
      });
    }
    map.get(photo.category).count++;
  });
  return Array.from(map.values());
});

const randomBg = ref('');

// 数据初始化与随机背景
onMounted(() => {
  store.initData();
});

// 监听数据加载，加载完后再设置随机背景
watch(photosData, (newVal) => {
  if (newVal.length > 0 && !randomBg.value) {
    const randomIndex = Math.floor(Math.random() * newVal.length);
    randomBg.value = newVal[randomIndex].url;
  }
}, {immediate: true});

const goToAlbum = (name) => {
  router.push({name: 'category', params: {name}});
};
</script>

<template>
  <div class="albums-page-container">
    <div class="bg-layer" :style="{ backgroundImage: `url(${getOptimizedUrl(randomBg)})` }"></div>
    <div class="bg-overlay"></div>

    <div class="content-layer">
      <header class="page-header">
        <h2 class="title">Album Collections</h2>
        <p class="subtitle">Stored memories categorized by location.</p>
      </header>

      <div class="albums-grid">
        <div
            v-for="(album, index) in albums"
            :key="album.name"
            class="album-card"
            :style="{ '--delay': index * 0.1 + 's' }"
            @click="goToAlbum(album.name)"
        >
          <div class="card-image">
            <img :src="getOptimizedUrl(album.cover)" loading="lazy"/>
            <div class="card-overlay"></div>
          </div>

          <div class="card-info">
            <div class="album-meta">
              <span class="year" v-if="album.year">{{ album.year }}</span>
              <span class="count">{{ album.count }} items</span>
            </div>
            <h3 class="album-name">{{ album.name }}</h3>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式保持不变 */
.albums-page-container {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.bg-layer {
  position: fixed;
  inset: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(40px);
  z-index: 0;
  transition: background-image 1s ease;
  opacity: 0.6;
}

.bg-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.content-layer {
  position: relative;
  z-index: 10;
  padding: 60px 80px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 60px;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 10px 0;
  letter-spacing: -1px;
}

.subtitle {
  font-size: 16px;
  opacity: 0.8;
  font-weight: 300;
  letter-spacing: 0.5px;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

/* --- 核心动画部分 --- */
.album-card {
  position: relative;
  aspect-ratio: 3/4;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.1);

  /* 初始状态：透明且下沉 */
  opacity: 0;
  transform: translateY(30px);
  /* 执行动画：名为 popIn，持续 0.6s，延迟由 JS 变量控制 */
  animation: popIn 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
  animation-delay: var(--delay);

  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}

/* 悬停时的“起飞”效果 */
.album-card:hover {
  transform: translateY(-10px) scale(1.02) !important; /* 加 !important 覆盖动画结束状态 */
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.4);
  z-index: 10;
}

.card-image {
  width: 100%;
  height: 100%;
  position: relative;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease;
  opacity: 0.9;
}

.album-card:hover .card-image img {
  transform: scale(1.1);
  opacity: 1;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 60%);
}

.card-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 25px;
  color: #fff;
  transform: translateY(5px);
  transition: transform 0.3s;
}

.album-card:hover .card-info {
  transform: translateY(0);
}

.album-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.album-name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* --- 动画关键帧 --- */
@keyframes popIn {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .content-layer {
    padding: 30px 20px;
  }

  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }

  .title {
    font-size: 32px;
  }
}
</style>