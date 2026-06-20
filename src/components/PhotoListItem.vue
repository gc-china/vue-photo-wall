<template>
  <div
    ref="itemRef"
    class="photo-list-item"
    :class="{
      'live-photo': photo.isLivePhoto,
      'selected': isSelected,
      'loaded': isLoaded
    }"
    @click="$emit('click')"
  >
    <!-- Live Photo 标识 -->
    <div v-if="photo.isLivePhoto" class="live-photo-badge">
      <span>LIVE</span>
    </div>

    <!-- 缩略图 -->
    <div class="photo-thumbnail">
      <img
        ref="imgRef"
        :src="imgSrc"
        :alt="photo.title"
        @load="onImageLoad"
        @error="onImageError"
      />

      <!-- 骨架屏占位 -->
      <div v-if="!isLoaded && !hasError" class="thumbnail-skeleton skeleton"></div>

      <!-- 错误状态 -->
      <div v-if="hasError" class="thumbnail-error">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
        </svg>
      </div>
    </div>

    <!-- 照片信息 -->
    <div class="photo-details">
      <div class="photo-main-info">
        <h3 class="photo-title">{{ photo.title }}</h3>
        <p class="photo-description" v-if="truncatedDescription">{{ truncatedDescription }}</p>

        <div class="photo-meta">
          <div class="meta-item">
            <svg class="icon meta-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" />
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span>{{ formatDate(photo.date) }}</span>
          </div>

          <div class="meta-item">
            <svg class="icon meta-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
            </svg>
            <span>{{ photo.category }}</span>
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

      <div class="photo-actions">
        <button
          v-if="photo.isLivePhoto && photo.liveVideoUrl"
          class="btn-action btn-live-play"
          @click.stop="playLivePhoto"
          title="播放 Live Photo"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>Live</span>
        </button>

        <button
          class="btn-action btn-favorite"
          :class="{ active: isFavorite }"
          @click.stop="toggleFavorite"
          title="收藏"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path v-if="isFavorite" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            <path v-else d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
          </svg>
        </button>

        <button
          class="btn-action btn-share"
          @click.stop="sharePhoto"
          v-if="canShare"
          title="分享"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Live Photo 播放模态框 -->
    <div v-if="isPlayingLive" class="live-player-modal" @click.stop="stopLivePhoto">
      <div class="live-player-content" @click.stop>
        <video
          ref="liveVideoPlayer"
          :src="photo.liveVideoUrl"
          autoplay
          muted
          playsinline
          controls
          @ended="stopLivePhoto"
        ></video>
        <button class="live-close" @click.stop="stopLivePhoto">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'PhotoListItem',
  props: {
    photo: {
      type: Object,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    // ── 响应式数据 ──
    const itemRef = ref(null)
    const imgRef = ref(null)
    const isLoaded = ref(false)
    const hasError = ref(false)
    const isPlayingLive = ref(false)
    const isFavorite = ref(false)
    const isVisible = ref(false)
    const canShare = ref(typeof navigator !== 'undefined' && !!navigator.share)

    let observer = null

    // ── 计算属性 ──

    /** 懒加载：进入视口后才加载缩略图 */
    const imgSrc = computed(() => {
      if (!isVisible.value) return ''
      return props.photo.thumbnail || props.photo.image
    })

    const truncatedDescription = computed(() => {
      const desc = props.photo.description
      if (!desc) return ''
      return desc.length > 150 ? desc.substring(0, 150) + '...' : desc
    })

    // ── 方法 ──
    const onImageLoad = () => {
      isLoaded.value = true
      hasError.value = false
    }

    const onImageError = () => {
      isLoaded.value = false
      hasError.value = true
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

    const toggleFavorite = () => {
      isFavorite.value = !isFavorite.value
    }

    const sharePhoto = async () => {
      if (canShare.value && props.photo) {
        try {
          await navigator.share({
            title: props.photo.title,
            text: props.photo.description || '',
            url: window.location.href
          })
        } catch (error) {
          console.error('分享失败:', error)
        }
      }
    }

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
     * 懒加载：IntersectionObserver
     */
    const setupObserver = () => {
      if (!('IntersectionObserver' in window)) {
        isVisible.value = true
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              isVisible.value = true
              if (observer) {
                observer.unobserve(entry.target)
              }
            }
          })
        },
        {
          rootMargin: '100px 0px',
          threshold: 0.01
        }
      )

      if (itemRef.value) {
        observer.observe(itemRef.value)
      }
    }

    // ── 生命周期 ──
    onMounted(() => {
      setupObserver()
    })

    onUnmounted(() => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
      if (isPlayingLive.value) {
        document.body.style.overflow = ''
      }
    })

    return {
      // 引用
      itemRef,
      imgRef,
      // 数据
      isLoaded,
      hasError,
      isPlayingLive,
      isFavorite,
      canShare,
      // 计算属性
      imgSrc,
      truncatedDescription,
      // 方法
      onImageLoad,
      onImageError,
      playLivePhoto,
      stopLivePhoto,
      toggleFavorite,
      sharePhoto,
      formatDate
    }
  }
}
</script>

