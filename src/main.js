import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './styles/main.scss'

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
app.mount('#app')