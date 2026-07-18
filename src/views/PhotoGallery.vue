<template>
  <div class="photo-gallery">
    <div class="container">
      <!-- 左侧侧边栏控制面板 -->
      <aside class="sidebar">
        <!-- 搜索区块 -->
        <div class="sidebar-section">
          <h3 class="sidebar-section-title">筛选</h3>
          <div class="search-box">
            <svg class="icon search-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索标题、分类、相机、日期..."
              class="search-input"
              @input="onSearch"
              aria-label="搜索照片"
            />
            <button class="search-clear" @click="clearSearch" v-if="searchQuery">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 视图切换区块 -->
        <div class="sidebar-section">
          <h3 class="sidebar-section-title">视图</h3>
          <div class="segmented-control">
            <button
              class="segmented-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="setViewMode('grid')"
              title="网格视图"
            >
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
              </svg>
              <span>网格</span>
            </button>
            <button
              class="segmented-btn"
              :class="{ active: viewMode === 'list' }"
              @click="setViewMode('list')"
              title="列表视图"
            >
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 4h18v3H3V4zm0 6h18v3H3v-3zm0 6h18v3H3v-3z" />
              </svg>
              <span>列表</span>
            </button>
          </div>
        </div>

        <!-- 分类导航区块 -->
        <div class="sidebar-section">
          <h3 class="sidebar-section-title">相册</h3>
          <div class="category-list">
            <button
              class="category-item"
              :class="{ active: currentFilter === 'all' }"
              @click="selectCategory('all')"
            >
              <svg class="icon cat-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
              </svg>
              <span class="category-name">全部</span>
              <span class="category-count">{{ photos.length }}</span>
            </button>
            <div class="category-divider"></div>
            <button
              v-for="category in categories"
              :key="category.id"
              class="category-item"
              :class="{ active: currentFilter === category.id }"
              @click="selectCategory(category.id)"
            >
              <svg class="icon cat-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
              </svg>
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count">{{ category.count }}</span>
            </button>
          </div>
        </div>

        <!-- 排序区块 -->
        <div class="sidebar-section">
          <h3 class="sidebar-section-title">排序</h3>
          <div class="sort-controls">
            <select v-model="sortBy" class="sort-select" @change="onSortChange">
              <option value="date">按日期</option>
              <option value="title">按标题</option>
              <option value="size">按大小</option>
            </select>

            <button class="btn btn-ghost btn-sm sort-order-btn" @click="toggleSortOrder" :title="sortOrder === 'desc' ? '降序' : '升序'">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" v-if="sortOrder === 'desc'">
                <path d="M7 10l5 5 5-5z" />
              </svg>
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" v-else>
                <path d="M7 14l5-5 5 5z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="gallery-main">
        <!-- 照片统计 -->
        <div class="gallery-stats" v-if="!isLoading && filteredPhotos.length > 0">
          <div class="gallery-heading">
            <span class="gallery-eyebrow">PHOTO LIBRARY</span>
            <h2>{{ currentAlbumName }}</h2>
            <p>当前显示 <strong>{{ filteredPhotos.length }}</strong> 张影像</p>
          </div>
          <div class="date-range" v-if="dateRange">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" />
            </svg>
            <span>{{ dateRange }}</span>
          </div>
        </div>

        <!-- 照片网格（瀑布流） -->
        <div class="photos-container" v-if="!isLoading && filteredPhotos.length > 0">
          <transition name="fade" mode="out-in">
            <div v-if="viewMode === 'grid'" key="grid" class="photo-masonry">
              <PhotoCard
                v-for="(photo, index) in displayedPhotos"
                :key="photo.id"
                :photo="photo"
                :index="index"
                class="masonry-item"
                @click="openPhotoDetail(photo)"
                @load="onPhotoLoad"
              />
            </div>

            <div v-else key="list" class="photo-list">
              <PhotoListItem
                v-for="photo in displayedPhotos"
                :key="photo.id"
                :photo="photo"
                @click="openPhotoDetail(photo)"
              />
            </div>
          </transition>

          <!-- 无限滚动哨兵元素 -->
          <div ref="sentinelRef" class="scroll-sentinel" v-if="hasMorePhotos" aria-live="polite">
            <div class="sentinel-loading">
              <div class="spinner"></div>
              <span>加载中...</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredPhotos.length === 0 && !isLoading" class="empty-state">
          <div class="empty-content">
            <svg class="icon empty-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
            </svg>
            <h3>没有找到照片</h3>
            <p>尝试调整筛选条件或搜索关键词</p>
            <button class="btn btn-ghost btn-sm" @click="resetFilters">清除筛选</button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading">
            <div class="spinner"></div>
            <p>正在加载照片...</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '../stores/photoStore'
