const EMOJI_PREFIX = 'emoji_'

export function encodeEmojiToIconKey(emoji: string): string | null {
  const trimmed = emoji.trim()
  if (!trimmed) return null

  const codePoints = Array.from(trimmed).map((ch) => ch.codePointAt(0))
  if (codePoints.some((cp) => cp === undefined)) return null

  const parts = codePoints.map((cp) => cp!.toString(16).toLowerCase())
  const iconKey = `${EMOJI_PREFIX}${parts.join('_')}`

  // Backend validates: ^[a-z0-9_-]{1,40}$
  if (!/^[a-z0-9_-]{1,40}$/.test(iconKey)) return null
  return iconKey
}

export function decodeEmojiIconKey(iconKey: string): string | null {
  const key = iconKey.trim().toLowerCase()
  if (!key.startsWith(EMOJI_PREFIX)) return null

  const raw = key.slice(EMOJI_PREFIX.length)
  if (!raw) return null

  const parts = raw.split('_').filter(Boolean)
  if (parts.length === 0) return null

  const codePoints: number[] = []
  for (const part of parts) {
    if (!/^[0-9a-f]+$/.test(part)) return null
    const cp = Number.parseInt(part, 16)
    if (!Number.isFinite(cp) || cp <= 0) return null
    codePoints.push(cp)
  }

  try {
    return String.fromCodePoint(...codePoints)
  } catch {
    return null
  }
}

export function iconKeyToEmoji(iconKey: string | null | undefined): string | null {
  if (!iconKey) return null
  const decoded = decodeEmojiIconKey(iconKey)
  if (decoded) return decoded
  if (iconKey.trim().toLowerCase() === 'tag') return '🏷️'
  return null
}

