import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthPage } from './features/auth/AuthPage'
import { FamilyGatePage } from './features/family/FamilyGatePage'
import { clearAuth, loadAuth, saveAuth } from './auth/tokenStorage'
import type { AuthResponse } from './api/domusApi'
import { getApiOrigin, validateNativeApiOrigin } from './api/http'
import { useAppSettings } from './utils/appSettings'
import { syncWebPushSubscription, unsubscribeWebPush } from './utils/webPush'
import { attachNativeDeepLinkListener, clearNativeWidgetState, syncNativeWidgetState } from './native/widgetBridge'

function App() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const { settings } = useAppSettings()

  // Token do utilizador (JWT). É a base para chamar endpoints protegidos (Authorize).
  const [token, setToken] = useState<string | null>(() => loadAuth()?.accessToken ?? null)

  useEffect(() => {
    validateNativeApiOrigin()
  }, [])

  useEffect(() => {
    let cleanup: () => void = () => undefined
    let disposed = false

    void attachNativeDeepLinkListener((target) => {
      navigate(target, { replace: true })
    }).then((nextCleanup) => {
      if (disposed) {
        nextCleanup()
        return
      }

      cleanup = nextCleanup
    })

    return () => {
      disposed = true
      cleanup()
    }
  }, [navigate])

  useEffect(() => {
    if (!token) return

    void syncWebPushSubscription(token, settings).catch(() => undefined)
  }, [
    settings.notificationsEnabled,
    settings.notificationCategories.budget,
    settings.notificationCategories.calendar,
    settings.notificationCategories.lists,
    token,
  ])

  useEffect(() => {
    if (!token) return

    void syncNativeWidgetState({
      accessToken: token,
      apiOrigin: getApiOrigin(),
    }).catch(() => undefined)
  }, [token])

  function onAuthenticated(auth: AuthResponse) {
    if (!auth.accessToken) {
      // OpenAPI marca como nullable; na prática o backend deve devolver sempre token.
      throw new Error('Resposta de auth sem accessToken.')
    }

    // Limpa cache anterior (caso mudes de utilizador)
    queryClient.clear()

    saveAuth({ accessToken: auth.accessToken, expiresAtUtc: auth.expiresAtUtc })
    setToken(auth.accessToken)

    // MantÃ©m a rota atual (ex.: /invite/:token) para permitir aceitar convites logo apÃ³s login.
    navigate(`${location.pathname}${location.search}`, { replace: true })
  }

  async function onLogout() {
    const currentToken = token
    if (currentToken) {
      await unsubscribeWebPush(currentToken).catch(() => undefined)
    }

    await clearNativeWidgetState().catch(() => undefined)

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