<style lang="scss" scoped>
.photo-list-item {
  position: relative;
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-spring), box-shadow var(--transition-spring), border-color var(--transition-spring);
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-light);
  }

  &.selected {
    border: 2px solid var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &.live-photo {
    .live-photo-badge {
      display: flex;
    }
  }

  &.loaded {
    .thumbnail-skeleton {
      opacity: 0;
      visibility: hidden;
    }

    img {
      opacity: 1;
    }
  }
}

.live-photo-badge {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  background: linear-gradient(135deg, #ff3b30, #ff6b6b);
  color: white;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: 0.68rem;
  font-weight: var(--font-weight-semibold);
  z-index: 10;
  display: none;
  backdrop-filter: blur(10px);
  letter-spacing: 0.5px;
}

.photo-thumbnail {
  position: relative;
  width: 140px;
  height: 140px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-tertiary);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity var(--transition-normal), transform 0.5s var(--ease-out);
  }

  .thumbnail-skeleton {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity var(--transition-normal), visibility var(--transition-normal);
  }

  .thumbnail-error {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    opacity: 0.4;

    .icon {
      width: 2rem;
      height: 2rem;
    }
  }

  &:hover img {
    transform: scale(1.06);
  }
}

.photo-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.photo-main-info {
  flex: 1;
  min-width: 0;

  .photo-title {
    font-size: 1.15rem;
    font-weight: var(--font-weight-semibold);
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .photo-description {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: var(--spacing-md);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .photo-meta {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xs);

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.85rem;
      color: var(--text-muted);

      .meta-icon {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        opacity: 0.7;
      }
    }
  }
}

.photo-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  @media (max-width: 768px) {
    flex-direction: row;
    justify-content: center;
  }

  .btn-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all var(--transition-spring);
    background: var(--bg-primary);
    color: var(--text-muted);

    .icon {
      width: 16px;
      height: 16px;
    }

    &.btn-live-play {
      background: rgba(255, 59, 48, 0.08);
      color: #ff3b30;
      border-color: rgba(255, 59, 48, 0.25);

      &:hover {
        background: rgba(255, 59, 48, 0.15);
      }
    }

    &.btn-favorite {
      &:hover {
        background: var(--bg-tertiary);
      }

      &.active {
        background: rgba(255, 59, 48, 0.08);
        color: #ff3b30;
        border-color: rgba(255, 59, 48, 0.25);
      }
    }

    &.btn-share {
      &:hover {
        background: var(--bg-tertiary);
      }
    }
  }
}

.live-player-modal {
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

  .live-player-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;

    video {
      max-width: 100%;
      max-height: 100%;
      border-radius: var(--radius-md);
    }

    .live-close {
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

// 响应式
@media (max-width: 768px) {
  .photo-list-item {
    flex-direction: column;

    .photo-thumbnail {
      width: 100%;
      height: 200px;
    }

    .photo-details {
      .photo-main-info {
        .photo-title {
          font-size: 1.1rem;
        }

        .photo-description {
          font-size: 0.875rem;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .photo-list-item {
    padding: var(--spacing-sm);

    .photo-thumbnail {
      height: 160px;
    }

    .photo-actions {
      .btn-action {
        padding: 6px 10px;
        font-size: 0.8rem;
      }
    }
  }
}
</style>
