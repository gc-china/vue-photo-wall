<template>
  <div
    ref="cardRef"
    class="photo-card"
    role="button"
    tabindex="0"
    :class="{
      'live-photo': photo.isLivePhoto,
      'loaded': isLoaded,
      'error': hasError,
      'size-small': size === 'small'
    }"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
  >
    <!-- Live Photo 标识 -->
    <div v-if="photo.isLivePhoto" class="live-photo-badge">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
      </svg>
      <span>LIVE</span>
    </div>

    <!-- 分类标签 -->
    <div class="category-badge">{{ photo.category }}</div>

    <!-- 图片容器 -->
    <div class="image-container" :style="containerStyle">
      <img
        v-if="isVisible"
        ref="imgRef"
        :src="imgSrc"
        :srcset="imgSrcset"
        :sizes="imgSizes"
        :alt="photo.title"
        class="photo-image"
        loading="lazy"
        decoding="async"
        :fetchpriority="index < 6 ? 'high' : 'auto'"
        @load="onImageLoad"
        @error="onImageError"
      />

      <!-- 骨架屏占位 -->
      <div v-if="!isLoaded && !hasError" class="image-skeleton skeleton"></div>

      <!-- 错误状态 -->
      <div v-if="hasError" class="image-error">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
        </svg>
        <span>加载失败</span>
        <button type="button" class="image-retry" @click.stop="retryImage">重试</button>
      </div>
    </div>

    <!-- 照片信息 -->
    <div class="photo-info">
      <h3 class="photo-title">{{ photo.title }}</h3>
      <p class="photo-description" v-if="truncatedDescription">{{ truncatedDescription }}</p>

      <!-- 标签 -->
      <div class="photo-tags" v-if="photo.tags && photo.tags.length">
        <span
          v-for="tag in displayedTags"
          :key="tag"
          class="photo-tag"
        >#{{ tag }}</span>
        <span v-if="hasMoreTags" class="tag-more">+{{ photo.tags.length - 3 }}</span>
      </div>

      <!-- 照片元数据 -->
      <div class="photo-meta" v-if="size !== 'small'">
        <div class="meta-item">
          <svg class="icon meta-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" />
            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <span>{{ formatDate(photo.date) }}</span>
        </div>

        <div class="meta-item" v-if="photo.metadata && photo.metadata.camera">
          <svg class="icon meta-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 2L7.5 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.5L15 2H9zm3 4a6 6 0 110 12 6 6 0 010-12z" />
          </svg>
          <span>{{ photo.metadata.camera }}</span>
        </div>

        <div class="meta-item" v-if="photo.metadata && photo.metadata.location">
          <svg class="icon meta-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
          </svg>
          <span>{{ photo.metadata.location }}</span>
        </div>
      </div>
    </div>

    <!-- 悬停信息层（轻微淡入，不全黑遮罩） -->
    <div class="photo-overlay">
      <div class="overlay-info">
        <svg class="icon overlay-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z" />
        </svg>
        <span>查看详情</span>
      </div>

      <button
        v-if="photo.isLivePhoto && photo.liveVideoUrl"
        class="btn-live-play"
        @click.stop="playLivePhoto"
        title="播放 Live Photo"
      >
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </div>

    <!-- Live Photo 播放容器 -->
    <div v-if="isPlayingLive" class="live-player" @click.stop="stopLivePhoto">
      <video
        ref="liveVideo"
        :src="photo.liveVideoUrl"
        autoplay
        muted
        playsinline
        @ended="stopLivePhoto"
      ></video>
      <button class="live-close" @click.stop="stopLivePhoto" aria-label="关闭 Live Photo">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  getResponsiveSourceSet,
  resolvePhotoAsset
} from '../utils/photoAssets'
import { observeLazyElement } from '../utils/lazyObserver'

