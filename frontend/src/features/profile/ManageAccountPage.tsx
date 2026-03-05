import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { domusApi, type FamilyResponse, type UpdateUserProfileRequest } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { DatePickerSheet } from '../../ui/DatePickerSheet'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { getUserIdFromAccessToken } from '../../utils/jwt'
import type { ProfileGender } from '../../utils/profilePrefs'
import { useI18n } from '../../i18n/i18n'

type Props = {
  token: string
  family: FamilyResponse
}

export function ManageAccountPage({ token, family }: Props) {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [genderOpen, setGenderOpen] = useState(false)
  const [birthdayPickerOpen, setBirthdayPickerOpen] = useState(false)

  const userId = useMemo(() => getUserIdFromAccessToken(token), [token])
  const [draft, setDraft] = useState<UpdateUserProfileRequest>(() => ({
    displayName: null,
    profileColorHex: null,
    birthday: null,
    gender: null,
    phone: null,
    address: null,
  }))

  const familyMembersQuery = useQuery({
    queryKey: queryKeys.familyMembers,
    queryFn: () => domusApi.getFamilyMembers(token),
  })

  const profileQuery = useQuery({
    queryKey: queryKeys.userProfileMe,
    queryFn: () => domusApi.getMyProfile(token),
  })

  useEffect(() => {
    const p = profileQuery.data
    if (!p) return

    setDraft({
      displayName: p.displayName ?? null,
      profileColorHex: p.profileColorHex ?? null,
      birthday: p.birthday ?? null,
      gender: toGender(p.gender ?? ''),
      phone: p.phone ?? null,
      address: p.address ?? null,
    })
  }, [profileQuery.data])

  const updateMutation = useMutation({
    mutationFn: (req: UpdateUserProfileRequest) => domusApi.updateMyProfile(token, req),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userProfileMe })
      navigate('/profile', { replace: true })
    },
    onError: (err) => {
      window.alert(err instanceof Error ? err.message : t('manageAccount.updateError'))
    },
  })

  const isLoading = familyMembersQuery.isLoading || profileQuery.isLoading
  if (isLoading) {
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
      <ErrorDisplay
        apiError={apiError}
        queryKey={queryKeys.familyMembers}
        queryClient={queryClient}
        title={t('manageAccount.loadError')}
      />
    )
  }

  const apiProfileError = profileQuery.error instanceof ApiError ? profileQuery.error : null
  if (profileQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiProfileError}
        queryKey={queryKeys.userProfileMe}
        queryClient={queryClient}
        title={t('manageAccount.loadError')}
      />
    )
  }

  const members = familyMembersQuery.data ?? []
  const me = members.find((m) => Boolean(m.userId) && m.userId === userId) ?? null
  const email = (me?.email ?? '').trim()
  const roleLabel = (me?.role ?? family.role ?? '').trim()

  const save = () => {
    if (updateMutation.isPending) return

    updateMutation.mutate({
      displayName: draft.displayName ?? null,
      profileColorHex: draft.profileColorHex ?? null,
      birthday: draft.birthday ?? null,
      gender: toGender(String(draft.gender ?? '')),
      phone: (draft.phone ?? '').trim() || null,
      address: (draft.address ?? '').trim() || null,
    })
  }

  const cancel = () => navigate(-1)

  const familyName = (family.name ?? '').trim() || t('manageAccount.leaveGroup.current')

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 text-sage-dark bg-linear-to-b from-sage-light to-offwhite">
        <div className="flex items-center justify-between p-6">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/60 hover:bg-white"
            aria-label={t('common.cancel')}
            onClick={cancel}
          >
            <i className="ri-close-line text-2xl leading-none" />
          </button>

          <div className="text-base font-semibold text-forest">{t('manageAccount.title')}</div>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/60 hover:bg-white disabled:opacity-60"
            aria-label={t('common.save')}
            onClick={save}
            disabled={updateMutation.isPending}
          >
            <i className={updateMutation.isPending ? 'ri-loader-4-line animate-spin text-2xl leading-none' : 'ri-check-line text-2xl leading-none'} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10">
        <div className="mt-6 text-xs font-bold tracking-wide text-forest mb-3">{t('manageAccount.section.profile')}</div>
        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <FieldRow icon="ri-team-line" label={t('memberProfile.info.role')}>
            <div className="text-sm font-semibold text-gray-400">{roleLabel || '—'}</div>
          </FieldRow>

          <FieldRow icon="ri-cake-2-line" label={t('memberProfile.info.birthday')}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest/25 hover:bg-sand-light"
                onClick={() => setBirthdayPickerOpen(true)}
                aria-label={t('manageAccount.birthday.selectAria')}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className={`truncate ${draft.birthday ? 'text-charcoal' : 'text-gray-400'}`}>
                    {draft.birthday ? formatDateLabel(draft.birthday, locale) : t('manageAccount.birthday.selectPlaceholder')}
                  </span>
                  <i className="ri-calendar-line text-lg text-gray-400" aria-hidden="true" />
                </span>
              </button>
              {draft.birthday ? (
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                  aria-label={t('common.clear')}
                  onClick={() => setDraft((p) => ({ ...p, birthday: null }))}
                >
                  <i className="ri-close-line text-xl leading-none" />
                </button>
              ) : null}
            </div>
          </FieldRow>

          <FieldRow icon="ri-genderless-line" label={t('manageAccount.gender.label')}>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest/25"
                value={draft.gender ?? ''}
                onFocus={() => setGenderOpen(true)}
                onBlur={() => setGenderOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' || e.key === 'Enter') setGenderOpen(false)
                }}
                onChange={(e) => {
                  setDraft((p) => ({ ...p, gender: toGender(e.target.value) }))
                  setGenderOpen(false)
                }}
              >
                <option value="">—</option>
                <option value="female">{t('manageAccount.gender.female')}</option>
                <option value="male">{t('manageAccount.gender.male')}</option>
                <option value="other">{t('manageAccount.gender.other')}</option>
              </select>

              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i
                  className={`${genderOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-xl`}
                  aria-hidden="true"
                />
              </div>
            </div>
          </FieldRow>
        </section>

        <div className="mt-6 text-xs font-bold tracking-wide text-forest">{t('manageAccount.section.password')}</div>
        <section className="mt-3 rounded-2xl bg-white shadow-sm">
          <button
            type="button"
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-sand-light"
            onClick={() => window.alert(t('common.comingSoon'))}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-sage-dark">
                <i className="ri-lock-line text-xl" />
              </div>
              <div className="text-sm font-semibold text-charcoal">{t('manageAccount.password.change')}</div>
            </div>
            <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" />
          </button>
        </section>

        <div className="mt-6 text-xs font-bold tracking-wide text-forest">{t('manageAccount.section.contact')}</div>
        <section className="mt-3 rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <FieldRow icon="ri-mail-line" label={email || '—'}>
            <div className="text-sm font-semibold text-charcoal">{email || '—'}</div>
          </FieldRow>

          <FieldRow icon="ri-smartphone-line" label={t('manageAccount.phone.label')}>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest/25"
              value={draft.phone ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value || null }))}
              placeholder={t('manageAccount.phone.placeholder')}
            />
          </FieldRow>

          <FieldRow icon="ri-home-7-line" label={t('manageAccount.address.label')}>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest/25"
              value={draft.address ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value || null }))}
              placeholder={t('manageAccount.address.placeholder')}
            />
          </FieldRow>
        </section>

        <button
          type="button"
          className="mt-8 w-full rounded-2xl bg-white px-5 py-4 text-center text-red-600 font-semibold shadow-sm hover:bg-red-50"
          onClick={() => window.alert(t('common.notAvailableYet'))}
        >
          {t('manageAccount.leaveGroup', { familyName })}
        </button>
      </main>

      {birthdayPickerOpen ? (
        <DatePickerSheet
          title={t('memberProfile.info.birthday')}
          value={draft.birthday ?? null}
          onClose={() => setBirthdayPickerOpen(false)}
          onConfirm={(v) => {
            setDraft((p) => ({ ...p, birthday: v ?? null }))
            setBirthdayPickerOpen(false)
          }}
          zIndexClass="z-[80]"
        />
      ) : null}
    </div>
  )
}

function FieldRow({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sand-light text-sage-dark">
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

function formatDateLabel(isoDate: string, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((isoDate ?? '').trim())
  if (!m) return isoDate

  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])

  const dt = new Date(y, mo, d, 0, 0, 0, 0)
  if (Number.isNaN(dt.getTime())) return isoDate
  return dt.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}
