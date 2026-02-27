import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AuthPage } from './features/auth/AuthPage'
import { FamilyGatePage } from './features/family/FamilyGatePage'
import { clearAuth, loadAuth, saveAuth } from './auth/tokenStorage'
import type { AuthResponse } from './api/domusApi'

function App() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Token do utilizador (JWT). É a base para chamar endpoints protegidos (Authorize).
  const [token, setToken] = useState<string | null>(() => loadAuth()?.accessToken ?? null)

  function onAuthenticated(auth: AuthResponse) {
    if (!auth.accessToken) {
      // OpenAPI marca como nullable; na prática o backend deve devolver sempre token.
      throw new Error('Resposta de auth sem accessToken.')
    }

    // Limpa cache anterior (caso mudes de utilizador)
    queryClient.clear()

    saveAuth({ accessToken: auth.accessToken, expiresAtUtc: auth.expiresAtUtc })
    setToken(auth.accessToken)
    navigate('/', { replace: true })
  }

  function onLogout() {
    clearAuth()
    queryClient.clear()
    setToken(null)
    navigate('/', { replace: true })
  }

  return (
    <main className="min-h-full flex w-full">
      {!token ? (
        <AuthPage onAuthenticated={onAuthenticated} />
      ) : (
        <FamilyGatePage token={token} onLogout={onLogout} />
      )}
    </main>
  )
}

export default App