export default {
  name: 'PhotoCard',
  props: {
    photo: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      default: 0
    },
    size: {
      type: String,
      default: 'normal',
      validator: (val) => ['normal', 'small'].includes(val)
    }
  },
  emits: ['click', 'load'],
  setup(props, { emit }) {
    // ── 响应式引用 ──
    const cardRef = ref(null)
    const imgRef = ref(null)
    const isLoaded = ref(false)
    const hasError = ref(false)
    const isPlayingLive = ref(false)
    const isVisible = ref(false)
    const sourceIndex = ref(0)
    const retryVersion = ref(0)

    let stopObserving = () => {}

    // ── 计算属性 ──

    const imageCandidates = computed(() => {
      return [
        props.photo.thumbnailWebp,
        props.photo.thumbnail,
        props.photo.mediumWebp,
        props.photo.medium,
        props.photo.image
      ].filter((source, index, all) => source && all.indexOf(source) === index)
    })

    /** 图片 src：进入视口后加载，并在格式缺失时逐级降级。 */
    const imgSrc = computed(() => {
      if (!isVisible.value) return ''
      const source = resolvePhotoAsset(imageCandidates.value[sourceIndex.value])
      if (!source || retryVersion.value === 0) return source
      return `${source}${source.includes('?') ? '&' : '?'}retry=${retryVersion.value}`
    })

    /** srcset：小屏用缩略图(400px)，大屏用中等图(800px) */
    const imgSrcset = computed(() => {
      if (!isVisible.value || sourceIndex.value > 0 || retryVersion.value > 0) return ''
      return getResponsiveSourceSet(props.photo)
    })

    /** sizes：卡片宽度约 300-400px，根据视口选择 */
    const imgSizes = computed(() => {
      return '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
    })

    /** 扫描阶段已记录原图尺寸，首帧即可预留正确比例，避免解码后布局跳动。 */
    const containerStyle = computed(() => {
      const width = Number(props.photo.metadata?.width)
      const height = Number(props.photo.metadata?.height)
      return { aspectRatio: width > 0 && height > 0 ? `${width} / ${height}` : '4 / 3' }
    })

    const truncatedDescription = computed(() => {
      const desc = props.photo.description
      if (!desc) return ''
      return desc.length > 100 ? desc.substring(0, 100) + '...' : desc
    })

    const displayedTags = computed(() => {
      return props.photo.tags ? props.photo.tags.slice(0, 3) : []
    })

    const hasMoreTags = computed(() => {
      return props.photo.tags && props.photo.tags.length > 3
    })

    // ── 方法 ──

    const onImageLoad = () => {
      isLoaded.value = true
      hasError.value = false
      emit('load')
    }

    const onImageError = () => {
      if (sourceIndex.value < imageCandidates.value.length - 1) {
        sourceIndex.value++
        return
      }
      isLoaded.value = false
      hasError.value = true
    }

    const retryImage = () => {
      hasError.value = false
      isLoaded.value = false
      sourceIndex.value = 0
      retryVersion.value++
    }

    const playLivePhoto = () => {
      if (props.photo.isLivePhoto && props.photo.liveVideoUrl) {
        isPlayingLive.value = true
        document.body.style.overflow = 'hidden'
      }
    }

    const stopLivePhoto = () => {
      isPlayingLive.value = false
      document.body.style.overflow = ''
    }

    /**
     * 格式化日期为相对时间
     */
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      const now = new Date()
      const diffTime = now - date
      const diffDays = Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return '今天'
      if (diffDays === 1) return '昨天'
      if (diffDays < 7) return `${diffDays}天前`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    /**
     * 真正的懒加载：IntersectionObserver 监听卡片进入视口
     */
    const setupObserver = () => {
      stopObserving = observeLazyElement(cardRef.value, () => {
        isVisible.value = true
      })
    }

    // 键盘事件
    const handleKeyDown = (event) => {
      if (isPlayingLive.value && event.key === 'Escape') {
        stopLivePhoto()
      }
    }

    // ── 生命周期 ──
    onMounted(() => {
      setupObserver()
    })

    // 仅在 Live Photo 模态框打开时注册全局按键，普通卡片不再各占一个监听器。
    watch(isPlayingLive, (playing) => {
      document[playing ? 'addEventListener' : 'removeEventListener']('keydown', handleKeyDown)
    })

    onUnmounted(() => {
      stopObserving()
      document.removeEventListener('keydown', handleKeyDown)
      if (isPlayingLive.value) {
        document.body.style.overflow = ''
      }
    })

    return {
      // 引用
      cardRef,
      imgRef,
      // 数据
      isLoaded,
      hasError,
      isPlayingLive,
      isVisible,
      // 计算属性
      imgSrc,
      imgSrcset,
      imgSizes,
      containerStyle,
      truncatedDescription,
      displayedTags,
      hasMoreTags,
      // 方法
      onImageLoad,
      onImageError,
      retryImage,
      playLivePhoto,
      stopLivePhoto,
      formatDate
    }
  }
}
</script>

