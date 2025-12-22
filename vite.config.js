import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression'
import process from "gh-pages/lib/git.js";

export default defineConfig(({ mode }) => {
    // 获取当前的环境变量
    const env = loadEnv(mode, process.cwd(), '')

    return {
        // 🚀 核心逻辑：自动判断环境
        // 如果检测到 VERCEL 环境变量，使用根路径 '/'
        // 否则（GitHub Pages），使用 '/你的仓库名/' (请把 chrono-frame 换成你真实的仓库名)
        base: env.VERCEL ? '/' : '/vue-photo-wall/',

        plugins: [
            vue(),
            viteCompression({
                verbose: true,
                disable: false,
                threshold: 10240,
                algorithm: 'gzip',
                ext: '.gz',
            })
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        build: {
            cssCodeSplit: true,
            chunkSizeWarningLimit: 500,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            if (id.includes('vue')) return 'vendor-vue';
                            if (id.includes('dayjs')) return 'vendor-dayjs';
                            return 'vendor-libs';
                        }
                    }
                }
            }
        }
    }
})