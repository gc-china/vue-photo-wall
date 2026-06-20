<template>
  <div class="timeline-view">
    <div class="container">
      <!-- 头部 -->
      <div class="timeline-header">
        <h1 class="page-title">时光轴</h1>
        <p class="page-subtitle">按时间浏览您的照片记忆</p>

        <!-- 时间轴控制 -->
        <div class="timeline-controls">
          <div class="view-modes">
            <button
              class="btn btn-ghost btn-sm"
              :class="{ 'btn-primary': viewMode === 'month' }"
              @click="setViewMode('month')"
            >按月查看</button>
            <button
              class="btn btn-ghost btn-sm"
              :class="{ 'btn-primary': viewMode === 'year' }"
              @click="setViewMode('year')"
            >按年查看</button>
            <button
              class="btn btn-ghost btn-sm"
              :class="{ 'btn-primary': viewMode === 'tree' }"
              @click="setViewMode('tree')"
            >树状视图</button>
          </div>

          <div class="date-navigation">
            <button class="btn btn-ghost btn-sm" @click="goToToday">回到最新</button>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="timeline-stats">
        <div class="stat-item">
          <span class="stat-number">{{ totalPhotos }}</span>
          <span class="stat-label">总照片数</span>
        </div>

        <div class="stat-item">
          <span class="stat-number">{{ totalYears }}</span>
          <span class="stat-label">年份跨度</span>
        </div>

        <div class="stat-item">
          <span class="stat-number">{{ averagePhotosPerMonth }}</span>
          <span class="stat-label">月均照片</span>
        </div>
      </div>

      <!-- 时间轴内容 -->
      <div class="timeline-content">
        <!-- 按月视图 -->
        <div v-if="viewMode === 'month'" class="monthly-view">
          <div
            v-for="[monthKey, photos] in sortedMonthlyPhotos"
            :key="monthKey"
            class="month-section"
            :data-month="monthKey"
          >
            <div class="month-header">
              <h3 class="month-title">{{ formatMonth(monthKey) }}</h3>
              <span class="month-count">{{ photos.length }} 张</span>
            </div>

            <div class="month-photos">
              <PhotoCard
                v-for="photo in photos.slice(0, photosToShow[monthKey] || 6)"
                :key="photo.id"
                :photo="photo"
                size="small"
                class="masonry-item"
                @click="openPhotoDetail(photo)"
              />

              <div
                v-if="photos.length > (photosToShow[monthKey] || 6)"
                class="show-more"
                @click="showMorePhotos(monthKey)"
              >
                <div class="show-more-content">
                  <span class="more-count">+{{ photos.length - (photosToShow[monthKey] || 6) }}</span>
                  <span class="more-text">查看更多</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 按年视图 -->
        <div v-if="viewMode === 'year'" class="yearly-view">
          <div
            v-for="yearData in timelineData"
            :key="yearData.year"
            class="year-section"
          >
            <div class="year-header">
              <h3 class="year-title">{{ yearData.year }}年</h3>
              <span class="year-count">{{ yearData.count }} 张</span>
            </div>

            <div class="year-months">
              <div
                v-for="monthData in yearData.months"
                :key="monthData.month"
                class="month-card"
                @click="selectMonth(yearData.year, monthData.month)"
              >
                <div class="month-info">
                  <span class="month-name">{{ monthData.monthName }}</span>
                  <span class="month-photo-count">{{ monthData.count }}张</span>
                </div>

                <div class="month-preview">
                  <LazyThumb
                    v-if="monthData.photos[0]"
                    :src="monthData.photos[0].thumbnail || monthData.photos[0].image"
                    :alt="monthData.monthName"
                  />
                  <div v-else class="preview-placeholder">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 树状视图 -->
        <div v-if="viewMode === 'tree'" class="tree-view">
          <div class="tree-container">
            <div
              v-for="yearData in timelineData"
              :key="yearData.year"
              class="tree-year"
            >
              <div class="tree-year-header" @click="toggleYear(yearData.year)">
                <svg class="icon toggle-icon" :class="{ expanded: expandedYears.has(yearData.year) }" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 6l6 6-6 6V6z" />
                </svg>
                <span class="year-label">{{ yearData.year }}年</span>
                <span class="year-count">({{ yearData.count }})</span>
              </div>

              <div v-if="expandedYears.has(yearData.year)" class="tree-year-content">
                <div
                  v-for="monthData in yearData.months"
                  :key="monthData.month"
                  class="tree-month"
                >
                  <div
                    class="tree-month-header"
                    @click="toggleMonth(yearData.year, monthData.month)"
                  >
                    <svg class="icon toggle-icon" :class="{ expanded: expandedMonths.has(`${yearData.year}-${monthData.month}`) }" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M10 6l6 6-6 6V6z" />
                    </svg>
                    <span class="month-label">{{ monthData.monthName }}</span>
                    <span class="month-count">({{ monthData.count }})</span>
                  </div>

                  <div v-if="expandedMonths.has(`${yearData.year}-${monthData.month}`)" class="tree-photos">
                    <div
                      v-for="photo in monthData.photos"
                      :key="photo.id"
                      class="tree-photo-item"
                      @click="openPhotoDetail(photo)"
                    >
                      <LazyThumb
                        :src="photo.thumbnail || photo.image"
                        :alt="photo.title"
                        class="tree-photo-thumb"
                      />
                      <div class="tree-photo-info">
                        <span class="photo-title">{{ photo.title }}</span>
                        <span class="photo-date">{{ formatDate(photo.date) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="timelineData.length === 0" class="empty-state">
          <div class="empty-content">
            <svg class="icon empty-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" />
            </svg>
            <h3>时光轴为空</h3>
            <p>还没有照片被添加到时光轴中</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, h, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '../stores/photoStore'
import PhotoCard from '../components/PhotoCard.vue'

/**
 * 内联懒加载缩略图组件（用于年视图/树状视图的小图）
 * 进入视口后才加载 src
 */
const LazyThumb = defineComponent({
  name: 'LazyThumb',
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: '' }
  },
  setup(props) {
    const elRef = ref(null)
    const isVisible = ref(false)
    let observer = null

    const currentSrc = computed(() => (isVisible.value ? props.src : ''))

    onMounted(() => {
      if (!('IntersectionObserver' in window)) {
        isVisible.value = true
        return
      }
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              isVisible.value = true
              if (observer) observer.unobserve(entry.target)
            }
          })
        },
        { rootMargin: '100px 0px', threshold: 0.01 }
      )
      if (elRef.value) observer.observe(elRef.value)
    })

    onUnmounted(() => {
      if (observer) observer.disconnect()
    })

    return () =>
      h('img', {
        ref: elRef,
        src: currentSrc.value,
        alt: props.alt,
        class: 'preview-image'
      })
  }
})

