import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthPage } from './features/auth/AuthPage'
import { FamilyGatePage } from './features/family/FamilyGatePage'
import { loadAuth, type StoredAuth } from './auth/tokenStorage'
import type { AuthResponse } from './api/domusApi'
import { getApiOrigin, validateNativeApiOrigin } from './api/http'
import { useAppSettings } from './utils/appSettings'
import { syncWebPushSubscription, unsubscribeWebPush } from './utils/webPush'
import { attachNativeDeepLinkListener, clearNativeWidgetState, syncNativeWidgetState } from './native/widgetBridge'
import {
  clearStoredAuthSession,
  ensureValidAccessToken,
  persistAuthSession,
  revokeRefreshToken,
  subscribeAuthState,
} from './auth/sessionManager'

function App() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const { settings } = useAppSettings()

  // Token do utilizador (JWT). É a base para chamar endpoints protegidos (Authorize).
  const [auth, setAuth] = useState<StoredAuth | null>(() => loadAuth())
  const token = auth?.accessToken ?? null

  useEffect(() => {
    validateNativeApiOrigin()
  }, [])

  useEffect(() => subscribeAuthState(setAuth), [])

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
    if (!token) {
      void clearNativeWidgetState().catch(() => undefined)
      return
    }

    void syncNativeWidgetState({
      accessToken: token,
      apiOrigin: getApiOrigin(),
    }).catch(() => undefined)
  }, [token])

  useEffect(() => {
    if (!auth?.accessToken) return

    void ensureValidAccessToken({ fallbackToken: auth.accessToken }).catch(() => undefined)
  }, [auth?.accessToken, auth?.expiresAtUtc, auth?.refreshToken, auth?.refreshTokenExpiresAtUtc])

  useEffect(() => {
    if (!token) queryClient.clear()
  }, [queryClient, token])

  function onAuthenticated(auth: AuthResponse) {
    if (!auth.accessToken) {
      // OpenAPI marca como nullable; na prática o backend deve devolver sempre token.
      throw new Error('Resposta de auth sem accessToken.')
    }

    // Limpa cache anterior (caso mudes de utilizador)
    queryClient.clear()

    persistAuthSession(auth)

    // MantÃ©m a rota atual (ex.: /invite/:token) para permitir aceitar convites logo apÃ³s login.
    navigate(`${location.pathname}${location.search}`, { replace: true })
  }

  function onLogout() {
    const currentToken = auth?.accessToken ?? null
    const currentRefreshToken = auth?.refreshToken ?? null

    clearStoredAuthSession()
    queryClient.clear()
    navigate('/', { replace: true })

    void clearNativeWidgetState().catch(() => undefined)

    if (currentToken) {
      void unsubscribeWebPush(currentToken).catch(() => undefined)
    }

    if (currentRefreshToken) {
      void revokeRefreshToken(currentRefreshToken)
    }
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
