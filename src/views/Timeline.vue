<script setup>
import {onBeforeRouteLeave, useRouter} from 'vue-router';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import {computed, nextTick, onActivated, onMounted, ref, onUnmounted} from 'vue';
import {store} from "@/store.js";

// 设置中文日期格式
dayjs.locale('zh-cn');
defineOptions({
  name: 'TimelinePage'
});
const router = useRouter();
onMounted(() => {
  store.initData();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

const scrollCache = { scrollY: 0 };

// 离开前记录
onBeforeRouteLeave((to, from, next) => {
  scrollCache.scrollY = window.scrollY;
  next();
});
onActivated(() => {
  if (scrollCache.scrollY > 0) {
    nextTick(() => window.scrollTo(0, scrollCache.scrollY));
  }
});

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

const formatDate = (dateString) => {
  if (!dateString) return '';
  return dayjs(dateString).format('YYYY年MM月DD日');
};

// --- Image Error Handling ---
const handleImageError = (e) => {
  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veS4rTwvdGV4dD48L3N2Zz4=';
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
            @click="openModal(photo)"
        >
          <div class="img-box">
            <img
                :src="photo.thumb || photo.url"
                loading="lazy"
                :alt="photo.name"
                @error="handleImageError"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="timelineGroups.length === 0" class="empty-state">
      暂无照片数据
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
        <div class="modal-info" v-if="currentPhoto">
          <h3 class="modal-title">{{ currentPhoto.name }}</h3>
          <p class="modal-desc">{{ currentPhoto.description || '暂无描述' }}</p>
          <div class="modal-meta">
             <span class="modal-date">{{ formatDate(currentPhoto.date) }}</span>
             <span class="modal-model" v-if="currentPhoto.exif?.model">Shot on {{ currentPhoto.exif.model }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.timeline-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); /* Updated background */
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

/* Modal Styles (Copied from Gallery.vue) */
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

/* Responsive for Modal */
@media (max-width: 768px) {
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