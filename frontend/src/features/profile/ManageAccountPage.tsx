import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { domusApi, type FamilyResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { getUserIdFromAccessToken } from '../../utils/jwt'
import { type ProfileGender, useProfilePrefs, type UserProfilePrefs } from '../../utils/profilePrefs'

type Props = {
  token: string
  family: FamilyResponse
}

const COLOR_OPTIONS = [
  '#8b5cf6',
  '#22c55e',
  '#ef4444',
  '#1d4ed8',
  '#a16207',
  '#f97316',
  '#10b981',
  '#0ea5e9',
  '#f43f5e',
  '#4b5563',
  '#7c3aed',
  '#16a34a',
  '#dc2626',
  '#4c1d95',
  '#ca8a04',
]

export function ManageAccountPage({ token, family }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const userId = useMemo(() => getUserIdFromAccessToken(token), [token])
  const { prefs, setPrefs } = useProfilePrefs(userId)
  const [draft, setDraft] = useState<UserProfilePrefs>(prefs)

  useEffect(() => setDraft(prefs), [prefs])

  const familyMembersQuery = useQuery({
    queryKey: queryKeys.familyMembers,
    queryFn: () => domusApi.getFamilyMembers(token),
  })

  if (familyMembersQuery.isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const apiError = familyMembersQuery.error instanceof ApiError ? familyMembersQuery.error : null
  if (familyMembersQuery.isError) {
    return (
      <ErrorDisplay apiError={apiError} queryKey={queryKeys.familyMembers} queryClient={queryClient} title="Erro ao obter conta" />
    )
  }

  const members = familyMembersQuery.data ?? []
  const me = members.find((m) => Boolean(m.userId) && m.userId === userId) ?? null
  const email = (me?.email ?? '').trim()
  const roleLabel = (me?.role ?? family.role ?? '').trim()

  const save = () => {
    setPrefs(draft)
    navigate('/profile', { replace: true })
  }

  const cancel = () => navigate(-1)

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-gray-700 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/15 hover:bg-white/20"
            aria-label="Cancelar"
            onClick={cancel}
          >
            <i className="ri-close-line text-2xl leading-none" />
          </button>

          <div className="text-base font-semibold">Gerenciar conta</div>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/15 hover:bg-white/20"
            aria-label="Guardar"
            onClick={save}
          >
            <i className="ri-check-line text-2xl leading-none" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16">
        <section className="py-6">
          <div className="text-xs font-bold tracking-wide text-gray-400 mb-3">Cor do perfil</div>
          <div className="flex flex-wrap gap-3">
            {COLOR_OPTIONS.map((hex) => {
              const selected = (draft.profileColorHex ?? '').toLowerCase() === hex.toLowerCase()
              return (
                <button
                  key={hex}
                  type="button"
                  className={`relative h-14 w-14 rounded-full border-2 ${selected ? 'border-charcoal' : 'border-transparent'}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setDraft((p) => ({ ...p, profileColorHex: hex }))}
                  aria-label={`Cor ${hex}`}
                >
                  {selected ? (
                    <span className="absolute inset-0 grid place-items-center text-white">
                      <i className="ri-check-line text-2xl leading-none" />
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <FieldRow icon="ri-team-line" label="Papel da Família">
            <div className="text-sm font-semibold text-gray-400">{roleLabel || '—'}</div>
          </FieldRow>

          <FieldRow icon="ri-cake-2-line" label="Aniversário">
            <div className="flex items-center gap-3">
              <input
                type="date"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest/25"
                value={draft.birthday ?? ''}
                onChange={(e) => setDraft((p) => ({ ...p, birthday: e.target.value || null }))}
              />
              {draft.birthday ? (
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                  aria-label="Limpar"
                  onClick={() => setDraft((p) => ({ ...p, birthday: null }))}
                >
                  <i className="ri-close-line text-xl leading-none" />
                </button>
              ) : null}
            </div>
          </FieldRow>

          <FieldRow icon="ri-genderless-line" label="Selecione o sexo">
            <select
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest/25"
              value={draft.gender ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, gender: toGender(e.target.value) }))}
            >
              <option value="">—</option>
              <option value="female">Feminino</option>
              <option value="male">Masculino</option>
              <option value="other">Outro</option>
            </select>
          </FieldRow>
        </section>

        <div className="mt-6 text-xs font-bold tracking-wide text-gray-400">SENHA</div>
        <section className="mt-3 rounded-2xl bg-white shadow-sm">
          <button
            type="button"
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-sand-light"
            onClick={() => window.alert('Em breve.')}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-gray-600">
                <i className="ri-lock-line text-xl" />
              </div>
              <div className="text-sm font-semibold text-charcoal">Alterar Senha</div>
            </div>
            <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" />
          </button>
        </section>

        <div className="mt-6 text-xs font-bold tracking-wide text-gray-400">INFORMAÇÕES DE CONTATO</div>
        <section className="mt-3 rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <FieldRow icon="ri-mail-line" label={email || '—'}>
            <div className="text-sm font-semibold text-charcoal">{email || '—'}</div>
          </FieldRow>

          <FieldRow icon="ri-smartphone-line" label="Telefone (opcional)">
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest/25"
              value={draft.phone ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value || null }))}
              placeholder="Telefone"
            />
          </FieldRow>

          <FieldRow icon="ri-home-7-line" label="Endereço de casa">
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest/25"
              value={draft.address ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value || null }))}
              placeholder="Endereço"
            />
          </FieldRow>
        </section>

        <button
          type="button"
          className="mt-8 w-full rounded-2xl bg-white px-5 py-4 text-center text-red-600 font-semibold shadow-sm hover:bg-red-50"
          onClick={() => window.alert('Ainda não disponível.')}
        >
          Deixe o grupo {(family.name ?? '').trim() || 'atual'}
        </button>
      </main>
    </div>
  )
}

function FieldRow({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-gray-600">
          <i className={`${icon} text-xl`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-400">{label}</div>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function toGender(value: string): ProfileGender {
  return value === 'female' || value === 'male' || value === 'other' ? value : null
}
