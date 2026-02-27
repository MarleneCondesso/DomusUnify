import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Lê variáveis do `.env`/`.env.local` (se existirem).
  // Nota: o 3º parâmetro "" diz ao Vite para carregar todas as variáveis (incluindo VITE_*).
  const env = loadEnv(mode, process.cwd(), '')

  // URL do backend usado APENAS pelo proxy do Vite em desenvolvimento.
  // Isto evita precisares de configurar CORS no backend enquanto desenvolves localmente.
  const backendUrl = env.VITE_BACKEND_URL || 'https://localhost:7214'

  return {
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        // REST API (.NET) — ex.: /api/v1/...
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          // `secure: false` permite certificados self-signed (https://localhost) em dev
          secure: false,
        },

        // SignalR hubs — ex.: /hubs/family
        '/hubs': {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
          secure: false,
        },
      },
    },
  }
})
