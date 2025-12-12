<script setup>
import {ref, computed, watch, onMounted, onActivated, nextTick} from 'vue';
import {useRoute, useRouter, onBeforeRouteLeave} from 'vue-router';
import {store} from '../store';
import dayjs from 'dayjs';

// 💡 给组件命名，确保 keep-alive 能识别并缓存它
defineOptions({
  name: 'GalleryPage'
});

const route = useRoute();
const router = useRouter();

// 全局缓存对象 (组件销毁了它还在)
const scrollCache = {
  scrollY: 0,
  limit: 20,
  category: '全部'
};

const allPhotos = computed(() => store.photos || []);
const activeCategory = ref(route.params.name || '全部');
const PAGE_SIZE = 20;
const displayLimit = ref(PAGE_SIZE);
const bottomObserver = ref(null);

// 监听路由切换分类
watch(() => route.params.name, (newName) => {
  const newCat = newName || '全部';
  // 只有真正切换分类时才重置，从详情页返回时不重置
  if (newCat !== scrollCache.category) {
    activeCategory.value = newCat;
    displayLimit.value = PAGE_SIZE;
    scrollCache.category = newCat;
    scrollCache.scrollY = 0;
    scrollCache.limit = PAGE_SIZE;
    window.scrollTo(0, 0);
  }
});

const allFilteredPhotos = computed(() => {
  let result = allPhotos.value.filter(p => {
    const matchCategory = activeCategory.value === '全部' ? true : p.category === activeCategory.value;
    const query = store.searchQuery.toLowerCase();
    const matchSearch = !query ||
        p.category.toLowerCase().includes(query) ||
        (p.exif?.model && p.exif.model.toLowerCase().includes(query)) ||
        p.name.toLowerCase().includes(query) ||
        (p.date && dayjs(p.date).format('YYYY').includes(query));
    return matchCategory && matchSearch;
  });
  return result.sort((a, b) => new Date(b.date) - new Date(a.date));
});

const visiblePhotos = computed(() => allFilteredPhotos.value.slice(0, displayLimit.value));

const loadMore = () => {
  if (displayLimit.value < allFilteredPhotos.value.length) {
    displayLimit.value += PAGE_SIZE;
  }
};

const loadedImages = ref(new Set());
const onImageLoad = (id) => loadedImages.value.add(id);
const formatDate = (date) => dayjs(date).format('YYYY.MM.DD');

// 悬浮日期
const currentDateLabel = ref('');
const showDateLabel = ref(false);
let scrollTimer = null;
const handleScroll = () => {
  showDateLabel.value = true;
  const cards = document.querySelectorAll('.photo-card');
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < window.innerHeight) {
      const dateStr = card.getAttribute('data-date');
      if (dateStr) currentDateLabel.value = dayjs(dateStr).format('YYYY年 MM月');
      break;
    }
  }
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => showDateLabel.value = false, 1500);
};

// --- 生命周期 ---

// 1. 首次进入
onMounted(() => {
  store.initData();

  // 恢复之前的数据量
  if (scrollCache.limit > PAGE_SIZE) {
    displayLimit.value = scrollCache.limit;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMore();
  }, {rootMargin: '200px'});

  if (bottomObserver.value) observer.observe(bottomObserver.value);
  window.addEventListener('scroll', handleScroll, {passive: true});
});

// 2. 从详情页返回时触发 (因为被 keep-alive 缓存了)
onActivated(() => {
  // 恢复之前的滚动位置
  if (scrollCache.scrollY > 0) {
    // nextTick 确保 DOM 已经更新
    nextTick(() => {
      window.scrollTo(0, scrollCache.scrollY);
    });
  }
});

// 3. 离开页面前保存状态
onBeforeRouteLeave((to, from, next) => {
  scrollCache.scrollY = window.scrollY;
  scrollCache.limit = displayLimit.value;
  scrollCache.category = activeCategory.value;
  next();
});

const goToDetail = (id) => router.push(`/photo/${id}`);
</script>

