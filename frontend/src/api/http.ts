/**
 * Camada HTTP do frontend.
 *
 * Objetivo:
 * - Centralizar a forma como chamamos o backend (REST).
 * - Adicionar automaticamente o header `Authorization: Bearer ...` quando existe token.
 * - Transformar respostas de erro (4xx/5xx) em exceções com status + body para o UI conseguir reagir.
 *
 * Nota sobre URLs:
 * - Em DEV usamos o proxy do Vite (`vite.config.ts`) e chamamos caminhos relativos (ex.: `/api/v1/...`).
 * - Se quiseres chamar o backend diretamente (sem proxy), define `VITE_API_ORIGIN` (ex.: `https://localhost:7214`).
 * - Em Capacitor, `VITE_API_ORIGIN` deve apontar para o backend real, porque a app corre em `capacitor://localhost`.
 */

import { Capacitor } from '@capacitor/core'
import { messagesByLanguage, type Language } from '../i18n/messages'

export class ApiError extends Error {
  public readonly status: number
  public readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type ApiRequestOptions = {
  method?: string
  token?: string | null
  json?: unknown
  signal?: AbortSignal
}

const APP_SETTINGS_STORAGE_KEY = 'domus.appSettings.v1'
const GENERIC_API_ERROR_KEY = 'common.unexpectedError' as const
let hasWarnedAboutNativeApiOrigin = false

export function getApiOrigin(): string | null {
  const origin = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim()
  if (!origin) return null
  return origin.replace(/\/+$/, '')
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path

  const origin = getApiOrigin()
  if (!origin) return path
  return `${origin}${path}`
}

export function validateNativeApiOrigin(): void {
  if (hasWarnedAboutNativeApiOrigin) return
  if (!Capacitor.isNativePlatform()) return
  if (getApiOrigin()) return

  hasWarnedAboutNativeApiOrigin = true
  console.warn(
    '[DomusUnify] VITE_API_ORIGIN is not defined. Native builds need an absolute backend origin; relative /api routes will fail inside Capacitor.',
  )
}

export type ApiDownloadResult = {
  blob: Blob
  fileName: string | null
  contentType: string | null
}

function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'pt' || value === 'zh'
}

function normalizeLanguageTag(tag: string): string {
  return tag.trim().toLowerCase()
}

function detectSystemLanguage(): Language {
  const candidates: string[] = []

  try {
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages)
    if (typeof navigator.language === 'string') candidates.push(navigator.language)
  } catch {
    // ignore
  }

  for (const c of candidates) {
    const tag = normalizeLanguageTag(c)
    if (!tag) continue

    if (tag.startsWith('pt')) return 'pt'
    if (tag.startsWith('zh')) return 'zh'
    if (tag.startsWith('en')) return 'en'
  }

  return 'en'
}

function detectPreferredLanguage(): Language {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_STORAGE_KEY)
    if (!raw) return detectSystemLanguage()

    const parsed = JSON.parse(raw) as { languageMode?: unknown } | null
    const mode = parsed?.languageMode

    if (mode === 'system' || mode == null) return detectSystemLanguage()
    if (isLanguage(mode)) return mode

    return detectSystemLanguage()
  } catch {
    return detectSystemLanguage()
  }
}

function genericApiErrorMessage(): string {
  const lang = detectPreferredLanguage()
  const table = messagesByLanguage[lang] ?? messagesByLanguage.en
  return table[GENERIC_API_ERROR_KEY] ?? messagesByLanguage.en[GENERIC_API_ERROR_KEY] ?? 'Unexpected error.'
}

async function readBody(response: Response): Promise<unknown> {
  // Tentamos ler como texto e, se possível, converter para JSON.
  const text = await response.text()
  if (!text) return undefined

  // Alguns endpoints podem devolver `text/plain` (ou sem content-type) com JSON/strings.
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Faz um pedido JSON ao backend.
 *
 * Regras:
 * - Se `json` estiver definido, envia `Content-Type: application/json` e faz `JSON.stringify`.
 * - Se existir `token`, envia `Authorization: Bearer {token}`.
 * - Se o status não for 2xx, lança `ApiError`.
 */
export async function apiRequest<TResponse>(
  path: string,
  { method = 'GET', token, json, signal }: ApiRequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers()
  headers.set('Accept', 'application/json')

  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body: string | undefined
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  }

  const response = await fetch(buildUrl(path), { method, headers, body, signal })

  // 204 = No Content (ex.: endpoints que só fazem "set" e não devolvem JSON)
  if (response.status === 204) return undefined as TResponse

  const parsed = await readBody(response)

  if (!response.ok) {
    throw new ApiError(genericApiErrorMessage(), response.status, parsed)
  }

  return parsed as TResponse
}

function parseFileNameFromContentDisposition(header: string | null): string | null {
  if (!header) return null

  const matchStar = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (matchStar?.[1]) {
    try {
      return decodeURIComponent(matchStar[1].trim().replace(/^"|"$/g, ''))
    } catch {
      return matchStar[1].trim().replace(/^"|"$/g, '')
    }
  }

  const match = header.match(/filename="?([^"]+)"?/i)
  return match?.[1]?.trim() ?? null
}

export async function apiDownload(
  path: string,
  { method = 'GET', token, signal }: Omit<ApiRequestOptions, 'json'> = {},
): Promise<ApiDownloadResult> {
  const headers = new Headers()
  headers.set('Accept', 'text/csv,application/octet-stream,*/*')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(buildUrl(path), { method, headers, signal })

  if (!response.ok) {
    const parsed = await readBody(response)
    throw new ApiError(genericApiErrorMessage(), response.status, parsed)
  }

  return {
    blob: await response.blob(),
    fileName: parseFileNameFromContentDisposition(response.headers.get('content-disposition')),
    contentType: response.headers.get('content-type'),
  }
}
