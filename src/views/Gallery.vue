<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store } from '../store';
import photosData from '@/assets/photos.json';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter(); // 引入 router 用于跳转

const allPhotos = ref(photosData);
const activeCategory = ref(route.params.name || '全部');

// --- 无限滚动逻辑 ---
const PAGE_SIZE = 20; // 每次加载多少张
const displayLimit = ref(PAGE_SIZE); // 当前显示的数量
const bottomObserver = ref(null); // 底部观察者元素

// 监听路由变化
watch(() => route.params.name, (newName) => {
  activeCategory.value = newName || '全部';
  displayLimit.value = PAGE_SIZE; // 切换分类时重置数量
  window.scrollTo(0, 0); // 回到顶部
});

// 计算所有符合条件的照片 (不限制数量)
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

// 计算当前应该渲染的照片 (限制数量，解决 DOM 卡顿)
const visiblePhotos = computed(() => {
  return allFilteredPhotos.value.slice(0, displayLimit.value);
});

// 加载更多函数
const loadMore = () => {
  if (displayLimit.value < allFilteredPhotos.value.length) {
    displayLimit.value += PAGE_SIZE;
  }
};

// IntersectionObserver 监听底部
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadMore();
    }
  }, { rootMargin: '200px' }); // 提前 200px 预加载

  if (bottomObserver.value) observer.observe(bottomObserver.value);
});

// --- 其他逻辑 ---
const loadedImages = ref(new Set());
const onImageLoad = (id) => loadedImages.value.add(id);
const formatDate = (date) => dayjs(date).format('YYYY.MM.DD');

// 悬浮时间标
const currentDateLabel = ref('');
const showDateLabel = ref(false);
let scrollTimer = null;

const handleScroll = () => {
  const container = document.querySelector('.main-content');
  if (!container) return;

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

onMounted(() => document.querySelector('.main-content')?.addEventListener('scroll', handleScroll, { passive: true }));
onUnmounted(() => document.querySelector('.main-content')?.removeEventListener('scroll', handleScroll));

// 跳转详情
const goToDetail = (id) => {
  router.push(`/photo/${id}`);
};
</script>

<template>
  <div class="gallery-container">

    <Transition name="fade">
      <div v-show="showDateLabel && currentDateLabel" class="floating-date-badge">
        {{ currentDateLabel }}
      </div>
    </Transition>

    <header class="gallery-header" v-if="!store.searchQuery">
      <div class="header-content">
        <h2 class="category-title">{{ activeCategory }}</h2>
        <p class="stats">
          {{ allFilteredPhotos.length }} Frames ·
          <span v-if="allFilteredPhotos.length > 0">
             {{ dayjs(allFilteredPhotos[allFilteredPhotos.length-1].date).format('YYYY.MM') }} -
             {{ dayjs(allFilteredPhotos[0].date).format('YYYY.MM') }}
          </span>
        </p>
      </div>
    </header>

    <div v-else class="search-feedback">
      Searching for "<span>{{ store.searchQuery }}</span>"
    </div>

    <div class="masonry-grid">
      <TransitionGroup name="list">
        <div
            v-for="photo in visiblePhotos"
            :key="photo.id"
            class="photo-card"
            :data-date="photo.date"
            @click="goToDetail(photo.id)"
        >
          <div class="img-container" :class="{ 'loaded': loadedImages.has(photo.id), 'skeleton-pulse': !loadedImages.has(photo.id) }">

            <img
                :src="photo.thumb || photo.url"
                loading="lazy"
                :alt="photo.name"
                @load="onImageLoad(photo.id)"
            />

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
      </TransitionGroup>
    </div>

    <div ref="bottomObserver" class="loading-trigger">
      <span v-if="displayLimit < allFilteredPhotos.length">Loading more memories...</span>
      <span v-else class="end-text">The End.</span>
    </div>

    <div v-if="allFilteredPhotos.length === 0" class="empty">
      <p>No moments found.</p>
    </div>
  </div>
</template>

<style scoped>
.gallery-container { padding: 40px 60px; max-width: 1800px; margin: 0 auto; position: relative; }

/* 悬浮时间标 */
.floating-date-badge {
  position: fixed; top: 30px; left: 300px; z-index: 100;
  background: rgba(30, 30, 30, 0.85); color: #fff;
  padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;
  backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.2); pointer-events: none;
}
@media (max-width: 768px) { .floating-date-badge { left: 20px; top: 20px; } }

/* Header */
.gallery-header { margin-bottom: 40px; border-bottom: 1px solid #f0f0f0; padding-bottom: 20px; }
.category-title { font-size: 32px; font-weight: 300; margin: 0; color: #1a1a1a; letter-spacing: -0.5px; }
.stats { color: #999; font-size: 13px; margin-top: 6px; font-family: monospace; }
.search-feedback { margin-bottom: 40px; font-size: 18px; color: #666; }
.search-feedback span { color: #000; font-weight: 600; border-bottom: 2px solid #ddd; }

/* 瀑布流 */
.masonry-grid { column-count: 4; column-gap: 20px; } /* 改为4列更紧凑 */
@media (max-width: 1600px) { .masonry-grid { column-count: 3; } }
@media (max-width: 1100px) { .masonry-grid { column-count: 2; } }
@media (max-width: 600px)  { .gallery-container { padding: 20px; } .masonry-grid { column-count: 1; } }

.photo-card { break-inside: avoid; margin-bottom: 20px; position: relative; border-radius: 12px; overflow: hidden; cursor: pointer; }

/* --- 骨架屏动画 --- */
@keyframes pulse {
  0% { background-color: #f0f0f0; }
  50% { background-color: #e0e0e0; }
  100% { background-color: #f0f0f0; }
}
.skeleton-pulse {
  animation: pulse 1.5s infinite ease-in-out;
}

.img-container {
  background: #f0f0f0; /* 默认灰色背景 */
  min-height: 250px; /* 默认高度，防止排版错乱 */
  position: relative;
}

.img-container img {
  width: 100%; display: block;
  opacity: 0; transition: opacity 0.5s ease, transform 0.5s ease; transform: scale(1.02);
}
.img-container.loaded img { opacity: 1; transform: scale(1); }

/* 悬停 */
.photo-card:hover img { transform: scale(1.05); }
.overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent 40%);
  opacity: 0; transition: all 0.3s ease;
  display: flex; align-items: flex-end; padding: 20px;
}
.photo-card:hover .overlay { opacity: 1; }
.overlay-content { color: #fff; width: 100%; transform: translateY(10px); transition: transform 0.3s; }
.photo-card:hover .overlay-content { transform: translateY(0); }
.photo-title { margin: 0 0 4px 0; font-size: 15px; font-weight: 600; }
.exif-info { font-size: 11px; opacity: 0.9; }

/* 底部加载更多 */
.loading-trigger { text-align: center; padding: 40px; color: #999; font-size: 14px; clear: both; }
.end-text { color: #ccc; font-style: italic; }

.list-enter-active, .list-leave-active { transition: all 0.5s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px); }
.list-leave-active { position: absolute; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
