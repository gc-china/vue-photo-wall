import { reactive } from 'vue';

export const store = reactive({
    searchQuery: '',
    photos: [],
    loading: false,

    // 初始化数据的方法
    async initData() {
        // 如果已有数据，不再请求
        if (this.photos.length > 0) return;

        this.loading = true;
        try {
            // 🚀 核心优化：动态 import JSON
            // 只有执行这行代码时，浏览器才会去下载 photos.json
            // 这样 JSON 就不会占用首屏 JS 的体积了！
            const module = await import('@/assets/photos.json');

            // import 的 JSON 通常在 module.default 中
            this.photos = module.default || module;
        } catch (e) {
            console.error('数据加载失败', e);
        } finally {
            this.loading = false;
        }
    }
});