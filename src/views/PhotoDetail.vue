<script setup>
import {computed, onMounted, onUnmounted, ref, watch, nextTick} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {store} from '@/store.js';
import dayjs from 'dayjs';
// 动态引入 leaflet 和 panzoom 以优化首屏性能
import 'leaflet/dist/leaflet.css';

const route = useRoute();
const router = useRouter();

// --- 性能监控 & 埋点 ---
const trackEvent = (action, label, data = {}) => {
  // 模拟埋点上报
  console.log(`[Analytics] ${action}`, { label, ...data, timestamp: Date.now() });
};

const startTime = ref(Date.now());
onMounted(() => {
  const loadTime = Date.now() - startTime.value;
  trackEvent('PageLoad', 'PhotoDetail', { duration: loadTime });
});

// --- 数据源 ---
const photosData = computed(() => store.photos || []);
const photo = computed(() => photosData.value.find(p => p.id === route.params.id));
const currentIndex = computed(() => photosData.value.findIndex(p => p.id === route.params.id));
const prevPhoto = computed(() => currentIndex.value > 0 ? photosData.value[currentIndex.value - 1] : null);
const nextPhoto = computed(() => currentIndex.value < photosData.value.length - 1 ? photosData.value[currentIndex.value + 1] : null);

// --- 图片加载状态 (骨架屏) ---
const imgLoading = ref(true);
watch(() => photo.value?.id, () => {
  imgLoading.value = true;
});

// --- Live Photo ---
const isPlaying = ref(false);
const videoRef = ref(null);
const togglePlay = () => {
  if (!videoRef.value) return;
  if (videoRef.value.paused) {
    videoRef.value.play();
    isPlaying.value = true;
    trackEvent('Interaction', 'PlayVideo');
  } else {
    videoRef.value.pause();
    isPlaying.value = false;
  }
};

// --- 侧边栏与地图 ---
const isInfoOpen = ref(true); // 默认桌面端展开
const mapContainer = ref(null);
let mapInstance = null;

// 初始化地图 (懒加载)
const initMap = async () => {
  // 1. 清理旧地图
  if (mapInstance) {
    mapInstance.off();
    mapInstance.remove();
    mapInstance = null;
  }
  // 2. 检查条件: 必须有 gps 数据，且容器存在
  if (!photo.value?.exif?.gps || !mapContainer.value) return;

  // 动态导入 Leaflet
  const L = (await import('leaflet')).default;

  const {lat, lng} = photo.value.exif.gps;

  // 3. 创建地图
  mapInstance = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
    dragging: false,
    doubleClickZoom: false
  }).setView([lat, lng], 13);

  // 4. 加载图层
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(mapInstance);

  // 5. 添加标记点
  L.circleMarker([lat, lng], {
    color: '#fff',
    fillColor: '#1890ff',
    fillOpacity: 1,
    radius: 8,
    weight: 3
  }).addTo(mapInstance);
};

const toggleInfo = () => {
  isInfoOpen.value = !isInfoOpen.value;
  trackEvent('Interaction', 'ToggleInfo', { state: isInfoOpen.value ? 'open' : 'closed' });
  
  if (isInfoOpen.value) {
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize();
      else initMap();
    }, 400);
  }
};

// --- 切换照片 ---
const switchPhoto = (targetId) => {
  if (targetId && targetId !== route.params.id) {
    router.replace(`/photo/${targetId}`).catch(() => {});
    trackEvent('Interaction', 'SwitchPhoto');
  }
};

const handleKeydown = (e) => {
  if (e.key === 'ArrowLeft' && prevPhoto.value) switchPhoto(prevPhoto.value.id);
  if (e.key === 'ArrowRight' && nextPhoto.value) switchPhoto(nextPhoto.value.id);
  if (e.key === 'Escape') router.back();
  if (e.key === 'i' || e.key === 'I') toggleInfo();
  if (e.key === ' ' && photo.value?.type === 'video') {
    e.preventDefault();
    togglePlay();
  }
};

