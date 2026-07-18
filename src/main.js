import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './styles/main.scss'
import { usePhotoStore } from './stores/photoStore'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Gallery',
    component: () => import('./views/PhotoGallery.vue')
  },
  {
    path: '/photo/:id',
    name: 'PhotoDetail',
    component: () => import('./views/PhotoDetail.vue'),
    props: true
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('./views/TimelineView.vue')
  }
]

const router = createRouter({
  // 使用 Hash 模式，解决 Gitee Pages 刷新 404 和路径匹配问题
  history: createWebHashHistory(),
  routes
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

// 静态索引在首屏挂载前一次性初始化，避免先渲染空状态再整页重排。
usePhotoStore(pinia).initializePhotos()
app.mount('#app')

requestAnimationFrame(() => {
  document.getElementById('loading')?.remove()
  document.getElementById('app')?.classList.add('mounted')
})

// 使用部署基路径注册，避免 GitHub/Gitee Pages 子目录下请求到域名根目录。
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      console.warn('离线缓存启用失败:', error)
    })
  })
}
