import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

/**
 * TanStack React Query:
 * - Faz cache dos dados vindos do backend (server state)
 * - Gere loading/error states
 * - Permite invalidar/refazer queries quando chegam eventos em realtime (SignalR)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Evita "spam" de requests quando estamos a desenvolver.
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
)
