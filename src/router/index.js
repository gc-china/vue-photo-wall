import {createRouter, createWebHashHistory} from 'vue-router'
import Gallery from '../views/Gallery.vue'
import Albums from '../views/Albums.vue'
import PhotoDetail from '../views/PhotoDetail.vue' // 引入新组件
import Timeline from '../views/Timeline.vue' // 1. 引入新页面

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {path: '/', name: 'home', component: Gallery},
        {path: '/albums', name: 'albums', component: Albums},
        {path: '/timeline', name: 'timeline', component: Timeline}, // 2. 注册路由
        {path: '/category/:name', name: 'category', component: Gallery},
        {
            path: '/photo/:id', // 动态路由
            name: 'photo-detail',
            component: PhotoDetail
        }
    ]
})

export default router
