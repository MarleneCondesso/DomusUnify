/// <reference lib="WebWorker" />

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & typeof globalThis & {
  __WB_MANIFEST: Array<PrecacheEntry | string>
}

const sw = self

cleanupOutdatedCaches()
sw.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)

type PushPayload = {
  title?: string
  body?: string
  url?: string
  tag?: string
  icon?: string
  badge?: string
}

self.addEventListener('push', (event: PushEvent) => {
  const payload = parsePushPayload(event.data)
  const title = payload.title?.trim() || 'DomusUnify'
  const body = payload.body?.trim() || ''
  const url = payload.url?.trim() || '/#/'

  event.waitUntil(
    sw.registration.showNotification(title, {
      body,
      tag: payload.tag?.trim() || undefined,
      icon: payload.icon?.trim() || '/pwa-192x192.png',
      badge: payload.badge?.trim() || '/pwa-192x192.png',
      data: { url },
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl = normalizeAppUrl(event.notification.data?.url)

  event.waitUntil((async () => {
    const windows = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows[0]

    if (existing) {
      await existing.navigate(targetUrl)
      await existing.focus()
      return
    }

    await sw.clients.openWindow(targetUrl)
  })())
})

function parsePushPayload(data: PushMessageData | null): PushPayload {
  if (!data) return {}

  try {
    return data.json() as PushPayload
  } catch {
    return { body: data.text() }
  }
}

function normalizeAppUrl(path: unknown): string {
  const value = typeof path === 'string' && path.trim() ? path.trim() : '/#/'
  return new URL(value, sw.location.origin).toString()
}