import PhotoCard from '../components/PhotoCard.vue'
import PhotoListItem from '../components/PhotoListItem.vue'

export default {
  name: 'PhotoGallery',
  components: {
    PhotoCard,
    PhotoListItem
  },
  setup() {
    const router = useRouter()
    const photoStore = usePhotoStore()

    // ── 响应式数据 ──
    const viewMode = ref('grid')
    const pageSize = ref(24)
    const currentPage = ref(1)
    const loadedImages = ref(0)
    const sentinelRef = ref(null)

    let scrollObserver = null
    let searchTimer = null

    // ── 计算属性 ──
    const photos = computed(() => photoStore.photos)
    const categories = computed(() => photoStore.categories)
    const filteredPhotos = computed(() => photoStore.filteredPhotos)
    const currentFilter = computed({
      get: () => photoStore.currentFilter,
      set: (val) => photoStore.setFilter(val)
    })
    const searchQuery = ref(photoStore.searchQuery)
    const sortBy = computed({
      get: () => photoStore.sortBy,
      set: (val) => {}
    })
    const sortOrder = computed(() => photoStore.sortOrder)
    const isLoading = computed(() => photoStore.isLoading)
    const currentAlbumName = computed(() => {
      if (currentFilter.value === 'all') return searchQuery.value ? '搜索结果' : '全部影像'
      return categories.value.find(category => category.id === currentFilter.value)?.name || '当前相册'
    })

    const displayedPhotos = computed(() => {
      const end = currentPage.value * pageSize.value
      return filteredPhotos.value.slice(0, end)
    })

    const hasMorePhotos = computed(() => {
      return displayedPhotos.value.length < filteredPhotos.value.length
    })

    const dateRange = computed(() => {
      if (filteredPhotos.value.length === 0) return null
      let min = Infinity
      let max = -Infinity
      filteredPhotos.value.forEach((photo) => {
        const value = new Date(photo.date).getTime()
        if (isNaN(value)) return
        min = Math.min(min, value)
        max = Math.max(max, value)
      })
      if (!isFinite(min) || !isFinite(max)) return null
      const minDate = new Date(min)
      const maxDate = new Date(max)
      const fmt = (d) => d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
      return `${fmt(minDate)} — ${fmt(maxDate)}`
    })

    // ── 方法 ──
    const selectCategory = (categoryId) => {
      photoStore.setFilter(categoryId)
      currentPage.value = 1
      loadedImages.value = 0
    }

    const setViewMode = (mode) => {
      viewMode.value = mode
    }

    const onSearch = (event) => {
      searchQuery.value = event.target.value
      window.clearTimeout(searchTimer)
      searchTimer = window.setTimeout(() => {
        photoStore.setSearchQuery(searchQuery.value)
        currentPage.value = 1
        loadedImages.value = 0
      }, 160)
    }

    const clearSearch = () => {
      photoStore.setSearchQuery('')
      window.clearTimeout(searchTimer)
      currentPage.value = 1
      loadedImages.value = 0
    }

    const resetFilters = () => {
      searchQuery.value = ''
      photoStore.setSearchQuery('')
      photoStore.setFilter('all')
      currentPage.value = 1
    }

    const onSortChange = (event) => {
      photoStore.setSort(event.target.value, sortOrder.value)
      currentPage.value = 1
    }

    const toggleSortOrder = () => {
      const newOrder = sortOrder.value === 'desc' ? 'asc' : 'desc'
      photoStore.setSort(sortBy.value, newOrder)
      currentPage.value = 1
    }

    const loadMore = () => {
      if (!hasMorePhotos.value) return
      currentPage.value++
    }

    const openPhotoDetail = (photo) => {
      router.push({
        name: 'PhotoDetail',
        params: { id: photo.id }
      })
    }

    const onPhotoLoad = () => {
      loadedImages.value++
    }

    /**
     * IntersectionObserver 实现无限滚动
     */
    const setupScrollObserver = () => {
      if (!('IntersectionObserver' in window)) return

      scrollObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && hasMorePhotos.value) {
              loadMore()
            }
          })
        },
        {
          rootMargin: '300px 0px',
          threshold: 0
        }
      )
    }

    const observeSentinel = () => {
      if (scrollObserver && sentinelRef.value) {
        scrollObserver.observe(sentinelRef.value)
      }
    }

    // 监听哨兵元素变化，重新观察
    watch(sentinelRef, (newRef, oldRef) => {
      if (oldRef && scrollObserver) {
        scrollObserver.unobserve(oldRef)
      }
      if (newRef && scrollObserver) {
        scrollObserver.observe(newRef)
      }
    })

    // 筛选/搜索变化时重置分页
    watch([currentFilter, () => photoStore.searchQuery], () => {
      currentPage.value = 1
    })

    // ── 生命周期 ──
    onMounted(() => {
      setupScrollObserver()
      nextTick(() => {
        observeSentinel()
      })
    })

    onUnmounted(() => {
      window.clearTimeout(searchTimer)
      if (scrollObserver) {
        scrollObserver.disconnect()
        scrollObserver = null
      }
    })

    return {
      // 数据
      viewMode,
      pageSize,
      currentPage,
      loadedImages,
      sentinelRef,

      // 计算属性
      photos,
      categories,
      filteredPhotos,
      currentFilter,
      searchQuery,
      sortBy,
      sortOrder,
      isLoading,
      displayedPhotos,
      hasMorePhotos,
      dateRange,
      currentAlbumName,

      // 方法
      selectCategory,
      setViewMode,
      onSearch,
      clearSearch,
      resetFilters,
      onSortChange,
      toggleSortOrder,
      loadMore,
      openPhotoDetail,
      onPhotoLoad
    }
  }
}
</script>