<style lang="scss" scoped>
.photo-card {
  position: relative;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-spring), box-shadow var(--transition-spring), border-color var(--transition-spring);
  cursor: pointer;
  break-inside: avoid;
  content-visibility: auto;
  contain-intrinsic-size: 360px 430px;

  &:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-light);

    .photo-overlay {
      opacity: 1;
    }

    .photo-image {
      transform: scale(1.06);
    }

    .photo-info {
      transform: translateY(0);
    }
  }

  &.live-photo {
    .live-photo-badge {
      display: flex;
    }
  }

  &.loaded {
    .image-skeleton {
      opacity: 0;
      visibility: hidden;
    }

    .photo-image {
      opacity: 1;
      transform: scale(1);
    }
  }

  &.loaded:hover .photo-image {
    transform: scale(1.035);
  }

  &.error {
    .image-error {
      opacity: 1;
      visibility: visible;
    }
  }

  &.size-small {
    .photo-info {
      padding: var(--spacing-sm) var(--spacing-md);

      .photo-title {
        font-size: 0.9rem;
      }
    }

    .photo-overlay {
      .overlay-info {
        font-size: 0.8rem;
      }
    }
  }
}

.live-photo-badge {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  background: linear-gradient(135deg, #ff3b30, #ff6b6b);
  color: white;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: 0.68rem;
  font-weight: var(--font-weight-semibold);
  z-index: 10;
  display: none;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(10px);
  letter-spacing: 0.5px;

  .icon {
    width: 12px;
    height: 12px;
  }
}

.category-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  z-index: 10;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-left: 2px solid rgba(255, 255, 255, 0.3);
}

.image-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--bg-tertiary);

  .photo-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transform: scale(0.98);
    transition: opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out);
  }

  .image-skeleton {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity var(--transition-normal), visibility var(--transition-normal);
  }

  .image-error {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    color: var(--text-muted);
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--transition-normal), visibility var(--transition-normal);

    .icon {
      width: 2rem;
      height: 2rem;
      opacity: 0.5;
    }

    span {
      font-size: 0.85rem;
    }

    .image-retry {
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-full);
      padding: 5px 12px;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font: inherit;
      font-size: 0.78rem;
      cursor: pointer;

      &:hover {
        color: var(--primary-color);
        border-color: var(--primary-color);
      }
    }
  }
}

.photo-info {
  padding: var(--spacing-md) var(--spacing-lg);
  transition: transform var(--transition-normal);

  .photo-title {
    font-size: 1.05rem;
    font-weight: var(--font-weight-semibold);
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .photo-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: var(--spacing-sm);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .photo-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);

    .photo-tag {
      background: rgba(61, 122, 140, 0.06);
      color: var(--primary-color);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.78rem;
      font-weight: var(--font-weight-medium);
      transition: background var(--transition-fast);

      &:hover {
        background: rgba(61, 122, 140, 0.12);
      }
    }

    .tag-more {
      color: var(--text-muted);
      font-size: 0.78rem;
      padding: 2px 4px;
    }
  }

  .photo-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.8rem;
      color: var(--text-muted);

      .meta-icon {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        color: var(--primary-light);
        opacity: 0.8;
      }
    }
  }
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-lg) var(--spacing-md) var(--spacing-md);
  background: linear-gradient(to top, rgba(30, 42, 50, 0.5) 0%, transparent 100%);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  opacity: 0;
  transition: opacity var(--transition-spring);
  pointer-events: none;

  .overlay-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: white;
    font-size: 0.85rem;
    font-weight: var(--font-weight-medium);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);

    .overlay-icon {
      width: 16px;
      height: 16px;
    }
  }

  .btn-live-play {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255, 59, 48, 0.9);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: transform var(--transition-fast), background var(--transition-fast);
    pointer-events: all;

    .icon {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: rgba(255, 59, 48, 1);
      transform: scale(1.1);
    }
  }
}

.live-player {
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

  video {
    max-width: 90vw;
    max-height: 90vh;
    border-radius: var(--radius-md);
  }

  .live-close {
    position: absolute;
    top: 20px;
    right: 20px;
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

// 响应式
@media (max-width: 768px) {
  .photo-card {
    .photo-info {
      padding: var(--spacing-sm) var(--spacing-md);

      .photo-title {
        font-size: 0.95rem;
      }
    }
  }
}
</style>
