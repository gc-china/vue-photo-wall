/* src/main.js */
import { createApp } from 'vue'
import './styles/theme.css' // Import global theme styles
import App from './App.vue'
import router from './router' // 引入路由

const app = createApp(App)
app.use(router) // 挂载路由
app.mount('#app')