<style lang="scss" scoped>
.photo-gallery {
  min-height: 100vh;
  padding-bottom: var(--spacing-xxl);
}

// ── 主布局：左右两列 flex ──
.photo-gallery > .container {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xl);
}

// ── 侧边栏 ──
.sidebar {
  width: 260px;
  flex-shrink: 0;
  position: sticky;
  top: calc(var(--header-height) + 24px);
  height: fit-content;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-right: 1px solid var(--border-color);
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  padding: var(--spacing-lg);
  padding-right: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

[data-theme='dark'] .sidebar {
  background: rgba(26, 35, 40, 0.6);
}

.sidebar-section {
  margin-bottom: var(--spacing-lg);

  &:last-child {
    margin-bottom: 0;
  }
}

.sidebar-section-title {
  font-size: 0.72rem;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: var(--spacing-sm);
  padding-left: 4px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-light);
}

// ── 搜索框 ──
.search-box {
  position: relative;

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 11px 40px 11px 44px;
    border: 1.5px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    background: var(--bg-secondary);
    color: var(--text-primary);
    transition: all var(--transition-normal);

    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 4px rgba(90, 155, 176, 0.12), var(--shadow-sm);
    }

    &::placeholder {
      color: var(--text-muted);
    }
  }

  .search-clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 6px;
    cursor: pointer;
    color: var(--text-muted);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);

    .icon {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }
  }
}

