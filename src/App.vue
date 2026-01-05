<script setup>
import {ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import {store} from './store';

const route = useRoute();

// --- 手机端抽屉逻辑 ---
const isDrawerOpen = ref(false);

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value;
};

const closeDrawer = () => {
  isDrawerOpen.value = false;
};

// 路由变化时自动关闭抽屉
watch(() => route.path, () => {
  closeDrawer();
});
</script>

<template>
  <div class="layout-container">

    <header class="mobile-header">
      <button class="menu-btn" @click="toggleDrawer">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <span class="mobile-title">YuCheng</span>
      <div style="width: 24px;"></div>
    </header>

    <div class="drawer-overlay" :class="{ show: isDrawerOpen }" @click="closeDrawer"></div>

    <aside class="sidebar" :class="{ open: isDrawerOpen }">
      <div class="sidebar-inner">

        <button class="close-btn-mobile" @click="closeDrawer">×</button>

        <div class="profile-section">
          <div class="avatar-ring">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Avatar"/>
          </div>
          <h1 class="brand-title">YuCheng</h1>
          <p class="brand-slogan">记录美好瞬间</p>
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
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
                v-model="store.searchQuery"
                placeholder="Type to search..."
                type="text"
            />
          </div>
        </div>

      </div>
    </aside>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive include="GalleryPage,TimelinePage">
            <component :is="Component"/>
          </keep-alive>
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  padding: 0;
  background-color: var(--bg-body);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.3s, color 0.3s;
}

:global(::-webkit-scrollbar) {
  width: 8px;
}

:global(::-webkit-scrollbar-track) {
  background: var(--scrollbar-track);
}

:global(::-webkit-scrollbar-thumb) {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

:global(::-webkit-scrollbar-thumb:hover) {
  background: var(--scrollbar-thumb-hover);
}

/* --- Layout --- */
.layout-container {
  display: flex;
  min-height: 100vh;
  background: var(--bg-layout);
  transition: background-color 0.3s;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  z-index: 50;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  transition: background-color 0.3s, border-color 0.3s;
}

.sidebar-inner {
  height: 100%;
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
}

.profile-section {
  margin-bottom: 48px;
  text-align: left;
}

.avatar-ring {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.avatar-ring img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-title {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.brand-slogan {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 400;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 40px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 15px;
  border-radius: 12px;
  transition: all 0.2s ease;
  font-weight: 500;
  border: 1px solid transparent;
}

.nav-item:hover {
  background: var(--nav-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--nav-active);
  color: var(--bg-sidebar);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-item .icon {
  font-size: 18px;
}

.search-section {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.search-input-wrapper {
  position: relative;
  background: var(--input-bg);
  border-radius: 14px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  height: 44px;
}

.search-input-wrapper:focus-within {
  background: var(--bg-sidebar);
  border-color: var(--text-primary);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
}

.search-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.search-input-wrapper input {
  width: 100%;
  padding: 0 10px;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  color: var(--input-text);
  height: 100%;
}

.main-content {
  flex: 1;
  position: relative;
  width: 100%;
}

/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile Header */
.mobile-header {
  display: none;
}

.drawer-overlay {
  display: none;
}

.close-btn-mobile {
  display: none;
}

/* --- Mobile Responsive --- */
@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
  }

  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 64px;
    background: var(--bg-sidebar);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-color);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }

  .menu-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-primary);
    padding: 8px;
    margin-left: -8px;
  }

  .mobile-title {
    font-weight: 600;
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    color: var(--text-primary);
  }

  .main-content {
    margin-left: 0;
    padding-top: 64px;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 300px;
    background: var(--bg-sidebar);
    z-index: 1000;
    transform: translate3d(-100%, 0, 0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s;
    box-shadow: none;
    border-right: none;
  }

  .sidebar.open {
    transform: translate3d(0, 0, 0);
    box-shadow: 10px 0 40px rgba(0, 0, 0, 0.1);
  }

  .close-btn-mobile {
    display: block;
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    font-size: 28px;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 10px;
  }

  .drawer-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 999;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    backdrop-filter: blur(4px);
  }

  .drawer-overlay.show {
    opacity: 1;
    pointer-events: auto;
  }
  
  .profile-section {
    text-align: center;
    margin-top: 20px;
  }
  
  .avatar-ring {
    margin: 0 auto 16px;
  }
}
</style>