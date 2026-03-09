import { clearAuth, loadAuth, saveAuth, type StoredAuth } from './tokenStorage'

type AuthListener = (auth: StoredAuth | null) => void

export type AuthSessionPayload = {
  accessToken?: string | null
  expiresAtUtc?: string | Date | null
  refreshToken?: string | null
  refreshTokenExpiresAtUtc?: string | Date | null
}

const listeners = new Set<AuthListener>()
let refreshPromise: Promise<StoredAuth | null> | null = null

export function subscribeAuthState(listener: AuthListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getStoredAuth(): StoredAuth | null {
  return loadAuth()
}

export function persistAuthSession(payload: AuthSessionPayload): StoredAuth {
  const accessToken = normalizeToken(payload.accessToken)
  if (!accessToken) {
    throw new Error('Missing access token in auth session payload.')
  }

  const next: StoredAuth = {
    accessToken,
    expiresAtUtc: toIsoString(payload.expiresAtUtc),
    refreshToken: normalizeToken(payload.refreshToken),
    refreshTokenExpiresAtUtc: toIsoString(payload.refreshTokenExpiresAtUtc),
  }

  saveAuth(next)
  notify(next)
  return next
}

export function clearStoredAuthSession(): void {
  clearAuth()
  notify(null)
}

export function isTokenExpired(expiresAtUtc?: string | null, bufferSeconds = 0): boolean {
  if (!expiresAtUtc) return false

  const expiresAtMs = Date.parse(expiresAtUtc)
  if (Number.isNaN(expiresAtMs)) return false

  return expiresAtMs <= Date.now() + bufferSeconds * 1000
}

export async function ensureValidAccessToken(options: {
  forceRefresh?: boolean
  fallbackToken?: string | null
} = {}): Promise<string | null> {
  const { forceRefresh = false, fallbackToken = null } = options
  const auth = loadAuth()

  if (!auth?.accessToken) return fallbackToken
  if (!auth.refreshToken) return auth.accessToken
  if (!forceRefresh && !isTokenExpired(auth.expiresAtUtc, 60)) return auth.accessToken

  const refreshed = await refreshStoredAuthSession()
  return refreshed?.accessToken ?? null
}

export async function revokeRefreshToken(refreshToken?: string | null): Promise<void> {
  const normalizedToken = normalizeToken(refreshToken)
  if (!normalizedToken) return

  try {
    await fetch(buildAuthUrl('/api/v1/auth/logout'), {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ refreshToken: normalizedToken }),
    })
  } catch {
    // ignore best-effort logout failures
  }
}

async function refreshStoredAuthSession(): Promise<StoredAuth | null> {
  if (refreshPromise) return refreshPromise

  const auth = loadAuth()
  const refreshToken = normalizeToken(auth?.refreshToken)
  if (!auth?.accessToken || !refreshToken || isTokenExpired(auth.refreshTokenExpiresAtUtc)) {
    clearStoredAuthSession()
    return null
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(buildAuthUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          clearStoredAuthSession()
          return null
        }

        return auth
      }

      const payload = await response.json() as AuthSessionPayload
      return persistAuthSession(payload)
    } catch {
      return auth
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function notify(auth: StoredAuth | null): void {
  for (const listener of listeners) {
    listener(auth)
  }
}

function toIsoString(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined
  return typeof value === 'string' ? value : value.toISOString()
}

function normalizeToken(value: string | null | undefined): string | undefined {
  if (!value) return undefined

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function buildAuthUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path

  const origin = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim()?.replace(/\/+$/, '') ?? ''
  return origin ? `${origin}${path}` : path
}

function jsonHeaders(): Headers {
  const headers = new Headers()
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  return headers
}
