<script setup>
import {ref, computed, watch, onMounted, onActivated, onDeactivated, onUnmounted, nextTick} from 'vue';
import {useRoute, useRouter, onBeforeRouteLeave} from 'vue-router';
import {store} from '../store';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();

// 全局缓存对象
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

// --- Modal Logic ---
const isModalOpen = ref(false);
const currentPhoto = ref(null);

const openModal = (photo) => {
  currentPhoto.value = photo;
  isModalOpen.value = true;
  document.body.style.overflow = 'hidden';
};

const closeModal = () => {
  isModalOpen.value = false;
  document.body.style.overflow = 'auto';
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeModal();
  }
};

// --- Back to Top Logic ---
const showBackToTop = ref(false);
const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300;
};
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- Image Error Handling ---
const handleImageError = (e) => {
  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veS4rTwvdGV4dD48L3N2Zz4=';
};

// --- Masonry Layout Logic ---
const columnCount = ref(4);
const updateColumnCount = () => {
  const w = window.innerWidth;
  if (w < 480) columnCount.value = 1;
  else if (w < 768) columnCount.value = 2;
  else if (w < 1200) columnCount.value = 3;
  else columnCount.value = 4;
};

const columns = computed(() => {
  const cols = Array.from({ length: columnCount.value }, () => []);
  visiblePhotos.value.forEach((photo, index) => {
    cols[index % columnCount.value].push(photo);
  });
  return cols;
});

// --- Lifecycle ---
onMounted(() => {
  store.initData();
  if (scrollCache.limit > PAGE_SIZE) {
    displayLimit.value = scrollCache.limit;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMore();
  }, {rootMargin: '200px'});

  if (bottomObserver.value) observer.observe(bottomObserver.value);

  updateColumnCount();
  window.addEventListener('resize', updateColumnCount);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('scroll', handleScroll);
});

onActivated(() => {
  window.addEventListener('resize', updateColumnCount);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('scroll', handleScroll);
  if (scrollCache.scrollY > 0) {
    nextTick(() => {
      window.scrollTo(0, scrollCache.scrollY);
    });
  }
});

onDeactivated(() => {
  window.removeEventListener('resize', updateColumnCount);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateColumnCount);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('scroll', handleScroll);
});

onBeforeRouteLeave((to, from, next) => {
  scrollCache.scrollY = window.scrollY;
  scrollCache.limit = displayLimit.value;
  next();
});
</script>

<template>
  <div class="gallery-container">
    
    <!-- Header -->
    <header class="header">
        <h1>美好时光照片墙</h1>
    </header>

    <!-- Controls/Filter -->
    <div class="controls" v-if="!store.searchQuery">
       <h2 class="current-category">{{ activeCategory }}</h2>
    </div>
    <div v-else class="search-feedback">Searching for "<span>{{ store.searchQuery }}</span>"</div>

    <!-- Photo Grid -->
    <div class="photo-gallery">
      <div v-for="(col, colIndex) in columns" :key="colIndex" class="masonry-column">
        <div 
          v-for="photo in col" 
          :key="photo.id" 
          class="photo-item"
          @click="openModal(photo)"
        >
          <img 
            :src="photo.thumb || photo.url" 
            :alt="photo.name" 
            loading="lazy"
            @error="handleImageError"
          >
        </div>
      </div>
    </div>

    <div ref="bottomObserver" class="loading-trigger">
      <LoadingSpinner v-if="displayLimit < allFilteredPhotos.length" />
      <span v-else class="end-text">The End.</span>
    </div>

    <!-- Modal -->
    <div class="modal" :class="{ active: isModalOpen }" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeModal">
          <svg class="close-icon" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <img 
          v-if="currentPhoto" 
          :src="currentPhoto.url" 
          :alt="currentPhoto.name"
          @error="handleImageError"
        >
      </div>
    </div>

    <!-- Back to Top -->
    <button class="back-to-top" :class="{ visible: showBackToTop }" @click="scrollToTop">
        <svg class="arrow-up-icon" viewBox="0 0 24 24">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
        </svg>
    </button>

  </div>