onMounted(() => {
  store.initData();
  window.addEventListener('keydown', handleKeydown);
  
  // 检查是否为移动端，如果是则默认收起侧边栏
  if (window.innerWidth <= 900) {
    isInfoOpen.value = false;
  }
  
  nextTick(() => {
    if (isInfoOpen.value) initMap();
  });
});

onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

// --- 缩放 (Panzoom) ---
const mainImgRef = ref(null);
let panzoomInstance = null;
const initPanzoom = async () => {
  if (panzoomInstance) {
    panzoomInstance.dispose();
    panzoomInstance = null;
  }
  if (mainImgRef.value && photo.value?.type !== 'video') {
    // 动态导入 panzoom
    const panzoom = (await import('panzoom')).default;
    
    panzoomInstance = panzoom(mainImgRef.value, {
      maxZoom: 5, minZoom: 0.5, bounds: true, boundsPadding: 0.1, onTouch: () => false
    });
  }
};

// --- 胶卷条 ---
const filmstripRef = ref(null);
const thumbnailRefs = ref({});
const scrollToActiveThumbnail = () => {
  const activeId = route.params.id;
  const el = thumbnailRefs.value[activeId];
  if (el && filmstripRef.value) el.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
};

// 监听照片切换
watch(() => route.params.id, (newId) => {
  if (!newId) return;
  isPlaying.value = false;
  nextTick(() => {
    if (isInfoOpen.value) initMap();
    initPanzoom();
    scrollToActiveThumbnail();
  });
}, {immediate: true});

const close = () => router.back();
const thumbLoaded = ref(new Set());
const onThumbLoad = (id) => thumbLoaded.value.add(id);

// 手势相关
const touchStartX = ref(0);
const touchEndX = ref(0);
const handleTouchStart = (e) => {
  if (e.touches.length === 1) touchStartX.value = e.changedTouches[0].screenX;
};
const handleTouchEnd = (e) => {
  if (e.changedTouches.length === 1) {
    touchEndX.value = e.changedTouches[0].screenX;
    if (Math.abs(touchEndX.value - touchStartX.value) > 50) {
      if (touchEndX.value < touchStartX.value - 50 && nextPhoto.value) switchPhoto(nextPhoto.value.id);
      if (touchEndX.value > touchStartX.value + 50 && prevPhoto.value) switchPhoto(prevPhoto.value.id);
    }
  }
};
</script>

