import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Lê variáveis do `.env`/`.env.local` (se existirem).
  // Nota: o 3º parâmetro "" diz ao Vite para carregar todas as variáveis (incluindo VITE_*).
  const env = loadEnv(mode, process.cwd(), '')

  // URL do backend usado APENAS pelo proxy do Vite em desenvolvimento.
  // Isto evita precisares de configurar CORS no backend enquanto desenvolves localmente.
  const backendUrl = env.VITE_BACKEND_URL || 'https://localhost:7214'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-192x192.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          name: 'DomusUnify',
          short_name: 'DomusUnify',
          description: 'DomusUnify - family workspace (lists, calendar, budget).',
          theme_color: '#7c3aed',
          background_color: '#070510',
          display: 'standalone',
          lang: 'pt',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],

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
