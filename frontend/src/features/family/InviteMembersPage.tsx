import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { domusApi } from '../../api/domusApi'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'

type Props = {
  token: string
}

type InviteFlowState = {
  inviteFlow?: {
    closeTo?: string
    leftIcon?: 'close' | 'back'
  }
}

export function InviteMembersPage({ token }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { familyId } = useParams<{ familyId: string }>()
  const { t } = useI18n()

  const familyQuery = useQuery({
    queryKey: queryKeys.familyById(familyId ?? 'unknown'),
    queryFn: () => domusApi.getFamilyById(token, familyId!),
    enabled: Boolean(familyId),
  })

  const inviteFlow = (location.state as InviteFlowState | null)?.inviteFlow ?? null
  const closeTo = typeof inviteFlow?.closeTo === 'string' ? inviteFlow.closeTo : null
  const leftIcon = inviteFlow?.leftIcon ?? (closeTo ? 'back' : 'close')

  const close = () => {
    if (closeTo) {
      navigate(closeTo)
      return
    }

    if (leftIcon === 'back') {
      navigate(-1)
      return
    }

    navigate('/')
  }

  const familyName = (familyQuery.data?.name ?? '').trim() || t('group.details.title')

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label={leftIcon === 'back' ? t('common.back') : t('common.close')}
            onClick={close}
          >
            <i
              className={`${leftIcon === 'back' ? 'ri-arrow-left-line' : 'ri-close-line'} text-2xl leading-none text-sage-dark`}
            />
          </button>

          <div className="text-lg font-bold text-charcoal">{t('invite.members.title')}</div>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label={t('common.done')}
            onClick={close}
          >
            <i className="ri-check-line text-2xl leading-none text-sage-dark" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        <div className="mb-5 rounded-2xl bg-white px-4 py-3 shadow-sm flex items-center gap-2">
          <i className="ri-search-line text-xl text-gray-400" />
          <input
            placeholder={t('common.search')}
            className="w-full bg-transparent py-2 text-base text-charcoal outline-none placeholder:text-gray-400"
          />
        </div>

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <OptionRow
            iconWrap="bg-rose-500/10 text-rose-500"
            icon="ri-mail-line"
            title={t('invite.members.option.direct.title')}
            subtitle={t('invite.members.option.direct.subtitle')}
            onClick={() => navigate(`/groups/invite/${familyId}/direct`, { state: location.state })}
          />

          <OptionRow
            iconWrap="bg-amber/15 text-amber-dark"
            icon="ri-emotion-happy-line"
            title={t('invite.members.option.child.title')}
            subtitle={t('invite.members.option.child.subtitle')}
            onClick={() => navigate(`/groups/invite/${familyId}/child`, { state: location.state })}
          />

          <OptionRow
            iconWrap="bg-sky-500/10 text-sky-600"
            icon="ri-group-line"
            title={t('invite.members.option.others.title')}
            subtitle={t('invite.members.option.others.subtitle')}
            onClick={() => navigate(`/groups/invite/${familyId}/others`, { state: location.state })}
          />

          <OptionRow
            iconWrap="bg-emerald-500/10 text-emerald-600"
            icon="ri-link"
            title={t('invite.members.option.link.title')}
            subtitle={t('invite.members.option.link.subtitle')}
            onClick={() => navigate(`/groups/invite/${familyId}/link`, { state: location.state })}
          />
        </section>

        <div className="mt-6 text-sm text-gray-500">
          {t('invite.members.footer', { familyName })}
        </div>
      </main>
    </div>
  )
}

function OptionRow({
  icon,
  title,
  subtitle,
  onClick,
  iconWrap,
}: {
  icon: string
  title: string
  subtitle: string
  onClick: () => void
  iconWrap: string
}) {
  return (
    <button type="button" className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-sand-light" onClick={onClick}>
      <div className={`grid h-12 w-12 place-items-center rounded-full ${iconWrap}`}>
        <i className={`${icon} text-2xl`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold text-charcoal">{title}</div>
        <div className="text-sm text-gray-500 truncate">{subtitle}</div>
      </div>
      <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" />
    </button>
  )
}
