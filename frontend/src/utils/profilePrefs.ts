import { useCallback, useEffect, useMemo, useState } from 'react'

export type ProfileGender = 'female' | 'male' | 'other' | null

export type UserProfilePrefs = {
  displayName: string | null
  profileColorHex: string | null
  birthday: string | null // YYYY-MM-DD
  gender: ProfileGender
  phone: string | null
  address: string | null
}

const STORAGE_PREFIX = 'domus.profilePrefs.v1.'

const DEFAULT_PREFS: UserProfilePrefs = {
  displayName: null,
  profileColorHex: '#8b5cf6',
  birthday: null,
  gender: null,
  phone: null,
  address: null,
}

function readPrefs(userId: string): UserProfilePrefs {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<UserProfilePrefs> | null
    if (!parsed || typeof parsed !== 'object') return DEFAULT_PREFS

    return {
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : DEFAULT_PREFS.displayName,
      profileColorHex: typeof parsed.profileColorHex === 'string' ? parsed.profileColorHex : DEFAULT_PREFS.profileColorHex,
      birthday: typeof parsed.birthday === 'string' ? parsed.birthday : DEFAULT_PREFS.birthday,
      gender: parsed.gender === 'female' || parsed.gender === 'male' || parsed.gender === 'other' ? parsed.gender : DEFAULT_PREFS.gender,
      phone: typeof parsed.phone === 'string' ? parsed.phone : DEFAULT_PREFS.phone,
      address: typeof parsed.address === 'string' ? parsed.address : DEFAULT_PREFS.address,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

function writePrefs(userId: string, prefs: UserProfilePrefs) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

export function useProfilePrefs(userId: string | null) {
  const [prefs, setPrefs] = useState<UserProfilePrefs>(() => (userId ? readPrefs(userId) : DEFAULT_PREFS))

  useEffect(() => {
    if (!userId) return
    setPrefs(readPrefs(userId))
  }, [userId])

  useEffect(() => {
    if (!userId) return
    writePrefs(userId, prefs)
  }, [prefs, userId])

  const updatePrefs = useCallback((patch: Partial<UserProfilePrefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch }))
  }, [])

  return useMemo(() => ({ prefs, setPrefs, updatePrefs }), [prefs, updatePrefs])
}

