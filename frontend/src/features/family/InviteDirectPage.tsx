import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { domusApi, type FamilyResponse } from '../../api/domusApi'

type Props = {
  token: string
  family: FamilyResponse
}

export function InviteDirectPage({ token, family }: Props) {
  const navigate = useNavigate()
  const { familyId } = useParams<{ familyId: string }>()

  const [firstName, setFirstName] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const familyName = (family.name ?? '').trim() || 'Grupo'

  const createMutation = useMutation({
    mutationFn: () => {
      if (!familyId) throw new Error('Missing familyId')
      return domusApi.createFamilyInvite(token, familyId, { daysValid: 7 })
    },
    onSuccess: async (res) => {
      const inviteUrl = (res.inviteUrl ?? '').trim()
      if (!inviteUrl) {
        setStatus('Convite criado, mas sem link.')
        return
      }

      const msg = `Olá ${firstName.trim() || ''}\n\nJunte-se ao meu ${familyName} para compartilhar todas as atividades da nossa família.\n${inviteUrl}`.trim()

      const contactTrimmed = contact.trim()
      if (contactTrimmed.includes('@')) {
        openMailto(contactTrimmed, `Convite para ${familyName}`, msg)
        setStatus('Abrindo e-mail...')
        return
      }

      if (looksLikePhone(contactTrimmed)) {
        openSms(contactTrimmed, msg)
        setStatus('Abrindo SMS...')
        return
      }

      await copyText(inviteUrl)
      setStatus('Link copiado.')
      setTimeout(() => setStatus(null), 1500)
    },
  })

  const canInvite = Boolean(contact.trim()) && !createMutation.isPending

  const subtitle = useMemo(() => {
    if (contact.trim().includes('@')) return 'E-mail'
    if (looksLikePhone(contact.trim())) return 'SMS'
    return 'Link'
  }, [contact])

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label="Voltar"
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-charcoal">Convidar membro</div>

          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-charcoal mb-4">Convidar membro</h1>
          <p className="text-sm text-gray-600">
            Convide as pessoas de quem você é mais próximo e comece a compartilhar com elas.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <div className="rounded-full bg-gray-100 px-5 py-4 flex items-center gap-3">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Primeiro nome"
              className="w-full bg-transparent text-lg text-charcoal outline-none placeholder:text-gray-400"
            />
            <i className="ri-user-line text-2xl text-gray-400" />
          </div>

          <div className="rounded-full bg-gray-100 px-5 py-4 flex items-center gap-3">
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Telefone celular ou E-mail"
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
            className="mt-4 w-full rounded-full bg-blue-500 px-6 py-4 text-center text-lg font-extrabold text-white shadow-lg hover:bg-blue-600 disabled:opacity-60"
            onClick={() => createMutation.mutate()}
            disabled={!canInvite}
          >
            {createMutation.isPending ? 'Convidando...' : 'Convidar'}
          </button>

          <div className="text-center text-xs text-gray-500">Destino: {subtitle}</div>

          {status ? <div className="mt-2 text-center text-sm font-semibold text-forest">{status}</div> : null}

          {createMutation.isError ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              Não foi possível criar o convite.
            </div>
          ) : null}
        </div>
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
  const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = url
}

function openSms(phone: string, body: string) {
  const url = `sms:${encodeURIComponent(phone)}?&body=${encodeURIComponent(body)}`
  window.location.href = url
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}