// ── 分段控制器（视图切换） ──
.segmented-control {
  display: flex;
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: var(--radius-md);
  gap: 2px;

  .segmented-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-normal);

    .icon {
      width: 16px;
      height: 16px;
    }

    &:hover:not(.active) {
      color: var(--text-secondary);
    }

    &.active {
      background: var(--bg-secondary);
      color: var(--primary-color);
      box-shadow: var(--shadow-sm);
      transition: all 0.35s var(--ease-spring);
    }
  }
}

// ── 分类列表（纵向） ──
.category-list {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .category-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 11px 12px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.9rem;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-normal);

    .cat-icon {
      width: 16px;
      height: 16px;
      color: var(--text-muted);
      flex-shrink: 0;
      transition: color var(--transition-fast);
    }

    .category-name {
      flex: 1;
      font-weight: var(--font-weight-medium);
      text-align: left;
      transition: font-weight var(--transition-fast);
    }

    .category-count {
      font-size: 0.8rem;
      color: var(--text-muted);
      background: var(--bg-tertiary);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      min-width: 28px;
      text-align: center;
      transition: all var(--transition-fast);
    }

    &:hover:not(.active) {
      background: var(--bg-tertiary);
      transform: translateX(4px);
      box-shadow: inset 2px 0 0 var(--primary-light);

      .cat-icon {
        color: var(--primary-color);
      }
    }

    &.active {
      background: linear-gradient(135deg, rgba(61, 122, 140, 0.08) 0%, rgba(61, 122, 140, 0.04) 100%);
      color: var(--primary-color);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 70%;
        background: var(--primary-gradient);
        border-radius: 2px;
      }

      .cat-icon {
        color: var(--primary-color);
      }

      .category-name {
        font-weight: var(--font-weight-semibold);
      }

      .category-count {
        background: var(--primary-color);
        color: white;
      }
    }
  }

  .category-divider {
    border-top: 1px solid var(--border-light);
    margin: 8px 14px;
  }
}

// ── 排序控件 ──
.sort-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  .sort-select {
    flex: 1;
    padding: 8px 32px 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.85rem;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a8b95' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
    transition: border-color var(--transition-fast);

    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }

  .sort-order-btn {
    flex-shrink: 0;
    min-width: auto;
    padding: 8px 10px;

    .icon {
      width: 18px;
      height: 18px;
    }
  }
}

// ── 主内容区 ──
.gallery-main {
  flex: 1;
  min-width: 0;
}

.gallery-stats {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  padding: 2px 0 var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  position: relative;

  .gallery-heading {
    .gallery-eyebrow {
      display: block;
      margin-bottom: 5px;
      color: var(--primary-color);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.16em;
    }

    h2 {
      margin-bottom: 2px;
      color: var(--text-primary);
      font-size: clamp(1.6rem, 3vw, 2.35rem);
      line-height: 1.12;
      letter-spacing: -0.04em;
    }

    p {
      color: var(--text-secondary);
      font-size: 0.88rem;

      strong {
        color: var(--accent-color);
        font-weight: var(--font-weight-bold);
      }
    }
  }

  .date-range {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.875rem;
    color: var(--text-muted);

    .icon {
      width: 16px;
      height: 16px;
    }
  }
}

