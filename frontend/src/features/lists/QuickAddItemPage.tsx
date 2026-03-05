import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { domusApi, type FamilyResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { AddItemButtonSheet } from './AddItemButtonSheet'
import { useI18n } from '../../i18n/i18n'

type Props = {
  token: string
  family: FamilyResponse
}

export function QuickAddItemPage({ token, family }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(true)

  const listsQuery = useQuery({
    queryKey: queryKeys.lists,
    queryFn: () => domusApi.getLists(token),
  })

  const listsKey = useMemo(() => queryKeys.lists, [])
  const apiError = listsQuery.error instanceof ApiError ? listsQuery.error : null

  useEffect(() => {
    if (listsQuery.isLoading) return
    if (listsQuery.isError) return
    setSheetOpen(true)
  }, [listsQuery.isError, listsQuery.isLoading])

  if (listsQuery.isLoading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="flex justify-center py-2">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (listsQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiError}
        queryKey={listsKey}
        queryClient={queryClient}
        title={t('quickAdd.errorTitle')}
      />
    )
  }

  const lists = listsQuery.data ?? []

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="flex items-start justify-between gap-4 bg-linear-to-b from-sage-light to-offwhite py-10 flex-col px-4">
        <nav className="flex w-full items-center justify-between px-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
            aria-label={t('common.home')}
            onClick={() => navigate('/')}
          >
            <i className="ri-home-7-line text-2xl leading-none" />
          </button>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
            aria-label={t('common.back')}
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none" />
          </button>
        </nav>

        <section className="py-10 px-2">
          <h1 className="text-6xl font-bold text-charcoal mb-4">{t('quickAdd.title')}</h1>
          <p className="text-md text-gray-600">{t('quickAdd.subtitle', { familyName: family.name ?? '' })}</p>
        </section>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="text-sm text-charcoal/70">
            {t('quickAdd.body')}
          </div>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber/90"
            onClick={() => setSheetOpen(true)}
          >
            {t('quickAdd.addItem')} <i className="ri-add-line text-lg leading-none" />
          </button>

          <button
            type="button"
            className="mt-4 ml-3 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-amber border border-amber/30 hover:bg-sand-light"
            onClick={() => navigate('/lists')}
          >
            {t('quickAdd.viewLists')} <i className="ri-arrow-right-line text-lg leading-none" />
          </button>
        </div>
      </main>

      {sheetOpen ? (
        <AddItemButtonSheet
          lists={lists}
          onClose={() => {
            setSheetOpen(false)
            navigate('/')
          }}
          onCreateList={() => navigate('/lists/new')}
          onSelectList={(listId) => navigate(`/lists/items/${listId}?add=1`)}
        />
      ) : null}
    </div>
  )
}
