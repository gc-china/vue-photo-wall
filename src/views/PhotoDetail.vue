<template>
  <div class="photo-detail">
    <div class="container">
      <!-- 返回按钮 -->
      <div class="back-button">
        <button class="btn btn-ghost" @click="goBack">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <span>返回</span>
        </button>
      </div>

      <!-- 主要内容 -->
      <div class="detail-content" v-if="photo">
        <!-- 图片区域 -->
        <div class="image-section">
          <div class="image-container">
            <!-- Live Photo 视频 -->
            <div v-if="photo.isLivePhoto && isPlayingLive" class="live-video-container">
              <video
                ref="liveVideoPlayer"
                :src="photo.liveVideoUrl"
                autoplay
                muted
                playsinline
                controls
                class="live-video"
              ></video>
              <button class="live-close" @click="stopLivePhoto" aria-label="关闭 Live Photo">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <!-- 静态图片 -->
            <div v-else class="static-image-container">
              <!-- 低质量占位图（模糊缩略图） -->
              <img
                v-if="isLoadingImage && (photo.thumbnailWebp || photo.thumbnail)"
                :src="photo.thumbnailWebp || photo.thumbnail"
                class="main-image-placeholder"
                alt=""
              />
              <img
                :src="mainImageSrc"
                :alt="photo.title"
                class="main-image"
                :class="{ loaded: !isLoadingImage }"
                loading="eager"
                @load="onImageLoad"
                @error="onImageError"
                @click="!isLoadingImage && toggleZoom()"
              />

              <!-- Live Photo 播放按钮 -->
              <button
                v-if="photo.isLivePhoto && !isPlayingLive"
                class="live-play-button"
                @click="playLivePhoto"
              >
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>播放 Live Photo</span>
              </button>

              <!-- 加载状态 -->
              <div v-if="isLoadingImage" class="image-loading">
                <div class="spinner"></div>
                <p>正在载入清晰预览...</p>
              </div>

              <!-- 错误状态 -->
              <div v-if="imageError" class="image-error">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
                </svg>
                <p>清晰预览加载失败</p>
                <button class="btn btn-ghost btn-sm" @click="retryMainImage">重试加载</button>
              </div>
            </div>

            <!-- 图片导航 -->
            <div class="image-navigation" v-if="hasNavigation">
              <button v-if="hasPrevious" class="nav-btn nav-prev" @click="navigateToPrevious" aria-label="上一张照片">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              <button v-if="hasNext" class="nav-btn nav-next" @click="navigateToNext" aria-label="下一张照片">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 键盘操作提示 -->
          <div class="keyboard-hint" v-if="hasNavigation && !isZoomed && !isPlayingLive">
            <kbd>←</kbd>
            <kbd>→</kbd>
            <span>键盘切换照片</span>
            <span class="hint-divider">·</span>
            <kbd>ESC</kbd>
            <span>返回</span>
          </div>
        </div>

        <!-- 信息区域 -->
        <div class="info-section">
          <!-- 基本信息 -->
          <div class="info-card basic-info">
            <h2 class="photo-title">{{ photo.title }}</h2>
            <p class="photo-description" v-if="photo.description">{{ photo.description }}</p>

            <div class="photo-tags" v-if="photo.tags && photo.tags.length">
              <span v-for="tag in photo.tags" :key="tag" class="tag">#{{ tag }}</span>
            </div>

            <div class="basic-meta">
              <div class="meta-row">
                <span class="meta-label">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" />
                  </svg>
                  拍摄时间
                </span>
                <span class="meta-value">{{ formatFullDate(photo.date) }}</span>
              </div>

              <div class="meta-row">
                <span class="meta-label">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                  </svg>
                  分类
                </span>
                <span class="meta-value">{{ photo.category }}</span>
              </div>

              <div class="meta-row" v-if="photo.metadata && photo.metadata.location">
                <span class="meta-label">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                  </svg>
                  位置
                </span>
                <span class="meta-value">{{ photo.metadata.location || '未知位置' }}</span>
              </div>
            </div>
          </div>

          <!-- 相机信息 -->
          <div class="info-card camera-info" v-if="photo.metadata && hasCameraInfo">
            <h3 class="card-title">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 2L7.5 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.5L15 2H9zm3 4a6 6 0 110 12 6 6 0 010-12z" />
              </svg>
              相机信息
            </h3>

            <div class="camera-grid">
              <!-- 相机型号 -->
              <div class="camera-item" v-if="photo.metadata.camera">
                <svg class="item-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 2L7.5 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.5L15 2H9zm3 4a6 6 0 110 12 6 6 0 010-12z" />
                </svg>
                <span class="item-label">相机型号</span>
                <span class="item-value">{{ photo.metadata.camera }}</span>
              </div>

              <!-- 镜头 -->
              <div class="camera-item" v-if="photo.metadata.lens">
                <svg class="item-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
                  <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
                <span class="item-label">镜头</span>
                <span class="item-value">{{ photo.metadata.lens }}</span>
              </div>

              <!-- 焦段 -->
              <div class="camera-item" v-if="photo.metadata.focalLength">
                <svg class="item-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 5L20.49 19l-5-5zm-6 0A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z" />
                  <line x1="3" y1="21" x2="8" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <line x1="4" y1="18" x2="6" y2="20" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                </svg>
                <span class="item-label">焦段</span>
                <span class="item-value">{{ photo.metadata.focalLength }}</span>
              </div>

              <!-- 光圈 -->
              <div class="camera-item" v-if="photo.metadata.aperture">
                <svg class="item-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="12,2 19,6.5 19,17.5 12,22 5,17.5 5,6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                  <polygon points="12,7 16,9.5 16,14.5 12,17 8,14.5 8,9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                  <line x1="12" y1="2" x2="12" y2="7" stroke="currentColor" stroke-width="1.5" />
                  <line x1="19" y1="6.5" x2="16" y2="9.5" stroke="currentColor" stroke-width="1.5" />
                  <line x1="19" y1="17.5" x2="16" y2="14.5" stroke="currentColor" stroke-width="1.5" />
                  <line x1="12" y1="22" x2="12" y2="17" stroke="currentColor" stroke-width="1.5" />
                  <line x1="5" y1="17.5" x2="8" y2="14.5" stroke="currentColor" stroke-width="1.5" />
                  <line x1="5" y1="6.5" x2="8" y2="9.5" stroke="currentColor" stroke-width="1.5" />
                </svg>
                <span class="item-label">光圈</span>
                <span class="item-value">{{ photo.metadata.aperture }}</span>
              </div>

              <!-- 快门速度 -->
              <div class="camera-item" v-if="photo.metadata.shutterSpeed">
                <svg class="item-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2" />
                  <line x1="12" y1="13" x2="12" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="12" y1="13" x2="16" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="9" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="12" y1="3" x2="12" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span class="item-label">快门速度</span>
                <span class="item-value">{{ photo.metadata.shutterSpeed }}</span>
              </div>

              <!-- ISO -->
              <div class="camera-item" v-if="photo.metadata.iso">
                <svg class="item-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
                  <rect x="6" y="9" width="3" height="6" fill="currentColor" opacity="0.6" />
                  <rect x="10.5" y="9" width="3" height="6" fill="currentColor" opacity="0.6" />
                  <rect x="15" y="9" width="3" height="6" fill="currentColor" opacity="0.6" />
                </svg>
                <span class="item-label">ISO</span>
                <span class="item-value">{{ photo.metadata.iso }}</span>
              </div>

              <!-- 图片尺寸 -->
              <div class="camera-item" v-if="photo.metadata.width && photo.metadata.height">
                <svg class="item-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="1" fill="none" stroke="currentColor" stroke-width="2" />
                  <line x1="3" y1="9" x2="6" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <line x1="3" y1="15" x2="6" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <line x1="18" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <line x1="18" y1="15" x2="21" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <line x1="9" y1="3" x2="9" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <line x1="15" y1="3" x2="15" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <line x1="9" y1="18" x2="9" y2="21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <line x1="15" y1="18" x2="15" y2="21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
                <span class="item-label">图片尺寸</span>
                <span class="item-value">{{ photo.metadata.width }} × {{ photo.metadata.height }}</span>
              </div>

              <!-- 文件大小 -->
              <div class="camera-item" v-if="photo.metadata.size">
                <svg class="item-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" fill="currentColor" />
                  <path d="M8 14h8v2H8zM8 11h8v2H8z" fill="currentColor" opacity="0.5" />
                </svg>
                <span class="item-label">文件大小</span>
                <span class="item-value">{{ photo.metadata.size }}</span>
              </div>
            </div>
          </div>

          <!-- 位置信息 -->
          <div class="info-card location-info" v-if="photo.metadata && photo.metadata.coordinates && hasCoordinates">
            <h3 class="card-title">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
              位置信息
            </h3>

            <div class="location-content">
              <div class="coordinates">
                <span class="coord-label">坐标</span>
                <span class="coord-value">
                  {{ photo.metadata.coordinates.lat.toFixed(6) }},
                  {{ photo.metadata.coordinates.lng.toFixed(6) }}
                </span>
              </div>

              <div class="map-container" v-if="showMap">
                <div class="map-placeholder">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                  </svg>
                  <p>地图加载中...</p>
                  <small>实际项目中将集成地图 API</small>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="info-card actions-card">
            <h3 class="card-title">操作</h3>

            <div class="action-buttons">
              <button class="btn btn-primary" @click="downloadPhoto">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                <span>下载原图</span>
              </button>

              <button class="btn btn-secondary" @click="sharePhoto" v-if="canShare">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                </svg>
                <span>分享</span>
              </button>

              <button class="btn btn-ghost" @click="toggleFavorite">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" v-if="isFavorite">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" v-else>
                  <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
                </svg>
                <span>{{ isFavorite ? '取消收藏' : '收藏' }}</span>
              </button>

              <button class="btn btn-ghost" @click="showInfo = !showInfo">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <span>{{ showInfo ? '隐藏信息' : '显示信息' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <svg class="icon empty-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
          </svg>
          <h3>照片不存在</h3>
          <p>抱歉，找不到您要查看的照片</p>
          <button class="btn btn-primary" @click="goBack">返回相册</button>
        </div>
      </div>
    </div>

    <!-- 图片放大查看器 -->
    <div v-if="isZoomed" class="image-viewer" @click="toggleZoom">
      <div class="viewer-content">
        <img
          :src="originalImageSrc"
          :alt="photo.title"
          class="zoomed-image"
          :class="{ loaded: !isLoadingOriginal }"
          @load="onOriginalLoad"
          @error="onOriginalError"
        />
        <div v-if="isLoadingOriginal" class="viewer-status">
          <div class="spinner"></div>
          <span>正在按需加载原图…</span>
        </div>
        <div v-else-if="originalError" class="viewer-status error">
          <span>原图加载失败</span>
          <button class="btn btn-ghost btn-sm" @click.stop="retryOriginal">重试</button>
        </div>
        <button class="viewer-close" @click.stop="toggleZoom" aria-label="关闭原图查看">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePhotoStore } from '../stores/photoStore'
import {
  getMediumSource,
  getOriginalSource,
  resolvePhotoAsset
} from '../utils/photoAssets'

export default {
  name: 'PhotoDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const photoStore = usePhotoStore()

    // ── 响应式数据 ──
    const isLoadingImage = ref(true)
    const imageError = ref(false)
    const previewSourceIndex = ref(0)
    const previewRetryVersion = ref(0)
    const isLoadingOriginal = ref(false)
    const originalError = ref(false)
    const originalRetryVersion = ref(0)
    const isPlayingLive = ref(false)
    const isZoomed = ref(false)
    const showMap = ref(false)
    const showInfo = ref(true)
    const isFavorite = ref(false)
    const canShare = ref(typeof navigator !== 'undefined' && !!navigator.share)
    let idlePreloadId = null
    let mapTimer = null

    // ── 计算属性 ──
    const photoId = computed(() => route.params.id)
    const photo = computed(() => photoStore.getPhotoById(photoId.value))
    const previewSources = computed(() => {
      const current = photo.value
      if (!current) return []
      return [
        current.mediumWebp,
        current.medium,
        current.thumbnailWebp,
        current.thumbnail,
        current.image
      ].filter((source, index, all) => source && all.indexOf(source) === index)
    })
    const mainImageSrc = computed(() => {
      const source = resolvePhotoAsset(previewSources.value[previewSourceIndex.value])
      if (!source || previewRetryVersion.value === 0) return source
      return `${source}${source.includes('?') ? '&' : '?'}retry=${previewRetryVersion.value}`
    })
    const originalImageSrc = computed(() => {
      const source = getOriginalSource(photo.value)
      if (!source || originalRetryVersion.value === 0) return source
      return `${source}${source.includes('?') ? '&' : '?'}retry=${originalRetryVersion.value}`
    })

    const hasCameraInfo = computed(() => {
      const m = photo.value?.metadata
      if (!m) return false
      return !!(m.camera || m.lens || m.focalLength || m.aperture || m.shutterSpeed || m.iso)
    })

    const hasCoordinates = computed(() => {
      const c = photo.value?.metadata?.coordinates
      return c && (c.lat !== 0 || c.lng !== 0)
    })

    const currentIndex = computed(() =>
      photoStore.filteredPhotos.findIndex(p => p.id === photoId.value)
    )

    const hasPrevious = computed(() => currentIndex.value > 0)

    const hasNext = computed(() =>
      currentIndex.value >= 0 && currentIndex.value < photoStore.filteredPhotos.length - 1
    )

    const hasNavigation = computed(() => hasPrevious.value || hasNext.value)

    // ── 方法 ──
    const goBack = () => {
      router.push('/')
    }

    const onImageLoad = () => {
      isLoadingImage.value = false
      imageError.value = false
    }

    const onImageError = () => {
      if (previewSourceIndex.value < previewSources.value.length - 1) {
        previewSourceIndex.value++
        return
      }
      isLoadingImage.value = false
      imageError.value = true
    }

    const retryMainImage = () => {
      previewSourceIndex.value = 0
      previewRetryVersion.value++
      isLoadingImage.value = true
      imageError.value = false
    }

    const onOriginalLoad = () => {
      isLoadingOriginal.value = false
      originalError.value = false
    }

    const onOriginalError = () => {
      isLoadingOriginal.value = false
      originalError.value = true
    }

    const retryOriginal = () => {
      originalRetryVersion.value++
      isLoadingOriginal.value = true
      originalError.value = false
    }

    const playLivePhoto = () => {
      if (photo.value?.isLivePhoto) {
        isPlayingLive.value = true
        document.body.style.overflow = 'hidden'
      }
    }

    const stopLivePhoto = () => {
      isPlayingLive.value = false
      document.body.style.overflow = ''
    }

    const toggleZoom = () => {
      isZoomed.value = !isZoomed.value
      if (isZoomed.value) {
        isLoadingOriginal.value = true
        originalError.value = false
      }
      document.body.style.overflow = isZoomed.value ? 'hidden' : ''
    }

    const navigateToPrevious = () => {
      if (currentIndex.value > 0) {
        const prevPhoto = photoStore.filteredPhotos[currentIndex.value - 1]
        isLoadingImage.value = true
        router.replace({ name: 'PhotoDetail', params: { id: prevPhoto.id } })
      }
    }

    const navigateToNext = () => {
      if (currentIndex.value < photoStore.filteredPhotos.length - 1) {
        const nextPhoto = photoStore.filteredPhotos[currentIndex.value + 1]
        isLoadingImage.value = true
        router.replace({ name: 'PhotoDetail', params: { id: nextPhoto.id } })
      }
    }

    const downloadPhoto = () => {
      if (photo.value?.image) {
        const link = document.createElement('a')
        link.href = getOriginalSource(photo.value)
        link.download = `${photo.value.title || 'photo'}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }

    const sharePhoto = async () => {
      if (canShare.value && photo.value) {
        try {
          await navigator.share({
            title: photo.value.title,
            text: photo.value.description || '',
            url: window.location.href
          })
        } catch (error) {
          if (error?.name !== 'AbortError') console.warn('分享失败:', error)
        }
      }
    }

    const toggleFavorite = () => {
      isFavorite.value = !isFavorite.value
    }

    const formatFullDate = (dateString) => {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 键盘导航
    const handleKeyDown = (event) => {
      if (isZoomed.value || isPlayingLive.value) {
        if (event.key === 'Escape') {
          if (isZoomed.value) toggleZoom()
          if (isPlayingLive.value) stopLivePhoto()
        }
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (hasPrevious.value) navigateToPrevious()
          break
        case 'ArrowRight':
          if (hasNext.value) navigateToNext()
          break
        case 'Escape':
          goBack()
          break
      }
    }

    const preloadAdjacentPreviews = () => {
      if (idlePreloadId !== null) {
        if ('cancelIdleCallback' in window) window.cancelIdleCallback(idlePreloadId)
        else window.clearTimeout(idlePreloadId)
      }
      const adjacent = [
        photoStore.filteredPhotos[currentIndex.value - 1],
        photoStore.filteredPhotos[currentIndex.value + 1]
      ].filter(Boolean)

      const preload = () => {
        adjacent.forEach((item) => {
          const image = new Image()
          image.decoding = 'async'
          image.src = getMediumSource(item)
        })
      }

      if ('requestIdleCallback' in window) {
        idlePreloadId = window.requestIdleCallback(preload, { timeout: 1200 })
      } else {
        idlePreloadId = window.setTimeout(preload, 300)
      }
    }

    watch(photoId, () => {
      previewSourceIndex.value = 0
      previewRetryVersion.value = 0
      isLoadingImage.value = true
      imageError.value = false
      showMap.value = false
      window.clearTimeout(mapTimer)
      if (hasCoordinates.value) {
        mapTimer = window.setTimeout(() => {
          showMap.value = true
        }, 400)
      }
      preloadAdjacentPreviews()
    }, { immediate: true })

    // ── 生命周期 ──
    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown)

    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      window.clearTimeout(mapTimer)
      if (idlePreloadId !== null) {
        if ('cancelIdleCallback' in window) window.cancelIdleCallback(idlePreloadId)
        else window.clearTimeout(idlePreloadId)
      }
    })

    return {
      isLoadingImage,
      imageError,
      isPlayingLive,
      isZoomed,
      showMap,
      showInfo,
      isFavorite,
      canShare,
      photo,
      photoId,
      mainImageSrc,
      originalImageSrc,
      isLoadingOriginal,
      originalError,
      hasCameraInfo,
      hasCoordinates,
      hasNavigation,
      hasPrevious,
      hasNext,
      goBack,
      onImageLoad,
      onImageError,
      retryMainImage,
      onOriginalLoad,
      onOriginalError,
      retryOriginal,
      playLivePhoto,
      stopLivePhoto,
      toggleZoom,
      navigateToPrevious,
      navigateToNext,
      downloadPhoto,
      sharePhoto,
      toggleFavorite,
      formatFullDate
    }
  }
}
</script>

<style lang="scss" scoped>
.photo-detail {
  min-height: 100vh;
  padding: var(--spacing-lg) 0 var(--spacing-xxl);
}

.back-button {
  margin-bottom: var(--spacing-lg);

  .btn {
    border-radius: var(--radius-full);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.6);
    padding: 8px 20px;

    .icon {
      width: 18px;
      height: 18px;
    }
  }

  [data-theme='dark'] & .btn {
    background: rgba(26, 35, 40, 0.6);
  }
}

.detail-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--spacing-xl);

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}

.image-section {
  .image-container {
    position: relative;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-light);

    .static-image-container {
      position: relative;
      width: 100%;
      min-height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;

      @media (max-width: 768px) {
        min-height: 350px;
      }

      .main-image {
        position: relative;
        z-index: 2;
        max-width: 100%;
        max-height: 75vh;
        object-fit: contain;
        cursor: zoom-in;
        background: var(--bg-tertiary);
        opacity: 0;
        transition: opacity 0.4s var(--ease-out);

        &.loaded {
          opacity: 1;
        }
      }

      .main-image-placeholder {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: blur(20px);
        transform: scale(1.05);
        opacity: 0.6;
        z-index: 1;
      }

      .live-play-button {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 59, 48, 0.9);
        color: white;
        border: none;
        padding: 14px 24px;
        border-radius: var(--radius-md);
        font-size: 1rem;
        cursor: pointer;
        backdrop-filter: blur(10px);
        transition: all var(--transition-normal);

        .icon {
          width: 20px;
          height: 20px;
        }

        &:hover {
          background: rgba(255, 59, 48, 1);
          transform: translate(-50%, -50%) scale(1.05);
        }
      }

      .image-loading,
      .image-error {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: var(--spacing-sm);
        background: var(--bg-tertiary);

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid var(--border-light);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        p {
          color: var(--text-muted);
        }

        .icon {
          width: 3rem;
          height: 3rem;
          opacity: 0.4;
        }
      }
    }

    .live-video-container {
      position: relative;
      width: 100%;
      min-height: 500px;

      @media (max-width: 768px) {
        min-height: 350px;
      }

      .live-video {
        width: 100%;
        height: 100%;
        max-height: 75vh;
        object-fit: contain;
        background: var(--bg-tertiary);
      }

      .live-close {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        cursor: pointer;
        backdrop-filter: blur(10px);
        transition: background var(--transition-fast);

        .icon {
          width: 20px;
          height: 20px;
        }

        &:hover {
          background: rgba(0, 0, 0, 0.85);
        }
      }
    }

    .image-navigation {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      transform: translateY(-50%);
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      pointer-events: none;

      .nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.45);
        color: white;
        border: none;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        cursor: pointer;
        backdrop-filter: blur(10px);
        transition: all var(--transition-normal);
        pointer-events: all;

        .icon {
          width: 24px;
          height: 24px;
        }

        &:hover {
          background: rgba(0, 0, 0, 0.75);
          transform: scale(1.1);
        }
      }
    }
  }

  .keyboard-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: var(--spacing-sm) 0;
    color: var(--text-muted);
    font-size: 0.78rem;

    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 6px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-bottom-width: 2px;
      border-radius: var(--radius-sm);
      font-family: var(--font-family-mono);
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1;
    }

    .hint-divider {
      margin: 0 4px;
      opacity: 0.5;
    }

    @media (max-width: 768px) {
      display: none;
    }
  }
}

.info-section {
  .info-card {
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-light);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    box-shadow: var(--shadow-sm);

    .card-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 1.2rem;
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-sm);
      border-bottom: 1px solid var(--border-color);

      .icon {
        width: 20px;
        height: 20px;
        color: var(--primary-color);
      }
    }
  }

  .basic-info {
    position: relative;
    padding-left: calc(var(--spacing-lg) + 6px);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: var(--spacing-lg);
      bottom: var(--spacing-lg);
      width: 3px;
      background: var(--primary-gradient);
      border-radius: 2px;
    }

    .photo-title {
      font-size: 1.6rem;
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
      line-height: 1.3;
    }

    .photo-description {
      font-size: 1rem;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: var(--spacing-md);
    }

    .photo-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-lg);

      .tag {
        background: rgba(61, 122, 140, 0.06);
        color: var(--primary-color);
        padding: 4px 12px;
        border-radius: var(--radius-full);
        font-size: 0.85rem;
        font-weight: var(--font-weight-medium);
        transition: background var(--transition-fast);

        &:hover {
          background: rgba(61, 122, 140, 0.12);
        }
      }
    }

    .basic-meta {
      .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) 0;
        border-bottom: 1px solid var(--border-light);

        &:last-child {
          border-bottom: none;
        }

        .meta-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--text-muted);
          font-size: 0.9rem;

          .icon {
            width: 16px;
            height: 16px;
          }
        }

        .meta-value {
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
          text-align: right;
          flex: 1;
          margin-left: var(--spacing-md);
        }
      }
    }
  }

  .camera-info {
    .camera-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }

      .camera-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-xs);
        background: var(--bg-tertiary);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        padding: var(--spacing-md);
        text-align: center;
        transition: background var(--transition-spring), transform var(--transition-spring), box-shadow var(--transition-spring);

        &:hover {
          background: var(--bg-secondary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .item-icon {
          width: 24px;
          height: 24px;
          color: var(--primary-color);
          flex-shrink: 0;
        }

        .item-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .item-value {
          font-size: 0.95rem;
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
          font-family: var(--font-family-mono);
          word-break: break-word;
        }
      }
    }
  }

  .location-info {
    .location-content {
      .coordinates {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);

        .coord-label {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .coord-value {
          font-family: var(--font-family-mono);
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
        }
      }

      .map-container {
        height: 200px;
        border-radius: var(--radius-md);
        overflow: hidden;
        border: 1px solid var(--border-color);

        .map-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          background: var(--bg-tertiary);
          color: var(--text-muted);

          .icon {
            width: 2rem;
            height: 2rem;
            margin-bottom: var(--spacing-sm);
          }

          p {
            font-size: 1rem;
            margin-bottom: 4px;
          }

          small {
            font-size: 0.8rem;
            opacity: 0.7;
          }
        }
      }
    }
  }

  .actions-card {
    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }

      .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xs);
        padding: 12px 16px;
        font-size: 0.9rem;

        .icon {
          width: 18px;
          height: 18px;
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxxl);

  .empty-content {
    text-align: center;

    .empty-icon {
      width: 4rem;
      height: 4rem;
      margin-bottom: var(--spacing-md);
      opacity: 0.3;
      color: var(--text-muted);
    }

    h3 {
      font-size: 1.5rem;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    }

    p {
      color: var(--text-muted);
      margin-bottom: var(--spacing-lg);
    }
  }
}

.image-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.92);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;

  .viewer-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: min(560px, 90vw);
    min-height: min(420px, 80vh);
    max-width: 90vw;
    max-height: 90vh;

    .zoomed-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      cursor: zoom-out;
      opacity: 0;
      transition: opacity var(--transition-normal);

      &.loaded {
        opacity: 1;
      }
    }

    .viewer-status {
      position: absolute;
      inset: 0;
      min-width: min(560px, 80vw);
      min-height: min(420px, 70vh);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      color: rgba(255, 255, 255, 0.8);
      pointer-events: none;

      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid rgba(255, 255, 255, 0.22);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      &.error {
        pointer-events: auto;
      }
    }

    .viewer-close {
      position: absolute;
      top: -50px;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: white;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: background var(--transition-fast);

      .icon {
        width: 20px;
        height: 20px;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 响应式
@media (max-width: 768px) {
  .photo-detail {
    padding: var(--spacing-md) 0;
  }

  .back-button {
    margin-bottom: var(--spacing-md);
  }

  .image-section {
    .image-container {
      .image-navigation {
        .nav-btn {
          width: 40px;
          height: 40px;

          .icon {
            width: 20px;
            height: 20px;
          }
        }
      }
    }
  }

  .info-section {
    .info-card {
      padding: var(--spacing-md);
    }
  }
}
</style>
