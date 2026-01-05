import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
    // 🛠️ 修复核心：不使用 process.cwd()，改用标准 ESM 方式获取当前根目录
    // 这样在 Vercel 环境下绝对安全
    const root = fileURLToPath(new URL('.', import.meta.url))

    // 加载环境变量
    const env = loadEnv(mode, root, '')

    return {
        // 🚀 核心逻辑：自动判断环境
        // 如果检测到 VERCEL 环境变量，使用根路径 '/'
        // 否则（GitHub Pages），使用 '/vue-photo-wall/'
        base: '/',

        plugins: [
            vue(),
            viteCompression({
                verbose: true,
                disable: false,
                threshold: 10240,
                algorithm: 'gzip',
                ext: '.gz',
            }),
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['avatar.svg', 'photos.json'],
              manifest: {
                name: 'YuCheng Photo Wall',
                short_name: 'YuCheng',
                description: 'A personal photo gallery',
                theme_color: '#ffffff',
                icons: [
                  {
                    src: 'avatar.svg',
                    sizes: '192x192',
                    type: 'image/svg+xml'
                  },
                  {
                    src: 'avatar.svg',
                    sizes: '512x512',
                    type: 'image/svg+xml'
                  }
                ]
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/photos/'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'image-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                            }
                        }
                    }
                ]
              }
            })
        ],
        test: {
            environment: 'happy-dom',
            globals: true,
        },
        resolve: {
            alias: {
                // 这里也复用了上面的逻辑，保持一致
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