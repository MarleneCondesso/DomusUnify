import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { domusApi, type CreateInviteResult, type FamilyResponse } from '../../api/domusApi'

type Props = {
  token: string
  family: FamilyResponse
}

export function InviteLinkPage({ token, family }: Props) {
  const navigate = useNavigate()
  const { familyId } = useParams<{ familyId: string }>()
  const [invite, setInvite] = useState<CreateInviteResult | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const didRun = useRef(false)

  const createMutation = useMutation({
    mutationFn: () => {
      if (!familyId) throw new Error('Missing familyId')
      return domusApi.createFamilyInvite(token, familyId, { daysValid: 7 })
    },
    onSuccess: (res) => setInvite(res),
  })

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    createMutation.mutate()
  }, [createMutation])

  const inviteUrl = (invite?.inviteUrl ?? '').trim()
  const expiresLabel = invite?.expiresAtUtc ? formatExpiry(invite.expiresAtUtc) : null

  const familyName = (family.name ?? '').trim() || 'Grupo'
  const shareText = useMemo(() => {
    const base = `Junte-se ao meu ${familyName} para compartilhar todas as atividades da nossa família.`
    return inviteUrl ? `${base}\n${inviteUrl}` : base
  }, [familyName, inviteUrl])

  const copy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setStatus('Link copiado.')
      setTimeout(() => setStatus(null), 1500)
    } catch {
      setStatus('Não foi possível copiar automaticamente.')
      setTimeout(() => setStatus(null), 2000)
    }
  }

  const share = async () => {
    if (!inviteUrl) return

    try {
      if (navigator.share) {
        await navigator.share({ title: `Convite: ${familyName}`, text: shareText, url: inviteUrl })
        return
      }
    } catch {
      // ignore
    }

    await copy()
  }

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

          <div className="text-lg font-bold text-charcoal">Convidar com um link</div>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label="Fechar"
            onClick={() => navigate('/')}
          >
            <i className="ri-close-line text-2xl leading-none text-sage-dark" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 space-y-5">
        {createMutation.isPending ? (
          <div className="rounded-2xl bg-white px-5 py-6 text-center text-sm text-gray-500 shadow-sm">
            <i className="ri-loader-4-line animate-spin text-xl mr-2" />
            Gerando link...
          </div>
        ) : null}

        {createMutation.isError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-700">
            Não foi possível gerar o link de convite.
            <button
              type="button"
              className="ml-2 underline font-semibold"
              onClick={() => createMutation.mutate()}
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        {inviteUrl ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-charcoal mb-2">Seu link de convite</div>
            <div className="break-all rounded-2xl bg-sand-light px-4 py-3 text-sm text-charcoal">{inviteUrl}</div>
            {expiresLabel ? <div className="mt-2 text-xs text-gray-500">Expira em {expiresLabel}</div> : null}

            {status ? <div className="mt-3 text-xs font-semibold text-forest">{status}</div> : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
                onClick={() => void share()}
              >
                <i className="ri-share-line text-lg leading-none" /> Compartilhar
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-charcoal border border-gray-200 hover:bg-sand-light"
                onClick={() => void copy()}
              >
                <i className="ri-file-copy-line text-lg leading-none" /> Copiar
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-charcoal border border-gray-200 hover:bg-sand-light"
                onClick={() => {
                  setInvite(null)
                  createMutation.mutate()
                }}
              >
                <i className="ri-refresh-line text-lg leading-none" /> Novo link
              </button>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-charcoal mb-2">Mensagem</div>
          <div className="rounded-2xl bg-sand-light px-4 py-3 text-sm text-charcoal whitespace-pre-wrap">
            {shareText}
          </div>
        </section>
      </main>
    </div>
  )
}

function formatExpiry(isoUtc: string): string {
  const d = new Date(isoUtc)
  if (Number.isNaN(d.getTime())) return isoUtc
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

