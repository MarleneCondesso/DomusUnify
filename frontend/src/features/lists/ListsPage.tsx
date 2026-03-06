import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { domusApi, type FamilyResponse } from '../../api/domusApi'
import { queryKeys } from '../../api/queryKeys'
import { useFamilyHub } from '../../realtime/useFamilyHub'
import { ActionSheet, type ActionSheetItem } from '../../ui/ActionSheet'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { useI18n } from '../../i18n/i18n'

type Props = {
  token: string
  family: FamilyResponse
  onLogout: () => void
}

/**
 * Página de exemplo:
 * - Mostra as listas da família atual (GET /api/v1/lists)
 * - Permite criar uma lista (POST /api/v1/lists)
 *
 * SignalR:
 * - O hook `useFamilyHub` liga ao hub `/hubs/family` e invalida automaticamente estas queries quando houver eventos.
 */
export function ListsPage({ token, family }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)

  //#region ...[SignalR]...
  const familyId = family.id ?? ''
  useFamilyHub({ token, familyId, enabled: Boolean(family.id) })
  //#endregion

  //#region ...[Queries & Mutations]...

  const listsQuery = useQuery({
    queryKey: queryKeys.lists,
    queryFn: () => domusApi.getLists(token),
  })

  const regenerateCoversMutation = useMutation({
    mutationFn: () => domusApi.regenerateListCovers(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lists })
    },
  })

  const hasPexelsCovers = Boolean(
    listsQuery.data?.some((l) => (l.coverImageUrl ?? '').includes('pexels.com')),
  )
  const hasLists = (listsQuery.data?.length ?? 0) > 0

  const menuItems = useMemo<ActionSheetItem[]>(() => {
    const items: ActionSheetItem[] = [
      {
        id: 'refresh',
        label: t('common.refresh'),
        icon: 'ri-refresh-line',
        onPress: () => {
          setMenuOpen(false)
          queryClient.invalidateQueries({ queryKey: queryKeys.lists })
        },
      },
    ]

    if (hasPexelsCovers) {
      items.push({
        id: 'regenerate-covers',
        label: t('lists.menu.regenerateCovers'),
        icon: 'ri-image-line',
        disabled: regenerateCoversMutation.isPending,
        onPress: () => {
          setMenuOpen(false)
          const ok = window.confirm(t('lists.menu.regenerateCovers.confirm'))
          if (!ok) return
          regenerateCoversMutation.mutate()
        },
      })
    }

    return items
  }, [hasPexelsCovers, queryClient, regenerateCoversMutation, setMenuOpen, t])

  //#endregion

  //#region ...[Loading]...
  if (listsQuery.isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }
  //#endregion

  if (!family.id) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <h2 className="text-xl font-semibold text-charcoal">{t('lists.invalidApi.title')}</h2>
        <p className="mt-2 text-sm text-charcoal">{t('lists.invalidApi.body')}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <header className="flex items-start justify-between gap-4 bg-linear-to-b from-sage-light to-offwhite flex-col">
        <nav className="flex w-full items-center justify-between p-6">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
            aria-label={t('common.home')}
            onClick={() => navigate('/')}
          >
            <i className="ri-home-7-line text-2xl leading-none" />
          </button>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
            aria-label={t('common.menu')}
            disabled={regenerateCoversMutation.isPending}
            onClick={() => {
              setMenuOpen(true)
            }}
          >
            <i className={`${regenerateCoversMutation.isPending ? 'ri-loader-4-line animate-spin' : 'ri-more-2-fill'} text-2xl leading-none`} />
          </button>
        </nav>
        <section className='py-16 px-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className="text-6xl font-bold text-charcoal mb-6 flex items-center gap-3">{t('lists.title')} <span className='text-5xl'>📝</span></h1>
              <p className='text-md text-gray-600 mb-2'>{t('lists.subtitle')}</p>
            </div>
          </div>
        </section>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 pb-16">
        {!hasLists ? (
          <section className="pt-2">
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-6 text-sm text-charcoal shadow-sm">
              {t('lists.empty')}
            </div>
          </section>
        ) : (
          <section className='pb-16'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {listsQuery.data?.map((l) => {
              const itemsCount = l.itemsCount ?? 0
              const completedCount = l.completedCount ?? 0
              const progressPct = itemsCount > 0 ? Math.round((completedCount / itemsCount) * 100) : 0
              const cover = l.coverImageUrl ?? ''
              const barColor = '#d4a853'
              const visibilityMode = l.visibilityMode ?? 'AllMembers'
              const isPrivate = visibilityMode === 'Private'

              return (
                <span
                  key={l.id}
                  className="relative h-72 cursor-pointer overflow-hidden rounded-2xl bg-sand-light shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{
                    backgroundImage: cover ? `url(${cover})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  onClick={() => navigate(`/lists/items/${l.id}`)}
                >
                  <div className="absolute inset-0 bg-linear-to-t from-forest/80 via-forest/40 to-transparent" />

                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {l.type ?? t('lists.type.custom')}
                    </span>
                  </div>

                  <div className="absolute right-4 top-4">
                    <span
                      className="grid h-8 w-8 place-items-center rounded-full bg-bg-offwhite text-white backdrop-blur"
                      title={isPrivate ? t('lists.visibility.private') : t('lists.visibility.shared')}
                    >
                      <span
                        role="img"
                        aria-label={isPrivate ? t('lists.visibility.private.aria') : t('lists.visibility.shared.aria')}
                        className="text-base leading-none"
                      >
                        {isPrivate ? <i className="ri-lock-fill text-offwhite"></i> : <i className="ri-group-fill text-offwhite"></i>}
                      </span>
                    </span>
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <h3 className="text-2xl font-bold text-white drop-shadow">{l.name}</h3>
                    <p className="mt-1 text-sm text-white/90">
                      {t('lists.card.itemsCompleted', { items: itemsCount, completed: completedCount })}
                    </p>

                    <div className="mt-4 h-1.5 w-full rounded-full bg-white/30">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${progressPct}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                </span>
              )
            })}
          </div>
          </section>
        )}

        <button
          type="button"
          className="fixed bottom-20 right-6 grid h-12 w-12 place-items-center rounded-full bg-amber/60 text-charcoal shadow-2xl hover:bg-amber"
          onClick={() => navigate('/lists/new', { state: { backgroundLocation: location } })}
          aria-label={t('common.add')}
          title={t('common.add')}
        >
          <i className="ri-add-large-fill" aria-hidden="true"></i>
        </button>

        {hasPexelsCovers ? (
          <div className="mt-6 text-center text-xs text-charcoal/70">
            {t('lists.pexels.credit.prefix')}{' '}
            <a
              className="underline hover:text-charcoal"
              href="https://www.pexels.com"
              target="_blank"
              rel="noreferrer"
            >
              Pexels
            </a>
            {t('lists.pexels.credit.suffix')}
          </div>
        ) : null}
      </main>

      {menuOpen ? <ActionSheet title={t('common.options')} items={menuItems} onClose={() => setMenuOpen(false)} /> : null}

    </div >

  )
}
