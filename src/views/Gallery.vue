<script setup>
import {ref, computed, watch, onMounted, onActivated, onDeactivated, onUnmounted, nextTick} from 'vue';
import {useRoute, useRouter, onBeforeRouteLeave} from 'vue-router';
import {store} from '../store';
import dayjs from 'dayjs';
import PhotoCard from '../components/PhotoCard.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();

// 全局缓存对象 (组件销毁了它还在)
const scrollCache = {
  scrollY: 0,
  category: '',
  limit: 20
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

const onImageLoad = (id) => {
  // Logic handled in component, but can track metrics here if needed
};

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

  updateColumnCount();
  window.addEventListener('resize', updateColumnCount);
});

// 2. 从详情页返回时触发 (因为被 keep-alive 缓存了)
onActivated(() => {
  window.addEventListener('scroll', handleScroll, {passive: true});
  window.addEventListener('resize', updateColumnCount);
  
  // 恢复之前的滚动位置
  if (scrollCache.scrollY > 0) {
    // nextTick 确保 DOM 已经更新
    nextTick(() => {
      window.scrollTo(0, scrollCache.scrollY);
    });
  }
});

onDeactivated(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', updateColumnCount);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', updateColumnCount);
});

// 3. 离开页面前保存状态
onBeforeRouteLeave((to, from, next) => {
  scrollCache.scrollY = window.scrollY;
  scrollCache.limit = displayLimit.value;
  next();
});

const goToDetail = (id) => router.push(`/photo/${id}`);

// --- Masonry Layout Logic ---
const columnCount = ref(5);
const updateColumnCount = () => {
  const w = window.innerWidth;
  if (w < 600) columnCount.value = 1;
  else if (w < 900) columnCount.value = 2;
  else if (w < 1200) columnCount.value = 3;
  else if (w < 1600) columnCount.value = 4;
  else columnCount.value = 5;
};

const columns = computed(() => {
  const cols = Array.from({ length: columnCount.value }, () => []);
  visiblePhotos.value.forEach((photo, index) => {
    cols[index % columnCount.value].push(photo);
  });
  return cols;
});
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

    <div class="masonry-wrapper">
      <div v-for="(col, colIndex) in columns" :key="colIndex" class="masonry-column">
        <PhotoCard
          v-for="photo in col"
          :key="photo.id"
          :photo="photo"
          @click="goToDetail"
          @load="onImageLoad"
        />
      </div>
    </div>

    <div ref="bottomObserver" class="loading-trigger">
      <LoadingSpinner v-if="displayLimit < allFilteredPhotos.length" />
      <span v-else class="end-text">The End.</span>
    </div>
  </div>
</template>

<style scoped>
.gallery-container {
  padding: 80px 40px 40px;
  max-width: 1920px;
  margin: 0 auto;
  min-height: 100vh;
}

.gallery-header {
  margin-bottom: 40px;
  padding: 0 10px;
  animation: slideDown 0.6s ease-out;
}

.category-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -1px;
  margin: 0;
  color: #111;
  line-height: 1.2;
}

.stats {
  color: #666;
  font-size: 0.9rem;
  margin-top: 5px;
  font-weight: 500;
}

.search-feedback {
  padding: 20px;
  font-size: 1.2rem;
  color: #333;
}

.search-feedback span {
  font-weight: bold;
}

/* --- Masonry JS Implementation --- */
.masonry-wrapper {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.masonry-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.loading-trigger {
  display: flex;
  justify-content: center;
  padding: 40px 0;
  width: 100%;
}

.end-text {
  color: #999;
  font-size: 0.9rem;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.floating-date-badge {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 8px 20px;
  border-radius: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  z-index: 100;
  pointer-events: none;
  border: 1px solid rgba(0,0,0,0.05);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-15px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

/* 响应式 */
@media (max-width: 1600px) {
  /* Column count handled by JS */
}

@media (max-width: 768px) {
  .gallery-container {
    padding: 70px 16px 20px;
  }

  .masonry-wrapper {
    gap: 12px;
  }
  
  .masonry-column {
    gap: 12px;
  }

  .category-title {
    font-size: 1.8rem;
  }
}
</style>
