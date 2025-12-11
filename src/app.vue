<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Gallery from './components/Gallery.vue'; // 假设你的照片墙组件在这里

const route = useRoute();
const isDrawerOpen = ref(false);

// 切换抽屉状态
const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value;
};

// 关闭抽屉 (点击链接跳转或点击遮罩时)
const closeDrawer = () => {
  isDrawerOpen.value = false;
};

// 监听路由变化，跳转后自动关闭抽屉（优化手机体验）
watch(route, () => {
  closeDrawer();
});
</script>

<template>
  <div class="app-container">

    <header class="mobile-header">
      <button class="menu-btn" @click="toggleDrawer">
        <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <h1 class="mobile-title">ChronoFrame</h1>
    </header>

    <div
        class="drawer-overlay"
        :class="{ show: isDrawerOpen }"
        @click="closeDrawer"
    ></div>

    <aside class="sidebar" :class="{ open: isDrawerOpen }">
      <div class="brand">
        <div class="avatar">
          <img src="/avatar.jpg" alt="Logo" /> </div>
        <h2>ChronoFrame</h2>
        <p class="subtitle">Frozen moments in time.</p>
      </div>

      <nav class="nav-menu">
        <router-link to="/" class="nav-item active" @click="closeDrawer">
          <span class="icon">🖼️</span> 全部照片
        </router-link>
        <a href="#" class="nav-item" @click.prevent="closeDrawer">
          <span class="icon">📂</span> 根据分类
        </a>
        <a href="#" class="nav-item" @click.prevent="closeDrawer">
          <span class="icon">⏳</span> 时间归档
        </a>
      </nav>

      <footer class="sidebar-footer">
        © 2025 GC-China
      </footer>
    </aside>

    <main class="main-content">
      <router-view></router-view>
    </main>

  </div>
</template>

<style scoped>
/* --- 全局容器 --- */
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: #f4f4f4; /* 整体背景色 */
}

/* --- 侧边栏 (Desktop 默认样式) --- */
.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: fixed; /* 固定在左侧 */
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.brand {
  padding: 40px 20px;
  text-align: center;
}

.avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
}

.brand h2 { margin: 0; font-size: 1.2rem; color: #333; }
.subtitle { margin: 5px 0 0; color: #999; font-size: 0.8rem; font-style: italic; }

.nav-menu { flex: 1; padding: 20px; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 15px;
  color: #555; text-decoration: none;
  border-radius: 8px; margin-bottom: 5px;
  transition: background 0.2s;
}
.nav-item:hover { background: #f9f9f9; color: #000; }
.nav-item.active { background: #000; color: #fff; }

.sidebar-footer { padding: 20px; text-align: center; color: #ccc; font-size: 0.75rem; }

/* --- 主内容区 (Desktop) --- */
.main-content {
  flex: 1;
  margin-left: 260px; /* 留出侧边栏的宽度 */
  padding: 20px;
  min-height: 100vh;
}

/* --- 手机端顶部栏 (默认隐藏) --- */
.mobile-header { display: none; }
.drawer-overlay { display: none; }

/* =========================================
   📱 移动端适配 (宽度小于 768px 时触发)
   ========================================= */
@media (max-width: 768px) {

  /* 1. 改变布局方向 */
  .app-container { flex-direction: column; }

  /* 2. 显示手机顶部栏 */
  .mobile-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px; height: 60px;
    background: #fff; border-bottom: 1px solid #eee;
    position: sticky; top: 0; z-index: 90;
  }
  .menu-btn { background: none; border: none; cursor: pointer; padding: 5px; }
  .mobile-title { font-size: 1.1rem; margin: 0; font-weight: bold; }

  /* 3. 改造侧边栏为“抽屉” */
  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 280px; /* 抽屉宽度 */
    transform: translateX(-100%); /* 默认移出屏幕外 */
    z-index: 1000; /* 保证在最上层 */
    box-shadow: none;
  }

  /* 抽屉打开时的状态 */
  .sidebar.open {
    transform: translateX(0); /* 滑进来 */
    box-shadow: 5px 0 20px rgba(0,0,0,0.1);
  }

  /* 4. 遮罩层 */
  .drawer-overlay {
    display: block;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
    opacity: 0; pointer-events: none; /* 默认点透 */
    transition: opacity 0.3s;
    backdrop-filter: blur(2px);
  }
  .drawer-overlay.show {
    opacity: 1; pointer-events: auto; /* 打开时阻挡点击 */
  }

  /* 5. 主内容区去掉左边距 */
  .main-content {
    margin-left: 0;
    padding: 10px;
  }
}
</style>