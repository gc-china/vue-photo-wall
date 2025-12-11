<script setup>
import { useRoute } from 'vue-router';
import { store } from './store';

const route = useRoute();
</script>

<template>
  <div class="layout-container">
    <aside class="sidebar">
      <div class="sidebar-inner">
        <div class="profile-section">
          <div class="avatar-ring">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Avatar" />
          </div>
          <h1 class="brand-title">ChronoFrame</h1>
          <p class="brand-slogan">Frozen moments in time.</p>
        </div>

        <nav class="nav-menu">
          <router-link to="/" class="nav-item" :class="{ active: route.name === 'home' }">
            <span class="icon">📷</span> 全部照片
          </router-link>

          <router-link to="/albums" class="nav-item" :class="{ active: route.name === 'albums' }">
            <span class="icon">📂</span> 相册分类
          </router-link>

          <router-link to="/timeline" class="nav-item" :class="{ active: route.name === 'timeline' }">
            <span class="icon">⏳</span> 时间归档
          </router-link>
        </nav>

        <div class="search-section">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
                v-model="store.searchQuery"
                placeholder="Type to search..."
                type="text"
            />
          </div>
        </div>

        <div class="footer">
          © 2025 ChronoFrame<br>Designed by Vue3
        </div>
      </div>
    </aside>
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.layout-container { display: flex; height: 100vh; background: #f8f9fa; overflow: hidden; }

/* Sidebar 基础 */
.sidebar { width: 260px; flex-shrink: 0; background: #fff; border-right: 1px solid #eee; z-index: 10; }
.sidebar-inner { height: 100%; padding: 40px 24px; display: flex; flex-direction: column; }

/* 头像区 */
.profile-section { margin-bottom: 40px; text-align: center; }
.avatar-ring { width: 80px; height: 80px; margin: 0 auto 15px; border-radius: 50%; padding: 4px; border: 1px solid #eee; }
.avatar-ring img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.brand-title { font-family: 'Georgia', serif; font-size: 22px; color: #333; margin: 0; }
.brand-slogan { font-size: 12px; color: #999; margin-top: 5px; font-style: italic; }

/* 导航区 */
.nav-menu { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
.nav-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 16px;
  text-decoration: none; color: #666; font-size: 14px; border-radius: 8px;
  transition: all 0.2s; font-weight: 500;
}
.nav-item:hover { background: #f3f3f5; color: #000; }
.nav-item.active { background: #18181b; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.nav-item.active .icon { opacity: 1; }

/* 搜索框 (新样式) */
.search-section { margin-bottom: auto; /* 把它顶上去，让footer沉底 */ padding-top: 10px; border-top: 1px solid #f5f5f5; }
.search-input-wrapper {
  position: relative;
  background: #f1f5f9;
  border-radius: 20px; /* 胶囊形状 */
  display: flex; align-items: center; padding: 0 12px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}
.search-input-wrapper:focus-within {
  background: #fff;
  border-color: #18181b;
  box-shadow: 0 0 0 3px rgba(0,0,0,0.05);
}
.search-icon { color: #a1a1aa; flex-shrink: 0; }
.search-input-wrapper input {
  width: 100%; padding: 10px 8px; border: none; background: transparent;
  font-size: 13px; outline: none; color: #333;
}

.footer { margin-top: auto; font-size: 11px; color: #ccc; text-align: center; line-height: 1.5; }

.main-content { flex: 1; height: 100vh; overflow-y: auto; scroll-behavior: smooth; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 进场和离场的激活状态 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 进场开始状态：稍微下沉一点，透明 */
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* 离场结束状态：稍微上浮一点，透明 */
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
