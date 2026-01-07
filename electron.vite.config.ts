import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      emptyOutDir: true // 构建前清空 out 目录
    },
    resolve: {
      alias: {
        '@src': resolve('src')
      }
    }
  },
  preload: {},
  renderer: {
    build: {
      emptyOutDir: true // 构建前清空 dist 目录
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@src': resolve('src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