<template>
  <div class="gallery-container">
    <Transition name="fade">
      <div v-show="showDateLabel && currentDateLabel" class="floating-date-badge">{{ currentDateLabel }}</div>
    </Transition>

    <header class="gallery-header" v-if="!store.searchQuery">
      <div class="header-content">
        <h2 class="category-title">{{ activeCategory }}</h2>
        <p class="stats">
          {{ allFilteredPhotos.length }} Frames
        </p>
      </div>
    </header>

    <div v-else class="search-feedback">Searching for "<span>{{ store.searchQuery }}</span>"</div>

    <div class="masonry-columns">
      <div
          v-for="photo in visiblePhotos"
          :key="photo.id"
          class="photo-card"
          :data-date="photo.date"
          @click="goToDetail(photo.id)"
      >
        <div class="img-container" :class="{ 'loaded': loadedImages.has(photo.id) }">
          <img
              :src="photo.thumb || photo.url"
              loading="lazy"
              :alt="photo.name"
              @load="onImageLoad(photo.id)"/>

          <div class="overlay">
            <div class="overlay-content">
              <h3 class="photo-title">{{ photo.category }}</h3>
              <div class="exif-info" v-if="photo.exif">
                <p v-if="photo.exif.model">{{ photo.exif.model }}</p>
                <p class="date">{{ formatDate(photo.date) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div ref="bottomObserver" class="loading-trigger">
      <span v-if="displayLimit < allFilteredPhotos.length">Loading...</span>
      <span v-else class="end-text">The End.</span>
    </div>
  </div>
</template>

<style scoped>
.gallery-container {
  padding: 100px 40px 40px;
  max-width: 1800px;
  margin: 0 auto;
  min-height: 100vh;
}

.gallery-header {
  margin-bottom: 50px;
  padding: 0 10px;
  animation: slideDown 0.8s ease-out;
}

.category-title {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -1px;
  margin: 0;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.stats {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-top: 5px;
}

/* --- 瀑布流核心 --- */
.masonry-columns {
  column-count: 5;
  column-gap: 20px;
}

.photo-card {
  /* 避免元素被列打断，这很重要 */
  break-inside: avoid;
  margin-bottom: 20px;
  position: relative;
  cursor: pointer;
  backface-visibility: hidden;
}

.img-container {
  border-radius: 12px;
  overflow: hidden;
  background: #222; /* 骨架屏底色 */
  position: relative;
  width: 100%;

  /* ✅ 关键修复：预设最小高度，防止加载前塌陷成黑条 */
  min-height: 250px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 图片加载完后，移除最小高度限制，让图片自然撑开 */
.img-container.loaded {
  min-height: auto;
  background: transparent;
}

.img-container img {
  width: 100%;
  height: auto; /* 高度自适应 */
  display: block;
  transition: opacity 0.5s ease;
  opacity: 0;
}

.img-container.loaded img {
  opacity: 1;
}

/* 悬停效果 */
.img-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 40%);
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
}

.img-container:hover .overlay {
  opacity: 1;
}

.overlay-content {
  transform: translateY(10px);
  transition: transform 0.3s;
  color: white;
}

.img-container:hover .overlay-content {
  transform: translateY(0);
}

.photo-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.exif-info {
  font-size: 0.8rem;
  opacity: 0.9;
}

.loading-trigger {
  text-align: center;
  padding: 60px;
  color: #666;
  font-size: 0.9rem;
  width: 100%;
}

.floating-date-badge {
  position: fixed;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 8px 18px;
  border-radius: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  z-index: 100;
  pointer-events: none;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 1600px) {
  .masonry-columns {
    column-count: 4;
  }
}

@media (max-width: 1200px) {
  .masonry-columns {
    column-count: 3;
  }
}

@media (max-width: 768px) {
  .gallery-container {
    padding: 80px 15px 20px;
  }

  .masonry-columns {
    column-count: 2;
    column-gap: 10px;
  }

  .photo-card {
    margin-bottom: 10px;
  }

  .category-title {
    font-size: 2rem;
  }
}
</style>