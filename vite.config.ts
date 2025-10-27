import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteMockServe } from 'vite-plugin-mock'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = mode === 'development' ? 'dev' : mode === 'test' ? 'test' : 'prod';
  
  return {
    plugins: [react(), tailwindcss(),
      viteMockServe({
        mockPath: 'mock',
        enable: env === 'dev',  // 只在开发环境启用 mock
        watchFiles: true,
        logger: true
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      host: true,
      open: true,  // 自动打开浏览器
      proxy: {
        '/api': {
          target: env === 'test' 
            ? 'http://127.0.0.1:8089'  // 测试环境API地址
            : env === 'prod'
              ? 'http://api.example.com'     // 生产环境API地址
              : 'http://localhost:8080',      // 开发环境API地址
          changeOrigin: true,
          rewrite: (path) => path // 保持 /api 路径不变
        }
      }
    }
  }
})
