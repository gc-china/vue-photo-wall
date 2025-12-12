<script setup>
import {computed, onMounted, onUnmounted, ref, watch, nextTick} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {store} from '@/store.js';
import dayjs from 'dayjs';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import panzoom from 'panzoom';

const route = useRoute();
const router = useRouter();

// 简单的 CDN 处理 (可选)
const getOptimizedUrl = (url) => url;

const photosData = computed(() => store.photos || []);
const photo = computed(() => photosData.value.find(p => p.id === route.params.id));
const currentIndex = computed(() => photosData.value.findIndex(p => p.id === route.params.id));
const prevPhoto = computed(() => currentIndex.value > 0 ? photosData.value[currentIndex.value - 1] : null);
const nextPhoto = computed(() => currentIndex.value < photosData.value.length - 1 ? photosData.value[currentIndex.value + 1] : null);

// --- Live Photo ---
const isPlaying = ref(false);
const videoRef = ref(null);
const togglePlay = () => {
  if (!videoRef.value) return;
  if (videoRef.value.paused) {
    videoRef.value.play();
    isPlaying.value = true;
  } else {
    videoRef.value.pause();
    isPlaying.value = false;
  }
};

// --- 侧边栏与地图 ---
const isInfoOpen = ref(true);
const mapContainer = ref(null);
let mapInstance = null;

// 初始化地图
const initMap = () => {
  // 1. 清理旧地图
  if (mapInstance) {
    mapInstance.off();
    mapInstance.remove();
    mapInstance = null;
  }
  // 2. 检查条件: 必须有 gps 数据，且容器存在
  if (!photo.value?.exif?.gps || !mapContainer.value) return;

  const {lat, lng} = photo.value.exif.gps;

  // 3. 创建地图
  mapInstance = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
    dragging: false,
    doubleClickZoom: false
  }).setView([lat, lng], 13); // 缩放级别 13

  // 4. 加载图层 (CartoDB Voyager 主题，很漂亮)
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
  // 侧边栏展开动画结束后，必须刷新地图尺寸，否则地图会灰屏
  if (isInfoOpen.value) {
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize();
      else initMap(); // 如果之前没初始化成功，重试
    }, 400);
  }
};

// --- 切换照片 ---
const switchPhoto = (targetId) => {
  if (targetId && targetId !== route.params.id) {
    router.replace(`/photo/${targetId}`).catch(() => {
    });
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
  // 初始加载地图
  nextTick(() => {
    if (isInfoOpen.value) initMap();
  });
});

onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

// --- 缩放 (Panzoom) ---
const mainImgRef = ref(null);
let panzoomInstance = null;
const initPanzoom = () => {
  if (panzoomInstance) {
    panzoomInstance.dispose();
    panzoomInstance = null;
  }
  if (mainImgRef.value && photo.value?.type !== 'video') {
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
    // 切换照片后，重新初始化所有组件
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
    <div class="blur-bg" :style="{ backgroundImage: `url(${photo.url})` }"></div>
    <div class="blur-overlay"></div>

    <div class="main-layout">
      <div class="preview-area" @touchstart.passive="handleTouchStart" @touchend.passive="handleTouchEnd">
        <div class="toolbar">
          <button class="icon-btn info-toggle" :class="{ 'active': isInfoOpen }" @click="toggleInfo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
          <button class="icon-btn close-btn" @click="close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="image-wrapper">
          <button class="nav-arrow left desktop-only" v-if="prevPhoto" @click.stop="switchPhoto(prevPhoto.id)">‹
          </button>

          <div class="panzoom-container video-container" v-if="photo.type === 'video'" @click.stop="togglePlay">
            <video ref="videoRef" :src="photo.url" :poster="photo.thumb" loop muted playsinline
                   class="main-video"></video>
            <div class="live-badge" :class="{ 'active': isPlaying }">
              <div class="live-icon"><span></span></div>
              LIVE
            </div>
          </div>

          <div class="panzoom-container" v-else>
            <img ref="mainImgRef" :src="photo.url" :alt="photo.name" class="main-img"/>
          </div>

          <button class="nav-arrow right desktop-only" v-if="nextPhoto" @click.stop="switchPhoto(nextPhoto.id)">›
          </button>
        </div>

        <div class="filmstrip-container">
          <div class="filmstrip" ref="filmstripRef">
            <div v-for="p in photosData" :key="p.id" class="thumb-item" :class="{ active: p.id === photo.id }"
                 :ref="(el) => { if (el) thumbnailRefs[p.id] = el }" @click.stop="switchPhoto(p.id)">
              <img :src="p.url" loading="lazy" :class="{ 'visible': thumbLoaded.has(p.id) }" @load="onThumbLoad(p.id)"/>
            </div>
          </div>
        </div>
      </div>

      <aside class="sidebar" :class="{ 'sidebar-closed': !isInfoOpen }">
        <div class="mobile-handle"></div>

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
              <div class="param-item"><span class="p-label">焦距</span><span class="p-val">{{ photo.exif.focal }}</span>
              </div>
              <div class="param-item"><span class="p-label">光圈</span><span class="p-val">{{ photo.exif.fstop }}</span>
              </div>
              <div class="param-item"><span class="p-label">快门</span><span class="p-val">{{
                  photo.exif.shutter
                }}</span></div>
              <div class="param-item"><span class="p-label">ISO</span><span class="p-val">{{ photo.exif.iso }}</span>
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
/* 保持你的基础布局 */
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
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(5px);
  transition: 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
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
  font-size: 30px;
  cursor: pointer;
  z-index: 20;
  backdrop-filter: blur(2px);
}

.nav-arrow.left {
  left: 20px;
}

.nav-arrow.right {
  right: 20px;
}

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
  border-radius: 4px;
  overflow: hidden;
  opacity: 0.4;
  transition: 0.2s;
  border: 2px solid transparent;
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s;
}

.thumb-item img.visible {
  opacity: 1;
}

.thumb-item.active {
  opacity: 1;
  border-color: #fff;
  transform: scale(1.1);
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
  transition: width 0.4s ease, opacity 0.3s ease;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar.sidebar-closed {
  width: 0;
  opacity: 0;
  border-left: none;
}

/* 🌟 地图区域关键样式 */
.map-section-wrapper {
  height: 200px; /* 强制高度，确保地图有空间显示 */
  flex-shrink: 0;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.map-view {
  width: 100%;
  height: 100%;
  background: #222; /* 没加载出来时显示深色底 */
}

.map-overlay {
  position: absolute;
  inset: 0;
  z-index: 400; /* 防止拖动地图影响页面体验 */
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 25px;
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
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.info-list dt {
  color: #999;
}

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

@media (max-width: 900px) {
  .main-layout {
    flex-direction: column;
  }

  .preview-area {
    flex: 2;
  }

  .desktop-only {
    display: none;
  }

  .sidebar {
    width: 100%;
    flex: 1;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px 20px 0 0;
  }

  .sidebar.sidebar-closed {
    flex: 0;
    height: 0;
  }

  .mobile-handle {
    display: block;
    width: 40px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    margin: 10px auto 0;
  }
}
</style>