import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor, registerPlugin } from '@capacitor/core'

type WidgetBridgeState = {
  accessToken?: string | null
  familyId?: string | null
  apiOrigin?: string | null
}

type WidgetBridgePlugin = {
  syncState(options: WidgetBridgeState): Promise<void>
  clearState(): Promise<void>
  refreshWidgets(): Promise<void>
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge', {
  web: () => import('./widgetBridge.web').then((m) => new m.WidgetBridgeWeb()),
})

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export async function syncNativeWidgetState(state: WidgetBridgeState): Promise<void> {
  if (!isNativeApp()) return
  await WidgetBridge.syncState(state)
}

export async function clearNativeWidgetState(): Promise<void> {
  if (!isNativeApp()) return
  await WidgetBridge.clearState()
}

export async function refreshNativeWidgets(): Promise<void> {
  if (!isNativeApp()) return
  await WidgetBridge.refreshWidgets()
}

export async function attachNativeDeepLinkListener(
  onNavigate: (target: string) => void,
): Promise<() => void> {
  if (!isNativeApp()) return () => undefined

  const navigateFromUrl = (url: string | null | undefined) => {
    const target = normalizeNativeTarget(url)
    if (target) onNavigate(target)
  }

  const launch = await CapacitorApp.getLaunchUrl()
  navigateFromUrl(launch?.url)

  const listener = await CapacitorApp.addListener('appUrlOpen', (event) => {
    navigateFromUrl(event.url)
  })

  return () => {
    void listener.remove()
  }
}

function normalizeNativeTarget(url: string | null | undefined): string | null {
  const trimmed = url?.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const explicitTarget = parsed.searchParams.get('target')
    if (explicitTarget) return normalizeRoute(explicitTarget)

    if (parsed.hash) return normalizeRoute(parsed.hash)

    return normalizeRoute(`${parsed.pathname}${parsed.search}${parsed.hash}`)
  } catch {
    return normalizeRoute(trimmed)
  }
}

function normalizeRoute(route: string): string | null {
  const trimmed = route.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('/#/')) return trimmed.slice(2)
  if (trimmed.startsWith('#/')) return trimmed.slice(1)
  if (trimmed.startsWith('#')) return normalizeRoute(trimmed.slice(1))

  if (/^[a-z]+:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed)
      const explicitTarget = parsed.searchParams.get('target')
      if (explicitTarget) return normalizeRoute(explicitTarget)
      if (parsed.hash) return normalizeRoute(parsed.hash)
      return normalizeRoute(`${parsed.pathname}${parsed.search}${parsed.hash}`)
    } catch {
      return null
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}
