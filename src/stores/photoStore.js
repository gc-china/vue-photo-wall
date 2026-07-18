import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
// 引入生成的照片数据
import photosData from '@/assets/photos.json'

/**
 * 日期格式化工具（原生 Date API，替代 moment.js）
 */

/** 格式化为 YYYY-MM-DD */
function formatDateKey(date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 格式化为 YYYY-MM */
function formatMonthKey(date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** 格式化为 YYYY */
function formatYearKey(date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return String(d.getFullYear())
}

/** 获取月份名称（中文） */
function getMonthName(date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const names = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ]
  return names[d.getMonth()]
}

export const usePhotoStore = defineStore('photo', () => {
  // ============================================================
  // 状态
  // ============================================================
  // 照片索引是扫描阶段生成的只读数据，使用浅响应避免深度代理全部元数据对象。
  const photos = shallowRef([])
  const categories = shallowRef([])
  const isLoading = ref(false)
  const currentFilter = ref('all')
  const searchQuery = ref('')
  const sortBy = ref('date')
  const sortOrder = ref('desc')
  const searchIndex = new Map()

  const indexPhoto = (photo) => {
    const metadata = photo.metadata || {}
    const date = new Date(photo.date)
    const sizeMatch = String(metadata.size || '').match(/([\d.]+)\s*(B|KB|MB|GB)?/i)
    const sizeUnits = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }
    const sizeBytes = sizeMatch
      ? Number(sizeMatch[1]) * (sizeUnits[(sizeMatch[2] || 'B').toUpperCase()] || 1)
      : 0

    searchIndex.set(photo.id, {
      text: [
        photo.title,
        photo.description,
        ...(photo.tags || []),
        photo.category,
        metadata.camera,
        metadata.location,
        !isNaN(date.getTime()) ? date.toLocaleDateString('zh-CN') : ''
      ].filter(Boolean).join(' ').toLowerCase(),
      dateValue: isNaN(date.getTime()) ? 0 : date.getTime(),
      sizeBytes
    })
  }

  // ============================================================
  // 计算属性
  // ============================================================

  /**
   * 过滤 + 搜索 + 排序后的照片列表
   */
  const filteredPhotos = computed(() => {
    let result = [...photos.value]

    // 分类筛选（基于 category 字段）
    if (currentFilter.value !== 'all') {
      result = result.filter(photo => photo.category === currentFilter.value)
    }

    // 搜索筛选
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      result = result.filter(photo => searchIndex.get(photo.id)?.text.includes(query))
    }

    // 排序
    result.sort((a, b) => {
      let aValue = a[sortBy.value]
      let bValue = b[sortBy.value]

      if (sortBy.value === 'date') {
        aValue = searchIndex.get(a.id)?.dateValue || 0
        bValue = searchIndex.get(b.id)?.dateValue || 0
      } else if (sortBy.value === 'title') {
        aValue = String(aValue || '').toLowerCase()
        bValue = String(bValue || '').toLowerCase()
        if (sortOrder.value === 'desc') return bValue.localeCompare(aValue)
        return aValue.localeCompare(bValue)
      } else if (sortBy.value === 'size') {
        aValue = searchIndex.get(a.id)?.sizeBytes || 0
        bValue = searchIndex.get(b.id)?.sizeBytes || 0
      }

      if (sortOrder.value === 'desc') {
        return bValue - aValue
      }
      return aValue - bValue
    })

    return result
  })

  /**
   * 按日期分组（YYYY-MM-DD）
   */
  const photosByDate = computed(() => {
    const grouped = {}
    filteredPhotos.value.forEach(photo => {
      const dateKey = formatDateKey(photo.date)
      if (!dateKey) return
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(photo)
    })
    return grouped
  })

  /**
   * 按月份分组（YYYY-MM）
   */
  const photosByMonth = computed(() => {
    const grouped = {}
    filteredPhotos.value.forEach(photo => {
      const monthKey = formatMonthKey(photo.date)
      if (!monthKey) return
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(photo)
    })
    return grouped
  })

  /**
   * 时间轴数据（年 -> 月 -> 照片）
   */
  const timelineData = computed(() => {
    const timeline = []
    const years = {}

    photos.value.forEach(photo => {
      const year = formatYearKey(photo.date)
      const month = String(new Date(photo.date).getMonth() + 1).padStart(2, '0')

      if (!year) return

      if (!years[year]) {
        years[year] = {
          year,
          months: {},
          count: 0
        }
      }

      if (!years[year].months[month]) {
        years[year].months[month] = {
          month,
          monthName: getMonthName(photo.date),
          photos: [],
          count: 0
        }
      }

      years[year].months[month].photos.push(photo)
      years[year].months[month].count++
      years[year].count++
    })

    // 转换为数组并排序
    Object.values(years).forEach(yearData => {
      yearData.months = Object.values(yearData.months).sort((a, b) => b.month - a.month)
      timeline.push(yearData)
    })

    return timeline.sort((a, b) => b.year - a.year)
  })

  // ============================================================
  // 方法
  // ============================================================

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const setPhotos = (newPhotos) => {
    searchIndex.clear()
    newPhotos.forEach(indexPhoto)
    photos.value = newPhotos
  }

  const addPhoto = (photo) => {
    indexPhoto(photo)
    photos.value = [...photos.value, photo]
  }

  const updatePhoto = (id, updates) => {
    const index = photos.value.findIndex(p => p.id === id)
    if (index !== -1) {
      const updated = { ...photos.value[index], ...updates }
      indexPhoto(updated)
      photos.value = photos.value.map((photo, photoIndex) => photoIndex === index ? updated : photo)
    }
  }

  const deletePhoto = (id) => {
    const index = photos.value.findIndex(p => p.id === id)
    if (index !== -1) {
      searchIndex.delete(id)
      photos.value = photos.value.filter((_, photoIndex) => photoIndex !== index)
    }
  }

  const setFilter = (filter) => {
    currentFilter.value = filter
  }

  const setSearchQuery = (query) => {
    searchQuery.value = query
  }

  const setSort = (by, order) => {
    sortBy.value = by
    sortOrder.value = order
  }

  const getPhotoById = (id) => {
    return photos.value.find(photo => photo.id === id)
  }

  const getPhotosByCategory = (category) => {
    return photos.value.filter(photo => photo.category === category)
  }

  const getPhotosByDateRange = (startDate, endDate) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    return photos.value.filter(photo => {
      const photoDate = new Date(photo.date).getTime()
      return photoDate >= start && photoDate <= end
    })
  }

  /**
   * 从照片的 category 字段生成分类列表
   * @param {Array} photoList
   */
  const generateCategories = (photoList) => {
    const categoryMap = new Map()

    photoList.forEach(photo => {
      const categoryName = photo.category
      if (!categoryName) return

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          id: categoryName,
          name: categoryName,
          path: categoryName,
          level: 0,
          parent: null,
          count: 0,
          photos: []
        })
      }

      const category = categoryMap.get(categoryName)
      category.count++
      category.photos.push(photo)
    })

    categories.value = Array.from(categoryMap.values())
  }

  /**
   * 初始化照片数据
   */
  const initializePhotos = () => {
    setLoading(true)
    try {
      if (photosData && photosData.length > 0) {
        setPhotos(photosData)
        generateCategories(photosData)
      } else {
        console.warn('photos.json 为空或未找到。请先运行 "node scan.js"')
        setPhotos([])
      }
    } catch (error) {
      console.error('初始化照片数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    // 状态
    photos,
    categories,
    isLoading,
    currentFilter,
    searchQuery,
    sortBy,
    sortOrder,

    // 计算属性
    filteredPhotos,
    photosByDate,
    photosByMonth,
    timelineData,

    // 方法
    setLoading,
    setPhotos,
    addPhoto,
    updatePhoto,
    deletePhoto,
    setFilter,
    setSearchQuery,
    setSort,
    getPhotoById,
    getPhotosByCategory,
    getPhotosByDateRange,
    initializePhotos
  }
})