<template>
  <div class="detail-container" v-if="photo">
    <!-- 背景模糊层 -->
    <div class="blur-bg" :style="{ backgroundImage: `url(${photo.url})` }"></div>
    <div class="blur-overlay"></div>

    <div class="main-layout">
      <!-- 预览区域 -->
      <div class="preview-area" @touchstart.passive="handleTouchStart" @touchend.passive="handleTouchEnd">
        <!-- 顶部工具栏 -->
        <div class="toolbar">
          <button class="icon-btn info-toggle" :class="{ 'active': isInfoOpen }" @click="toggleInfo" aria-label="Toggle Info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
          <button class="icon-btn close-btn" @click="close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- 主内容区 -->
        <div class="image-wrapper">
          <!-- 左右导航箭头 -->
          <button class="nav-arrow left desktop-only" v-if="prevPhoto" @click.stop="switchPhoto(prevPhoto.id)" aria-label="Previous">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <!-- 视频播放器 -->
          <div class="panzoom-container video-container" v-if="photo.type === 'video'" @click.stop="togglePlay">
            <video ref="videoRef" :src="photo.url" :poster="photo.thumb" loop muted playsinline
                   class="main-video"></video>
            <div class="live-badge" :class="{ 'active': isPlaying }">
              <div class="live-icon"><span></span></div>
              LIVE
            </div>
          </div>

          <!-- 图片查看器 -->
          <div class="panzoom-container" v-else>
            <!-- 骨架屏加载状态 -->
            <div v-if="imgLoading" class="skeleton-loader main-img-skeleton">
              <div class="spinner"></div>
            </div>
            <img 
              ref="mainImgRef" 
              :src="photo.url" 
              :alt="photo.name" 
              class="main-img" 
              v-show="!imgLoading"
              @load="imgLoading = false"
            />
          </div>

          <button class="nav-arrow right desktop-only" v-if="nextPhoto" @click.stop="switchPhoto(nextPhoto.id)" aria-label="Next">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <!-- 底部胶卷条 -->
        <div class="filmstrip-container">
          <div class="filmstrip" ref="filmstripRef">
            <div v-for="p in photosData" :key="p.id" class="thumb-item" :class="{ active: p.id === photo.id }"
                 :ref="(el) => { if (el) thumbnailRefs[p.id] = el }" @click.stop="switchPhoto(p.id)">
              <img :src="p.url" loading="lazy" :class="{ 'visible': thumbLoaded.has(p.id) }" @load="onThumbLoad(p.id)"/>
            </div>
          </div>
        </div>
      </div>

      <!-- 信息侧边栏 (支持移动端抽屉效果) -->
      <aside class="sidebar" :class="{ 'sidebar-closed': !isInfoOpen }">
        <div class="mobile-handle" @click="toggleInfo"></div>

        <div class="map-section-wrapper" v-if="photo.exif?.gps">
          <div ref="mapContainer" class="map-view"></div>
          <div class="map-overlay"></div>
        </div>

        <div class="sidebar-content">
          <div class="info-block">
            <h3 class="block-title">基本信息</h3>
            <dl class="info-list">
              <div class="row">
                <dt>文件名</dt>
                <dd :title="photo.name">{{ photo.name }}</dd>
              </div>
              <div class="row">
                <dt>尺寸</dt>
                <dd>{{ photo.width }} × {{ photo.height }}</dd>
              </div>
              <div class="row">
                <dt>大小</dt>
                <dd>{{ photo.size }}</dd>
              </div>
              <div class="row">
                <dt>时间</dt>
                <dd>{{ dayjs(photo.date).format('YYYY/MM/DD HH:mm') }}</dd>
              </div>
            </dl>
          </div>

          <div class="info-block">
            <div class="album-tag-box"><span class="icon">📂</span> {{ photo.category }}</div>
          </div>

          <div class="info-block" v-if="photo.exif">
            <h3 class="block-title">拍摄参数</h3>
            <div class="params-grid">
              <div class="param-item">
                <span class="p-label">焦距</span>
                <span class="p-val">{{ photo.exif.focal }}</span>
              </div>
              <div class="param-item">
                <span class="p-label">光圈</span>
                <span class="p-val">{{ photo.exif.fstop }}</span>
              </div>
              <div class="param-item">
                <span class="p-label">快门</span>
                <span class="p-val">{{ photo.exif.shutter }}</span>
              </div>
              <div class="param-item">
                <span class="p-label">ISO</span>
                <span class="p-val">{{ photo.exif.iso }}</span>
              </div>
            </div>
          </div>

          <div class="info-block" v-if="photo.exif">
            <h3 class="block-title">设备信息</h3>
            <dl class="info-list">
              <div class="row">
                <dt>相机</dt>
                <dd>{{ photo.exif.make }} {{ photo.exif.model }}</dd>
              </div>
              <div class="row">
                <dt>镜头</dt>
                <dd :title="photo.exif.lens">{{ photo.exif.lens }}</dd>
              </div>
              <div class="row">
                <dt>35mm</dt>
                <dd>{{ photo.exif.focal35 }}</dd>
              </div>
              <div class="row">
                <dt>软件</dt>
                <dd>{{ photo.exif.software }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* 基础布局 */
.detail-container {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  background: #000;
  flex-direction: column;
}

.blur-bg {
  position: absolute;
  inset: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(60px) brightness(0.3);
  opacity: 0.8;
  will-change: transform;
}

.blur-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

.main-layout {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 50;
  display: flex;
  gap: 12px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(5px);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.icon-btn:active {
  transform: scale(0.95);
}

.icon-btn.active {
  background: #fff;
  color: #000;
}

/* 预览区 */
.preview-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
}

.image-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 骨架屏加载动画 */
.skeleton-loader {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.panzoom-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  position: relative;
}

.main-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  will-change: transform; /* 硬件加速 */
}

