import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { domusApi } from '../../api/domusApi'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'

type Props = {
  token: string
}

type PreparedInviteMessage = {
  contact: string
  kind: 'email' | 'sms' | 'copy'
  subject: string
  message: string
}

export function InviteDirectPage({ token }: Props) {
  const navigate = useNavigate()
  const { familyId } = useParams<{ familyId: string }>()
  const { t } = useI18n()

  const [firstName, setFirstName] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [prepared, setPrepared] = useState<PreparedInviteMessage | null>(null)

  const familyQuery = useQuery({
    queryKey: queryKeys.familyById(familyId ?? 'unknown'),
    queryFn: () => domusApi.getFamilyById(token, familyId!),
    enabled: Boolean(familyId),
  })

  const familyName = (familyQuery.data?.name ?? '').trim() || t('group.details.title')

  useEffect(() => {
    setPrepared(null)
  }, [contact, firstName])

  const createMutation = useMutation({
    mutationFn: () => {
      if (!familyId) throw new Error('Missing familyId')
      return domusApi.createFamilyInvite(token, familyId, { daysValid: 7 })
    },
    onSuccess: async (res) => {
      const inviteUrl = (res.inviteUrl ?? '').trim()
      if (!inviteUrl) {
        setStatus(t('invite.direct.status.noLink'))
        setPrepared(null)
        return
      }

      const contactTrimmed = contact.trim()
      const kind: PreparedInviteMessage['kind'] =
        contactTrimmed.includes('@') ? 'email' : looksLikePhone(contactTrimmed) ? 'sms' : 'copy'

      const subject = `${t('invite.link.shareTitle', { familyName })} — DomusUnify`

      const name = firstName.trim()
      const greeting = name ? t('invite.direct.greeting.named', { name }) : t('invite.direct.greeting.unnamed')
      const message = `${greeting}\n\n${t('invite.message.joinBase', { familyName })}\n${inviteUrl}\n\n${t('invite.direct.message.welcome')}`.trim()

      setPrepared({ contact: contactTrimmed, kind, subject, message })

      if (kind === 'copy') {
        await copyText(message)
        setStatus(t('invite.link.copied'))
        setTimeout(() => setStatus(null), 1500)
        return
      }

      setStatus(t('invite.direct.status.ready'))
      setTimeout(() => setStatus(null), 1500)
    },
  })

  const canInvite = Boolean(contact.trim()) && !createMutation.isPending

  const subtitle = useMemo(() => {
    const trimmed = contact.trim()
    if (trimmed.includes('@')) return t('invite.direct.destination.email')
    if (looksLikePhone(trimmed)) return t('invite.direct.destination.sms')
    return t('invite.direct.destination.link')
  }, [contact, t])

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label={t('common.back')}
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-charcoal">{t('invite.members.title')}</div>

          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-forest mb-4">{t('invite.members.title')}</h1>
          <p className="text-sm text-gray-600">{t('invite.direct.subtitle')}</p>
        </div>

        <div className="mt-10 space-y-4">
          <div className="rounded-full bg-gray-100 px-5 py-4 flex items-center gap-3">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t('invite.direct.firstName.placeholder')}
              className="w-full bg-transparent text-lg text-charcoal outline-none placeholder:text-gray-400"
            />
            <i className="ri-user-line text-2xl text-gray-400" />
          </div>

          <div className="rounded-full bg-gray-100 px-5 py-4 flex items-center gap-3">
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t('invite.direct.contact.placeholder')}
              className="w-full bg-transparent text-lg text-charcoal outline-none placeholder:text-gray-400"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (canInvite) createMutation.mutate()
              }}
            />
            <i className="ri-mail-send-line text-2xl text-gray-400" />
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-full bg-sage-dark/60 py-4 text-center text-lg font-extrabold text-white shadow-lg hover:bg-sage-dark disabled:opacity-60"
            onClick={() => createMutation.mutate()}
            disabled={!canInvite}
          >
            {createMutation.isPending ? t('invite.direct.button.inviting') : t('invite.direct.button.invite')}
          </button>

          <div className="text-center text-xs text-gray-500">{t('invite.direct.destination.line', { destination: subtitle })}</div>

          {status ? <div className="mt-2 text-center text-sm font-semibold text-forest">{status}</div> : null}

          {createMutation.isError ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              {t('invite.direct.errorCreate')}
            </div>
          ) : null}
        </div>

        {prepared ? (
          <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-charcoal mb-2">{t('invite.link.messageTitle')}</div>
            <div className="rounded-2xl bg-sand-light px-4 py-3 text-sm text-charcoal whitespace-pre-wrap">
              {prepared.message}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {prepared.kind === 'sms' ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
                  onClick={() => openSms(prepared.contact, prepared.message)}
                >
                  <i className="ri-message-3-line text-lg leading-none" /> {t('invite.direct.openMessages')}
                </button>
              ) : null}

              {prepared.kind === 'email' ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
                  onClick={() => openMailto(prepared.contact, prepared.subject, prepared.message)}
                >
                  <i className="ri-mail-send-line text-lg leading-none" /> {t('invite.direct.openEmail')}
                </button>
              ) : null}

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-charcoal border border-gray-200 hover:bg-sand-light"
                onClick={async () => {
                  await copyText(prepared.message)
                  setStatus(t('invite.link.copied'))
                  setTimeout(() => setStatus(null), 1500)
                }}
              >
                <i className="ri-file-copy-line text-lg leading-none" /> {t('invite.link.copyMessage')}
              </button>
            </div>

            {prepared.kind !== 'copy' ? (
              <div className="mt-3 text-xs text-gray-500">
                {t('invite.direct.to')}: <span className="font-semibold text-charcoal">{prepared.contact || '—'}</span>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  )
}

function looksLikePhone(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return /^[+()\\d\\s-]{6,}$/.test(trimmed) && /\\d/.test(trimmed)
}

function openMailto(email: string, subject: string, body: string) {
  const to = email.trim()
  const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = url
}

function openSms(phone: string, body: string) {
  const to = normalizePhoneForSms(phone)
  const bodyEncoded = encodeURIComponent(body)
  const separator = isIOS() ? '&' : '?'
  const url = `sms:${to}${separator}body=${bodyEncoded}`
  window.location.assign(url)
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}

function normalizePhoneForSms(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\\D/g, '')
  if (!digits) return ''

  if (!hasPlus && digits.startsWith('00') && digits.length > 2) {
    return `+${digits.slice(2)}`
  }

  return hasPlus ? `+${digits}` : digits
}

function isIOS(): boolean {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/i.test(ua)) return true
  // iPadOS 13+ reports as Mac; detect touch-capable Macs.
  return /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1
}
