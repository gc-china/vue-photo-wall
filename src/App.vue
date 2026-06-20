<template>
  <div class="app-container" :class="{ 'dark-theme': isDarkTheme }">
    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="container">
        <nav class="navbar">
          <div class="nav-brand">
            <svg class="icon brand-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 2L7.5 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.5L15 2H9zm3 4a6 6 0 110 12 6 6 0 010-12z" />
            </svg>
            <div class="brand-text">
              <h1 class="brand-title">照片时光机</h1>
              <p class="brand-subtitle">记录美好瞬间</p>
            </div>
          </div>

          <div class="nav-actions">
            <router-link to="/" class="nav-link" active-class="active">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
              </svg>
              <span>相册</span>
            </router-link>
            <router-link to="/timeline" class="nav-link" active-class="active">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" />
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              <span>时光轴</span>
            </router-link>
            <button class="theme-toggle" @click="toggleTheme" :title="isDarkTheme ? '切换亮色主题' : '切换暗色主题'">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" v-if="isDarkTheme">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM12 2v3M12 19v3M2 12h3M19 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
              </svg>
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" v-else>
                <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部信息 -->
    <footer class="app-footer">
      <div class="container">
        <p>&copy; 2024 Vue Photo Gallery · Built with Vue.js</p>
      </div>
    </footer>

    <!-- 全局加载指示器 -->
    <div v-if="isLoading" class="global-loading">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <p>正在加载照片...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { usePhotoStore } from './stores/photoStore'

export default {
  name: 'App',
  setup() {
    const photoStore = usePhotoStore()
    const isDarkTheme = ref(false)
    const isLoading = computed(() => photoStore.isLoading)

    // 切换主题
    const toggleTheme = () => {
      isDarkTheme.value = !isDarkTheme.value
      localStorage.setItem('darkTheme', isDarkTheme.value)
      document.documentElement.setAttribute('data-theme', isDarkTheme.value ? 'dark' : 'light')
    }

    // 初始化主题
    onMounted(() => {
      const savedTheme = localStorage.getItem('darkTheme')
      if (savedTheme !== null) {
        isDarkTheme.value = savedTheme === 'true'
      } else {
        // 检测系统主题偏好
        isDarkTheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      document.documentElement.setAttribute('data-theme', isDarkTheme.value ? 'dark' : 'light')

      // 初始化照片数据
      photoStore.initializePhotos()
    })

    return {
      isDarkTheme,
      isLoading,
      toggleTheme
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  transition: background var(--transition-normal), border-color var(--transition-normal);
}

[data-theme='dark'] .app-header {
  background: rgba(17, 23, 26, 0.72);
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  gap: var(--spacing-lg);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  .brand-icon {
    width: 22px;
    height: 22px;
    color: #ffffff;
    background: var(--primary-gradient);
    border-radius: 12px;
    padding: 8px;
    box-shadow: var(--shadow-sm);
  }

  .brand-text {
    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .brand-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.2;
    }
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);

  .nav-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 8px 16px;
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: var(--font-weight-medium);
    position: relative;
    transition: all var(--transition-fast);

    .icon {
      width: 18px;
      height: 18px;
    }

    &:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      transform: translateY(-1px);
    }

    &.active {
      background: rgba(61, 122, 140, 0.08);
      color: var(--primary-color);

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 60%;
        height: 2px;
        background: var(--primary-color);
        border-radius: var(--radius-full);
      }
    }
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-spring);

    .icon {
      width: 18px;
      height: 18px;
    }

    &:hover {
      background: var(--bg-tertiary);
      color: var(--primary-color);
      border-color: var(--primary-light);
      transform: rotate(15deg);
    }

    &:active {
      transform: rotate(15deg) scale(0.92);
    }
  }
}

.app-main {
  flex: 1;
  padding: var(--spacing-lg) 0;
}

.app-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  border-image: linear-gradient(to right, transparent, var(--border-color), transparent) 1;
  padding: var(--spacing-lg) 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  transition: background var(--transition-normal), border-color var(--transition-normal);
}

.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
  backdrop-filter: blur(5px);
}

.loading-overlay {
  background: var(--bg-secondary);
  padding: var(--spacing-xxl);
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: var(--shadow-lg);

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
    color: var(--text-secondary);
    font-size: 1.1rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .navbar {
    height: auto;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
  }

  .nav-actions {
    .nav-link {
      padding: 8px 12px;
      font-size: 0.85rem;

      span:last-child {
        display: none;
      }
    }
  }

  .app-main {
    padding: var(--spacing-md) 0;
  }
}
</style>
