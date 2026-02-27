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
 */

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

function buildUrl(path: string): string {
  const origin = import.meta.env.VITE_API_ORIGIN as string | undefined
  if (!origin) return path
  return `${origin}${path}`
}

export type ApiDownloadResult = {
  blob: Blob
  fileName: string | null
  contentType: string | null
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
    throw new ApiError('Erro ao chamar a API.', response.status, parsed)
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
    throw new ApiError('Erro ao chamar a API.', response.status, parsed)
  }

  return {
    blob: await response.blob(),
    fileName: parseFileNameFromContentDisposition(response.headers.get('content-disposition')),
    contentType: response.headers.get('content-type'),
  }
}
