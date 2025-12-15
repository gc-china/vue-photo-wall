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
        <keep-alive include="GalleryPage,TimelinePage">
          <component :is="Component"/>
        </keep-alive>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
body {
  margin: 0;
  padding: 0;
  background-color: #000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #000;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

/* --- Desktop 基础样式 (保持不变) --- */
.layout-container {
  display: flex;
  min-height: 100vh; /* 改为 min-height */
  background: #f8f9fa;
}

.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #eee;
  z-index: 100;

  /* 关键修改：让侧边栏钉在屏幕左侧，不随内容滚走 */
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto; /* 侧边栏自己内部可以滚 */
}

.sidebar-inner {
  height: 100%;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.profile-section {
  margin-bottom: 40px;
  text-align: center;
}

.avatar-ring {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  border-radius: 50%;
  padding: 4px;
  border: 1px solid #eee;
}

.avatar-ring img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.brand-title {
  font-family: 'Georgia', serif;
  font-size: 22px;
  color: #333;
  margin: 0;
}

.brand-slogan {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  font-style: italic;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  text-decoration: none;
  color: #666;
  font-size: 14px;
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-item:hover {
  background: #f3f3f5;
  color: #000;
}

.nav-item.active {
  background: #18181b;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-section {
  margin-bottom: auto;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
}

.search-input-wrapper {
  position: relative;
  background: #f1f5f9;
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.search-input-wrapper:focus-within {
  background: #fff;
  border-color: #18181b;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
}

.search-icon {
  color: #a1a1aa;
  flex-shrink: 0;
}

.search-input-wrapper input {
  width: 100%;
  padding: 10px 8px;
  border: none;
  background: transparent;
  font-size: 13px;
  outline: none;
  color: #333;
}

.footer {
  margin-top: auto;
  font-size: 11px;
  color: #ccc;
  text-align: center;
  line-height: 1.5;
}

.main-content {
  flex: 1;
  position: relative;
}

/* 默认隐藏手机端元素 */
.mobile-header {
  display: none;
}

.drawer-overlay {
  display: none;
}

.close-btn-mobile {
  display: none;
}

/* --- Mobile 响应式样式 --- */
@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
  }

  /* 1. 顶部导航栏：固定在顶部 */
  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 60px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 200;
  }

  .menu-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #333;
    padding: 0;
  }

  .mobile-title {
    font-weight: bold;
    font-family: 'Georgia', serif;
    font-size: 18px;
  }

  /* 给主内容加顶部内边距，防止被 header 挡住 */
  .main-content {
    margin-left: 0;
    padding-top: 60px; /* 留出 header 的高度 */
  }

  /* 2. 侧边栏抽屉化 */
  .sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    width: 280px;
    background: #ffffff;
    z-index: 1000;
    /* 默认移出屏幕左侧 */
    transform: translate3d(-100%, 0, 0);
    box-shadow: none;
    border-right: none;
  }

  /* 激活状态：滑入 */
  .sidebar.open {
    transform: translate3d(0, 0, 0);
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.15);
  }

  /* 手机端侧边栏内的关闭按钮 */
  .close-btn-mobile {
    display: block;
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
  }

  /* 3. 遮罩层 */
  .drawer-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    opacity: 0;
    pointer-events: none; /* 不显示时如果不加这个会挡住点击 */
    transition: opacity 0.3s ease;
    backdrop-filter: blur(2px);
  }

  /* 遮罩层激活 */
  .drawer-overlay.show {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
