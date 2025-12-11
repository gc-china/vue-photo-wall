import { createRouter, createWebHashHistory } from 'vue-router';
// 首页保持静态引入，保证速度
import Home from '../views/Gallery.vue';

const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    // 🚀 核心修复：添加这个缺失的路由
    // 当访问 /category/风景 时，依然使用 Home 组件，但会带上 params.name
    {
        path: '/category/:name',
        name: 'category',
        component: Home
    },
    {
        path: '/albums',
        name: 'albums',
        component: () => import('../views/Albums.vue')
    },
    {
        path: '/timeline',
        name: 'timeline',
        component: () => import('../views/Timeline.vue')
    },
    {
        path: '/photo/:id',
        name: 'photo-detail',
        component: () => import('../views/PhotoDetail.vue')
    }
];

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { top: 0 };
        }
    }
});

export default router;