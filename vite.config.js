import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: 'localhost',
    strictPort: false,
    hmr: {
      port: 3000,
      host: 'localhost'
    },
    watch: {
      usePolling: false
    }
  },
  base: './' // 使用相对路径，适配任意部署环境
})