.photos-container {
  .photo-masonry {
    column-count: 4;
    column-gap: var(--spacing-lg);

    @media (max-width: 1200px) {
      column-count: 3;
    }

    @media (max-width: 768px) {
      column-count: 2;
    }

    @media (max-width: 480px) {
      column-count: 1;
    }

    .masonry-item {
      break-inside: avoid;
      margin-bottom: var(--spacing-lg);
      display: block;
      animation: stagger-fade-in 0.5s var(--ease-out) backwards;
    }

    // Staggered 入场延迟（前12个）
    .masonry-item:nth-child(1) { animation-delay: 0s; }
    .masonry-item:nth-child(2) { animation-delay: 0.04s; }
    .masonry-item:nth-child(3) { animation-delay: 0.08s; }
    .masonry-item:nth-child(4) { animation-delay: 0.12s; }
    .masonry-item:nth-child(5) { animation-delay: 0.16s; }
    .masonry-item:nth-child(6) { animation-delay: 0.20s; }
    .masonry-item:nth-child(7) { animation-delay: 0.24s; }
    .masonry-item:nth-child(8) { animation-delay: 0.28s; }
    .masonry-item:nth-child(9) { animation-delay: 0.32s; }
    .masonry-item:nth-child(10) { animation-delay: 0.36s; }
    .masonry-item:nth-child(11) { animation-delay: 0.40s; }
    .masonry-item:nth-child(12) { animation-delay: 0.44s; }
  }

  .photo-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
  }

  .scroll-sentinel {
    display: flex;
    justify-content: center;
    padding: var(--spacing-lg) 0;

    .sentinel-loading {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--text-muted);
      font-size: 0.9rem;

      .spinner {
        width: 24px;
        height: 24px;
        position: relative;
        animation: pulse-opacity 1.5s var(--ease-in-out) infinite;

        &::before,
        &::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
        }

        &::before {
          border: 2px solid var(--border-light);
          border-top-color: var(--primary-color);
          animation: spin 0.8s linear infinite;
        }

        &::after {
          inset: 6px;
          border: 1.5px solid var(--border-light);
          border-bottom-color: var(--primary-light);
          animation: spin 0.6s linear infinite reverse;
        }
      }
    }
  }
}

@keyframes pulse-opacity {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
      margin-bottom: var(--spacing-md);
    }
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxxl);

  .loading {
    text-align: center;

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid var(--border-light);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto var(--spacing-md);
    }

    p {
      color: var(--text-muted);
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ── 响应式：平板端（768px ~ 1023px）──
@media (max-width: 1023px) and (min-width: 768px) {
  .sidebar {
    width: 220px;
    padding: var(--spacing-md);
    padding-right: var(--spacing-lg);
  }
}

// ── 响应式：移动端（< 768px）── 恢复上下堆叠布局
@media (max-width: 767px) {
  .photo-gallery > .container {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .sidebar {
    position: static;
    width: 100%;
    border-right: none;
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-sm);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      'search search'
      'view sort'
      'albums albums';
    gap: var(--spacing-md);
  }

  .sidebar-section {
    margin-bottom: 0;

    &:last-child {
      margin-bottom: 0;
    }

    &:nth-child(1) { grid-area: search; }
    &:nth-child(2) { grid-area: view; }
    &:nth-child(3) { grid-area: albums; }
    &:nth-child(4) { grid-area: sort; }
  }

  // 移动端分类导航回到横向药丸按钮流式布局
  .category-list {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: var(--spacing-sm);
    overflow-x: auto;
    padding: 2px 2px var(--spacing-xs);
    scrollbar-width: none;
    overscroll-behavior-inline: contain;

    &::-webkit-scrollbar {
      display: none;
    }

    .category-item {
      padding: 8px 16px;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      border-radius: var(--radius-full);
      transform: none;
      flex: 0 0 auto;

      &:hover:not(.active) {
        background: var(--bg-tertiary);
        border-color: var(--border-strong);
        transform: none;
      }

      &.active {
        background: var(--primary-gradient);
        color: var(--text-inverse);
        border-color: transparent;
        box-shadow: var(--shadow-sm);

        &::before {
          display: none;
        }

        .cat-icon {
          color: var(--text-inverse);
        }

        .category-count {
          background: rgba(255, 255, 255, 0.25);
          color: var(--text-inverse);
        }
      }
    }

    .category-divider {
      display: none;
    }
  }

  .gallery-stats {
    align-items: flex-start;
    gap: var(--spacing-sm);

    .date-range {
      display: none;
    }
  }
}
</style>
