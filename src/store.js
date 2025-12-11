/* src/store.js */
import { reactive } from 'vue';

export const store = reactive({
    searchQuery: '', // 全局搜索词
    activeTab: 'home' // 当前选中的 Tab (用于 Sidebar 高亮)
});
