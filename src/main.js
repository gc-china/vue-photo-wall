/* src/main.js */
import { createApp } from 'vue'
import './styles/theme.css' // Import global theme styles
import App from './App.vue'
import router from './router' // 引入路由

const app = createApp(App)

// --- 全局错误处理 (Global Error Handling) ---
app.config.errorHandler = (err, vm, info) => {
  console.error('[System Error] Global Error Handler Caught:', err);
  console.error('[System Error] Info:', info);
  // 在这里可以集成 Sentry 或其他日志上报服务
  // logErrorToService(err, info);
};

// --- Promise 未捕获异常处理 ---
window.addEventListener('unhandledrejection', (event) => {
  console.warn('[System Warning] Unhandled Promise Rejection:', event.reason);
  event.preventDefault();
});

app.use(router) // 挂载路由
app.mount('#app')