export default {
  name: 'TimelineView',
  components: {
    PhotoCard,
    LazyThumb
  },
  setup() {
    const router = useRouter()
    const photoStore = usePhotoStore()

    // ── 响应式数据 ──
    const viewMode = ref('month')
    const expandedYears = ref(new Set())
    const expandedMonths = ref(new Set())
    const photosToShow = ref({})

    // ── 计算属性 ──
    const timelineData = computed(() => photoStore.timelineData)
    const totalPhotos = computed(() => photoStore.photos.length)

    const totalYears = computed(() => {
      if (timelineData.value.length === 0) return 0
      const years = timelineData.value.map((y) => parseInt(y.year))
      return Math.max(...years) - Math.min(...years) + 1
    })

    const averagePhotosPerMonth = computed(() => {
      const totalMonths = timelineData.value.reduce((sum, year) => {
        return sum + year.months.length
      }, 0)
      return totalMonths > 0 ? Math.round(totalPhotos.value / totalMonths) : 0
    })

    const monthlyPhotos = computed(() => {
      const grouped = {}
      photoStore.photos.forEach((photo) => {
        const d = new Date(photo.date)
        if (isNaN(d.getTime())) return
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (!grouped[monthKey]) {
          grouped[monthKey] = []
        }
        grouped[monthKey].push(photo)
      })
      return grouped
    })

    const sortedMonthlyPhotos = computed(() => {
      return Object.entries(monthlyPhotos.value).sort(([a], [b]) => b.localeCompare(a))
    })

    // ── 方法 ──
    const setViewMode = (mode) => {
      viewMode.value = mode
    }

    const goToToday = () => {
      // 滚动到最新月份
      const sorted = sortedMonthlyPhotos.value
      if (sorted.length > 0) {
        const latestMonth = sorted[0][0]
        const element = document.querySelector(`[data-month="${latestMonth}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }

    const formatMonth = (monthKey) => {
      const date = new Date(monthKey + '-01')
      if (isNaN(date.getTime())) return monthKey
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }

    const showMorePhotos = (monthKey) => {
      photosToShow.value = {
        ...photosToShow.value,
        [monthKey]: (photosToShow.value[monthKey] || 6) + 6
      }
    }

    const selectMonth = (year, month) => {
      photoStore.setFilter('all')
    }

    const toggleYear = (year) => {
      const newSet = new Set(expandedYears.value)
      if (newSet.has(year)) {
        newSet.delete(year)
      } else {
        newSet.add(year)
      }
      expandedYears.value = newSet
    }

    const toggleMonth = (year, month) => {
      const key = `${year}-${month}`
      const newSet = new Set(expandedMonths.value)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      expandedMonths.value = newSet
    }

    const openPhotoDetail = (photo) => {
      router.push({
        name: 'PhotoDetail',
        params: { id: photo.id }
      })
    }

    // ── 生命周期 ──
    onMounted(() => {
      if (timelineData.value.length > 0) {
        const latestYear = timelineData.value[0].year
        expandedYears.value = new Set([latestYear])
      }
    })

    return {
      viewMode,
      expandedYears,
      expandedMonths,
      photosToShow,
      timelineData,
      totalPhotos,
      totalYears,
      averagePhotosPerMonth,
      monthlyPhotos,
      sortedMonthlyPhotos,
      setViewMode,
      goToToday,
      formatMonth,
      formatDate,
      showMorePhotos,
      selectMonth,
      toggleYear,
      toggleMonth,
      openPhotoDetail
    }
  }
}
</script>

<style lang="scss" scoped>
.timeline-view {
  min-height: 100vh;
  padding-bottom: var(--spacing-xxl);
}

.timeline-header {
  text-align: center;
  padding: var(--spacing-xxl) 0 var(--spacing-xl);

  .page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .page-subtitle {
    font-size: 1.1rem;
    color: var(--text-muted);
    margin-bottom: var(--spacing-xl);
  }
}

.timeline-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);

  .view-modes {
    display: flex;
    gap: var(--spacing-xs);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--spacing-md);
  }
}

.timeline-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);

  .stat-item {
    background: var(--bg-secondary);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    text-align: center;
    box-shadow: var(--shadow-sm);

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: var(--spacing-xs);
    }

    .stat-label {
      font-size: 0.9rem;
      color: var(--text-muted);
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.timeline-content {
  .monthly-view {
    .month-section {
      margin-bottom: var(--spacing-xxl);

      .month-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-sm);
        border-bottom: 2px solid var(--primary-color);

        .month-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .month-count {
          font-size: 0.85rem;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 4px 12px;
          border-radius: var(--radius-full);
        }
      }

      .month-photos {
        column-count: 3;
        column-gap: var(--spacing-md);

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

        .show-more {
          break-inside: avoid;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 150px;
          background: var(--bg-secondary);
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-normal);
          margin-bottom: var(--spacing-md);

          &:hover {
            border-color: var(--primary-color);
            background: var(--bg-tertiary);
          }

          .show-more-content {
            text-align: center;
            color: var(--text-muted);

            .more-count {
              display: block;
              font-size: 1.5rem;
              font-weight: 600;
              color: var(--primary-color);
              margin-bottom: var(--spacing-xs);
            }

            .more-text {
              font-size: 0.85rem;
            }
          }
        }
      }
    }
  }

  .yearly-view {
    .year-section {
      margin-bottom: var(--spacing-xxl);

      .year-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-sm);
        border-bottom: 2px solid var(--secondary-color);

        .year-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .year-count {
          font-size: 0.85rem;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 4px 12px;
          border-radius: var(--radius-full);
        }
      }

      .year-months {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--spacing-md);

        .month-card {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);

          &:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
          }

          .month-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--spacing-sm);

            .month-name {
              font-size: 1.1rem;
              font-weight: 600;
              color: var(--text-primary);
            }

            .month-photo-count {
              font-size: 0.8rem;
              background: var(--primary-color);
              color: white;
              padding: 2px 8px;
              border-radius: var(--radius-full);
            }
          }

          .month-preview {
            width: 100%;
            height: 120px;
            border-radius: var(--radius-sm);
            overflow: hidden;
            background: var(--bg-tertiary);

            .preview-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .preview-placeholder {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--text-muted);

              .icon {
                width: 2rem;
                height: 2rem;
                opacity: 0.4;
              }
            }
          }
        }
      }
    }
  }

  .tree-view {
    .tree-container {
      .tree-year {
        margin-bottom: var(--spacing-xl);

        .tree-year-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--transition-normal);
          box-shadow: var(--shadow-sm);

          &:hover {
            background: var(--bg-tertiary);
          }

          .toggle-icon {
            width: 16px;
            height: 16px;
            color: var(--text-muted);
            transition: transform var(--transition-fast);
            flex-shrink: 0;

            &.expanded {
              transform: rotate(90deg);
            }
          }

          .year-label {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--text-primary);
          }

          .year-count {
            font-size: 0.9rem;
            color: var(--text-muted);
          }
        }

        .tree-year-content {
          margin-top: var(--spacing-md);
          margin-left: var(--spacing-lg);

          .tree-month {
            margin-bottom: var(--spacing-md);

            .tree-month-header {
              display: flex;
              align-items: center;
              gap: var(--spacing-sm);
              padding: var(--spacing-sm) var(--spacing-md);
              background: var(--bg-secondary);
              border-radius: var(--radius-sm);
              cursor: pointer;
              transition: background var(--transition-normal);

              &:hover {
                background: var(--bg-tertiary);
              }

              .toggle-icon {
                width: 14px;
                height: 14px;
                color: var(--text-muted);
                transition: transform var(--transition-fast);
                flex-shrink: 0;

                &.expanded {
                  transform: rotate(90deg);
                }
              }

              .month-label {
                font-weight: 500;
                color: var(--text-primary);
              }

              .month-count {
                font-size: 0.85rem;
                color: var(--text-muted);
              }
            }

            .tree-photos {
              margin-top: var(--spacing-sm);
              margin-left: var(--spacing-lg);
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
              gap: var(--spacing-sm);

              .tree-photo-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-sm);
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: all var(--transition-normal);

                &:hover {
                  background: var(--bg-tertiary);
                  transform: translateX(4px);
                }

                :deep(.tree-photo-thumb) {
                  width: 50px;
                  height: 50px;
                  object-fit: cover;
                  border-radius: var(--radius-sm);
                  flex-shrink: 0;
                }

                .tree-photo-info {
                  flex: 1;
                  min-width: 0;

                  .photo-title {
                    display: block;
                    font-size: 0.9rem;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-bottom: 2px;
                  }

                  .photo-date {
                    display: block;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                  }
                }
              }
            }
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
      }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .timeline-header {
    padding: var(--spacing-xl) 0 var(--spacing-lg);

    .page-title {
      font-size: 2rem;
    }
  }

  .yearly-view {
    .year-months {
      grid-template-columns: 1fr;
    }
  }

  .tree-view {
    .tree-container {
      .tree-year {
        .tree-year-content {
          margin-left: var(--spacing-sm);

          .tree-month {
            .tree-photos {
              grid-template-columns: 1fr;
              margin-left: var(--spacing-sm);
            }
          }
        }
      }
    }
  }
}
</style>