.video-container {
  cursor: pointer !important;
}

.main-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: #fff;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  backdrop-filter: blur(4px);
  transition: all 0.2s;
}

.nav-arrow:hover {
  background: rgba(255, 255, 255, 0.15);
}

.nav-arrow.left { left: 20px; }
.nav-arrow.right { right: 20px; }

.live-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(230, 230, 230, 0.25);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 30;
  pointer-events: none;
  transition: all 0.3s ease;
}

.live-badge.active {
  background: rgba(255, 204, 0, 0.9);
  color: #000;
}

.live-icon {
  width: 14px;
  height: 14px;
  border: 1.5px dotted currentColor;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.live-icon span {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
}

/* 胶卷 */
.filmstrip-container {
  height: 80px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 20;
}

.filmstrip {
  display: flex;
  gap: 10px;
  padding: 0 20px;
  overflow-x: auto;
  width: 100%;
  height: 50px;
  align-items: center;
  scrollbar-width: none;
}

.filmstrip::-webkit-scrollbar {
  display: none;
}

.thumb-item {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  opacity: 0.4;
  transition: all 0.2s;
  border: 2px solid transparent;
  cursor: pointer;
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s;
}

.thumb-item img.visible { opacity: 1; }

.thumb-item.active {
  opacity: 1;
  border-color: #fff;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* 侧边栏 */
.sidebar {
  width: 340px;
  background: rgba(30, 30, 30, 0.9);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  color: #ddd;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  white-space: nowrap;
}

.sidebar.sidebar-closed {
  width: 0;
  opacity: 0;
  border-left: none;
}

.map-section-wrapper {
  height: 200px;
  flex-shrink: 0;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.map-view {
  width: 100%;
  height: 100%;
  background: #222;
}

.map-overlay {
  position: absolute;
  inset: 0;
  z-index: 400;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 25px;
  /* 平滑滚动 */
  scroll-behavior: smooth;
}

.info-block {
  margin-bottom: 30px;
}

.block-title {
  font-size: 11px;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  font-weight: 700;
}

.info-list .row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.info-list dt { color: #999; }
.info-list dd {
  color: #fff;
  font-weight: 500;
  text-align: right;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-tag-box {
  background: rgba(255, 255, 255, 0.08);
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.param-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  transition: background 0.2s;
}

.param-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.p-label {
  display: block;
  font-size: 10px;
  color: #777;
  margin-bottom: 4px;
}

.p-val {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.mobile-handle {
  display: none;
}

/* 移动端适配 */
@media (max-width: 900px) {
  .main-layout {
    flex-direction: column;
  }

  .preview-area {
    flex: 1;
    padding-bottom: 60px; /* 留出底部空间 */
  }

  .desktop-only {
    display: none;
  }

  /* 移动端改为底部抽屉模式 */
  .sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 60vh; /* 展开高度 */
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px 20px 0 0;
    z-index: 100;
    transform: translateY(0);
    opacity: 1;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
  }

  .sidebar.sidebar-closed {
    width: 100%;
    height: 60vh;
    transform: translateY(100%);
    opacity: 1; /* 保持不透明，只是移出屏幕 */
  }

  .mobile-handle {
    display: block;
    width: 40px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    margin: 10px auto;
    cursor: pointer;
  }
}
</style>