</template>

<style scoped>
/* Base Styles from photo-wall.html adapted */
.gallery-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff9f0 0%, #fef8e7 100%);
  padding-bottom: 40px;
}

/* Header */
.header {
  text-align: center;
  padding: 60px 20px 40px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 182, 193, 0.2);
  margin-bottom: 30px;
}

.header h1 {
  font-size: 3.2em;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 15px;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.05);
  margin-top: 0;
}

.header p {
  font-size: 1.2em;
  color: #5d6d7e;
  font-weight: 300;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Controls */
.controls {
  text-align: center;
  margin-bottom: 30px;
}

.current-category {
  font-size: 2em;
  color: #2c3e50;
  font-weight: 600;
}

.search-feedback {
  text-align: center;
  padding: 20px;
  font-size: 1.2rem;
  color: #333;
}

.search-feedback span {
  font-weight: bold;
}

/* Photo Gallery Grid */
.photo-gallery {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 25px;
  align-items: flex-start;
}

.masonry-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 25px;
  min-width: 0;
}

/* Photo Item Card */
.photo-item {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: white;
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
}

.photo-item:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
  z-index: 10;
}

.photo-item img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.5s ease;
}

.photo-item:hover img {
  transform: scale(1.05);
}

.photo-info {
  padding: 20px;
  background: white;
  position: relative;
  z-index: 2;
}

.photo-title {
  font-size: 1.15em;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.photo-category {
  display: inline-block;
  padding: 6px 14px;
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  color: #2c3e50;
  font-size: 0.85em;
  font-weight: 500;
  border-radius: 20px;
  margin-bottom: 10px;
}

.photo-desc {
  font-size: 0.95em;
  color: #7f8c8d;
  line-height: 1.5;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.photo-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #ecf0f1;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 0.95em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 12px;
  border-radius: 20px;
}

.like-btn:hover {
  background: rgba(231, 76, 60, 0.1);
  transform: scale(1.05);
}

.like-btn.liked {
  background: rgba(231, 76, 60, 0.15);
}

.heart-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
  transition: transform 0.3s ease;
}

.like-btn:hover .heart-icon {
  transform: scale(1.2);
}

.photo-date {
  font-size: 0.85em;
  color: #95a5a6;
}

/* Modal */
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
  align-items: center;
  justify-content: center;
}

.modal.active {
  display: flex;
  opacity: 1;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 70px rgba(0,0,0,0.3);
  transform: scale(0.8);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.modal.active .modal-content {
  transform: scale(1);
}

.modal img {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  background: #000;
}

.modal-info {
  padding: 30px;
  background: white;
  overflow-y: auto;
}

.modal-title {
  font-size: 1.8em;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 15px 0;
}

.modal-desc {
  font-size: 1.1em;
  color: #5d6d7e;
  line-height: 1.6;
  margin-bottom: 20px;
}

.modal-meta {
  display: flex;
  gap: 20px;
  color: #95a5a6;
  font-size: 0.9em;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.close-btn:hover {
  background: white;
  transform: scale(1.1);
}

.close-icon {
  width: 24px;
  height: 24px;
  fill: #2c3e50;
}

/* Back to Top */
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 6px 25px rgba(0,0,0,0.2);
  z-index: 100;
}

.back-to-top.visible {
  opacity: 1;
  visibility: visible;
}

.back-to-top:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 35px rgba(0,0,0,0.3);
}

.arrow-up-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
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

/* Responsive */
@media (max-width: 768px) {
  .header {
    padding: 40px 20px 30px;
  }
  
  .header h1 {
    font-size: 2.5em;
  }
  
  .photo-gallery {
    gap: 15px;
    padding: 0 15px;
  }
  
  .masonry-column {
    gap: 15px;
  }
  
  .modal-content {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  
  .modal img {
    max-height: 60vh;
  }
}
</style>