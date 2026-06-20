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
              placeholder="搜索照片标题、描述或标签..."
              class="search-input"
              @input="onSearch"
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
          <p>共 <strong>{{ filteredPhotos.length }}</strong> 张照片</p>
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
          <div ref="sentinelRef" class="scroll-sentinel" v-if="hasMorePhotos">
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

    // ── 计算属性 ──
    const photos = computed(() => photoStore.photos)
    const categories = computed(() => photoStore.categories)
    const filteredPhotos = computed(() => photoStore.filteredPhotos)
    const currentFilter = computed({
      get: () => photoStore.currentFilter,
      set: (val) => photoStore.setFilter(val)
    })
    const searchQuery = computed({
      get: () => photoStore.searchQuery,
      set: (val) => {} // 写入由 onSearch 处理
    })
    const sortBy = computed({
      get: () => photoStore.sortBy,
      set: (val) => {}
    })
    const sortOrder = computed(() => photoStore.sortOrder)
    const isLoading = computed(() => photoStore.isLoading)

    const displayedPhotos = computed(() => {
      const end = currentPage.value * pageSize.value
      return filteredPhotos.value.slice(0, end)
    })

    const hasMorePhotos = computed(() => {
      return displayedPhotos.value.length < filteredPhotos.value.length
    })

    const dateRange = computed(() => {
      if (filteredPhotos.value.length === 0) return null
      const dates = filteredPhotos.value.map(p => new Date(p.date).getTime()).filter(t => !isNaN(t))
      if (dates.length === 0) return null
      const minDate = new Date(Math.min(...dates))
      const maxDate = new Date(Math.max(...dates))
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
      photoStore.setSearchQuery(event.target.value)
      currentPage.value = 1
      loadedImages.value = 0
    }

    const clearSearch = () => {
      photoStore.setSearchQuery('')
      currentPage.value = 1
      loadedImages.value = 0
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

      // 方法
      selectCategory,
      setViewMode,
      onSearch,
      clearSearch,
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
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  padding: var(--spacing-lg);
  padding-right: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.sidebar-section {
  margin-bottom: var(--spacing-lg);

  &:last-child {
    margin-bottom: 0;
  }
}

.sidebar-section-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: var(--spacing-sm);
  padding-left: 4px;
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
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all var(--transition-normal);

    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(74, 144, 164, 0.12);
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
    padding: 10px 14px;
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
    }

    .category-name {
      flex: 1;
      font-weight: 500;
      text-align: left;
    }

    .category-count {
      font-size: 0.8rem;
      color: var(--text-muted);
      background: var(--bg-tertiary);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      min-width: 28px;
      text-align: center;
    }

    &:hover:not(.active) {
      background: var(--bg-tertiary);
      transform: translateX(2px);
    }

    &.active {
      background: linear-gradient(135deg, rgba(74, 144, 164, 0.08) 0%, rgba(74, 144, 164, 0.04) 100%);
      color: var(--primary-color);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 60%;
        background: var(--primary-color);
        border-radius: var(--radius-full);
      }

      .cat-icon {
        color: var(--primary-color);
      }

      .category-count {
        background: rgba(74, 144, 164, 0.15);
        color: var(--primary-color);
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
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.85rem;
    cursor: pointer;
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);

  p {
    color: var(--text-secondary);

    strong {
      color: var(--primary-color);
      font-weight: 600;
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
    column-gap: var(--spacing-md);

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
      margin-bottom: var(--spacing-md);
      display: block;
    }
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
        border: 2px solid var(--border-light);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
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
  }

  .sidebar-section {
    margin-bottom: var(--spacing-md);

    &:last-child {
      margin-bottom: 0;
    }
  }

  // 移动端分类导航回到横向药丸按钮流式布局
  .category-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--spacing-sm);

    .category-item {
      padding: 8px 16px;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      border-radius: var(--radius-full);
      transform: none;

      &:hover:not(.active) {
        background: var(--bg-tertiary);
        border-color: var(--border-strong);
        transform: none;
      }

      &.active {
        background: var(--primary-gradient);
        color: var(--text-inverse);
        border-color: transparent;

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
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }
}
</style>
