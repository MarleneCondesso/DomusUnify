import { domusApi } from '../api/domusApi'
import type { AppSettings } from './appSettings'

export type WebPushSyncStatus =
  | 'enabled'
  | 'disabled'
  | 'unsupported'
  | 'permission-default'
  | 'permission-denied'

type SyncOptions = {
  requestPermission?: boolean
}

export function supportsWebPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function syncWebPushSubscription(
  token: string,
  settings: AppSettings,
  options: SyncOptions = {},
): Promise<WebPushSyncStatus> {
  if (!supportsWebPush()) return 'unsupported'

  if (!settings.notificationsEnabled) {
    await unsubscribeWebPush(token)
    return 'disabled'
  }

  let permission = Notification.permission
  if (permission === 'default' && options.requestPermission) {
    permission = await Notification.requestPermission()
  }

  if (permission === 'denied') return 'permission-denied'
  if (permission !== 'granted') return 'permission-default'

  const registration = await navigator.serviceWorker.ready
  const publicKey = (await domusApi.getPushPublicKey(token)).publicKey.trim()
  const existingSubscription = await registration.pushManager.getSubscription()
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }))

  const subscriptionJson = subscription.toJSON()
  const p256Dh = subscriptionJson.keys?.p256dh?.trim() ?? ''
  const auth = subscriptionJson.keys?.auth?.trim() ?? ''
  if (!subscription.endpoint || !p256Dh || !auth) {
    throw new Error('Invalid push subscription.')
  }

  await domusApi.upsertPushSubscription(token, {
    endpoint: subscription.endpoint,
    p256Dh,
    auth,
    notificationsEnabled: true,
    listsEnabled: settings.notificationCategories.lists,
    budgetEnabled: settings.notificationCategories.budget,
    calendarEnabled: settings.notificationCategories.calendar,
    userAgent: navigator.userAgent,
  })

  return 'enabled'
}

export async function unsubscribeWebPush(token: string): Promise<void> {
  if (!supportsWebPush()) return

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  try {
    await domusApi.deletePushSubscription(token, subscription.endpoint)
  } catch {
    // ignore backend failures during local cleanup
  }

  try {
    await subscription.unsubscribe()
  } catch {
    // ignore local cleanup failures
  }
}

function urlBase64ToUint8Array(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }

  return output.buffer
}
