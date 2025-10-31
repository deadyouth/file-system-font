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
    esbuild: {
      drop: env === 'prod' ? ['console', 'debugger'] : [],  // 只在生产环境移除 console
    },
    build: {
      minify: env === 'prod',  // 只在生产环境压缩
      sourcemap: env !== 'prod'  // 非生产环境保留 sourcemap
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // port: 3000,
      host: true,
      open: true,  // 自动打开浏览器
      cors: true,  // 启用 CORS
      strictPort: true,  // 端口被占用时直接报错
      hmr: {
        overlay: true  // 显示错误覆盖层
      },
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
