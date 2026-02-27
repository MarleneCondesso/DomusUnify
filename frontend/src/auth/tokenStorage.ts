/**
 * Persistência simples do token JWT no browser (localStorage).
 *
 * Porquê localStorage?
 * - Para um MVP é o mais simples: mantém sessão entre refreshs.
 * - Em produção, dependendo do teu modelo de segurança, podes preferir cookies httpOnly (BFF) ou outra estratégia.
 */

const TOKEN_KEY = 'domusunify:access_token'
const EXPIRES_AT_KEY = 'domusunify:expires_at_utc'

export type StoredAuth = {
  accessToken: string
  expiresAtUtc?: string
}

export function loadAuth(): StoredAuth | null {
  const accessToken = localStorage.getItem(TOKEN_KEY)
  if (!accessToken) return null

  const expiresAtUtc = localStorage.getItem(EXPIRES_AT_KEY) || undefined
  return { accessToken, expiresAtUtc }
}

export function saveAuth(auth: StoredAuth): void {
  localStorage.setItem(TOKEN_KEY, auth.accessToken)

  if (auth.expiresAtUtc) localStorage.setItem(EXPIRES_AT_KEY, auth.expiresAtUtc)
  else localStorage.removeItem(EXPIRES_AT_KEY)
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

