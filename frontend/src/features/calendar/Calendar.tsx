import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { domusApi, type CalendarResponse, type CreateCalendarEventRequest, type FamilyResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { ErrorDisplay } from '../../utils/ErrorDisplay'
import { AddEventSheet } from './AddEventSheet'
import { CalendarFilterSheet } from './CalendarFilterSheet'
import { CalendarSettingsSheet } from './CalendarSettingsSheet'
import { CalendarViewMenu } from './CalendarViewMenu'
import { JumpToDateSheet } from './JumpToDateSheet'
import {
  loadCalendarPreferences,
  saveCalendarPreferences,
  type CalendarPreferences,
  type CalendarViewMode,
} from './calendarPreferences'
import {
  capitalizeFirst,
  clampDateToMonth,
  dateKey,
  dateToUtcIsoEndOfDay,
  dateToUtcIsoStartOfDay,
  endOfWeek,
  startOfWeek,
} from './dateUtils'

type Props = {
  token: string
  family: FamilyResponse
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const
const SWIPE_THRESHOLD_PX = 48
const SWIPE_MAX_OFF_AXIS_RATIO = 1.25

export function CalendarPage({ token }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const now = useMemo(() => new Date(), [])
  const [prefs, setPrefs] = useState<CalendarPreferences>(() => loadCalendarPreferences())
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(() => now)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const ignoreNextCellClickRef = useRef(false)
  const [isJumpToDateOpen, setIsJumpToDateOpen] = useState(false)
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [filterUserIds, setFilterUserIds] = useState<string[]>([]) // empty => all members
  const [addEventDate, setAddEventDate] = useState<Date | null>(null)
  const [createEventError, setCreateEventError] = useState<string | null>(null)

  const viewMode: CalendarViewMode = prefs.viewMode

  const monthStart = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1), [cursor])
  const monthEnd = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0), [cursor])

  const gridStart = useMemo(() => startOfWeek(monthStart, prefs.firstDayOfWeek), [monthStart, prefs.firstDayOfWeek])
  const gridEnd = useMemo(() => endOfWeek(monthEnd, prefs.firstDayOfWeek), [monthEnd, prefs.firstDayOfWeek])

  const fromUtc = useMemo(() => dateToUtcIsoStartOfDay(gridStart), [gridStart])
  const toUtc = useMemo(() => dateToUtcIsoEndOfDay(gridEnd), [gridEnd])

  const eventsQueryKey = useMemo(
    () => queryKeys.calendarEvents({ fromUtc, toUtc, take: 1000 }),
    [fromUtc, toUtc],
  )

  const eventsQuery = useQuery({
    queryKey: eventsQueryKey,
    queryFn: () => domusApi.getCalendarEvents(token, fromUtc, toUtc, undefined, undefined, undefined, 1000),
  })

  const familyMembersQuery = useQuery({
    queryKey: queryKeys.familyMembers,
    queryFn: () => domusApi.getFamilyMembers(token),
  })

  const createEventMutation = useMutation({
    mutationFn: (req: CreateCalendarEventRequest) => domusApi.createCalendarEvent(token, req),
    onSuccess: async () => {
      setAddEventDate(null)
      setCreateEventError(null)
      await queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
    onError: (err) => {
      setCreateEventError(formatMutationError(err))
    },
  })

  const apiEventsError = eventsQuery.error instanceof ApiError ? eventsQuery.error : null

  const monthLabel = useMemo(() => {
    const raw = monthStart.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
    return capitalizeFirst(raw)
  }, [monthStart])

  const weekdayLabels = useMemo(() => {
    if (prefs.firstDayOfWeek === 'monday') return [...WEEKDAY_LABELS.slice(1), WEEKDAY_LABELS[0]]
    return [...WEEKDAY_LABELS]
  }, [prefs.firstDayOfWeek])

  const gridColsClass = prefs.showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'

  const todayKey = useMemo(() => dateKey(new Date()), [])
  const selectedKey = useMemo(() => dateKey(selectedDate), [selectedDate])

  const days = useMemo(() => {
    const out: Date[] = []
    const d = new Date(gridStart)
    d.setHours(0, 0, 0, 0)

    const end = new Date(gridEnd)
    end.setHours(0, 0, 0, 0)

    while (d.getTime() <= end.getTime()) {
      out.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }

    return out
  }, [gridEnd, gridStart])

  const weeks = useMemo(() => chunkIntoWeeks(days, 7), [days])

  const eventsRaw = eventsQuery.data ?? []
  const eventsByDayRaw = useMemo(() => groupEventsByDay(eventsRaw), [eventsRaw])

  const normalizedSearch = useMemo(() => searchText.trim().toLocaleLowerCase(), [searchText])
  const eventsFiltered = useMemo(() => {
    let rows = eventsRaw

    if (filterUserIds.length > 0) {
      const set = new Set(filterUserIds)
      rows = rows.filter((e) => {
        const ids = e.participantUserIds ?? null
        if (!ids || ids.length === 0) return true // sem participantes -> assume "todos"
        return ids.some((id) => set.has(id))
      })
    }

    if (!normalizedSearch) return rows

    return rows.filter((e) => {
      const title = (e.title ?? '').trim().toLocaleLowerCase()
      return title.includes(normalizedSearch)
    })
  }, [eventsRaw, filterUserIds, normalizedSearch])

  const eventsByDayVisible = useMemo(() => groupEventsByDay(eventsFiltered), [eventsFiltered])
  const visibleEventIds = useMemo(() => {
    return eventsRaw
      .map((e) => e.id ?? '')
      .filter(Boolean)
  }, [eventsRaw])

  const monthDays = useMemo(() => {
    const out: Date[] = []
    const d = new Date(monthStart)
    d.setHours(0, 0, 0, 0)
    const end = new Date(monthEnd)
    end.setHours(0, 0, 0, 0)

    while (d.getTime() <= end.getTime()) {
      out.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }

    return out
  }, [monthEnd, monthStart])

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, prefs.firstDayOfWeek)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [prefs.firstDayOfWeek, selectedDate])

  const threeDayRange = useMemo(() => {
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)
    return Array.from({ length: 3 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [selectedDate])

  function goToMonth(targetMonthStart: Date) {
    const y = targetMonthStart.getFullYear()
    const m = targetMonthStart.getMonth()

    setCursor(new Date(y, m, 1))
    setSelectedDate((prev) => clampDateToMonth(prev, y, m))
  }

  function goToPrevMonth() {
    goToMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    goToMonth(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))
  }

  function openAddEventForDay(d: Date) {
    setCreateEventError(null)
    setAddEventDate(d)
  }

  function setSelectedDateAndCursor(d: Date) {
    setSelectedDate(d)
    if (d.getFullYear() !== cursor.getFullYear() || d.getMonth() !== cursor.getMonth()) {
      setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
    }
  }

  function shiftSelectedDate(daysDelta: number) {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + daysDelta)
    setSelectedDateAndCursor(next)
  }

  function setPrefsPersist(next: CalendarPreferences) {
    setPrefs(next)
    saveCalendarPreferences(next)
  }

  function patchPrefs(patch: Partial<CalendarPreferences>) {
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      saveCalendarPreferences(next)
      return next
    })
  }

  if (eventsQuery.isError) {
    return (
      <ErrorDisplay
        apiError={apiEventsError}
        queryKey={eventsQueryKey}
        queryClient={queryClient}
        title="Erro ao obter eventos do calendário"
      />
    )
  }

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="bg-linear-to-b from-sage-light to-offwhite pt-8 pb-4">
        <div className="mx-auto w-full max-w-5xl px-4">
          <nav className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark shrink-0"
                aria-label="Home"
                onClick={() => navigate('/')}
              >
                <i className="ri-home-7-line text-2xl leading-none" />
              </button>
              <button
                type="button"
                className="inline-flex min-w-0 items-center gap-1 rounded-2xl px-2 py-1 text-3xl font-bold text-forest hover:bg-white/50"
                onClick={() => setIsJumpToDateOpen(true)}
                aria-label="Escolher mês e ano"
              >
                <span className="truncate">{monthLabel}</span>
                <i className="ri-arrow-down-s-line text-3xl leading-none text-forest/70" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
                aria-label="Vistas"
                onClick={() => setIsViewMenuOpen(true)}
              >
                <i className={`${viewModeIcon(viewMode)} text-2xl leading-none`} />
              </button>

              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
                aria-label="Search"
                onClick={() => setSearchOpen((v) => !v)}
              >
                <i className="ri-search-2-line text-2xl leading-none" />
              </button>

              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/60 hover:bg-white text-sage-dark"
                aria-label="Settings"
                onClick={() => setIsSettingsOpen(true)}
              >
                <i className="ri-settings-3-line text-2xl leading-none" />
              </button>
            </div>
          </nav>

          {searchOpen && (
            <div className="mt-4">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Pesquisar eventos…"
                className="w-full rounded-2xl border border-sand-dark/60 bg-white px-4 py-3 text-charcoal placeholder:text-charcoal/50 focus:outline-none focus:ring-2 focus:ring-sage-dark/25"
              />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-2 pb-28">
        <section
          className="relative overflow-hidden rounded-2xl border border-sand-dark/60 bg-white shadow-sm"
          onTouchStart={(e) => {
            const t = e.touches[0]
            if (!t) return
            touchStartRef.current = { x: t.clientX, y: t.clientY }
          }}
          onTouchEnd={(e) => {
            const start = touchStartRef.current
            touchStartRef.current = null
            const t = e.changedTouches[0]
            if (!start || !t) return

            const dx = t.clientX - start.x
            const dy = t.clientY - start.y

            if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
            if (Math.abs(dx) < Math.abs(dy) * SWIPE_MAX_OFF_AXIS_RATIO) return

            ignoreNextCellClickRef.current = true
            queueMicrotask(() => {
              ignoreNextCellClickRef.current = false
            })

            if (dx < 0) {
              if (viewMode === 'month' || viewMode === 'agenda') goToNextMonth()
              else if (viewMode === 'week') shiftSelectedDate(7)
              else if (viewMode === 'threeDays') shiftSelectedDate(3)
              else shiftSelectedDate(1)
            } else {
              if (viewMode === 'month' || viewMode === 'agenda') goToPrevMonth()
              else if (viewMode === 'week') shiftSelectedDate(-7)
              else if (viewMode === 'threeDays') shiftSelectedDate(-3)
              else shiftSelectedDate(-1)
            }
          }}
        >
          {viewMode === 'month' ? (
            <>
              <div className={`grid ${gridColsClass} border-b border-sand-dark/60 bg-offwhite/60`}>
                {prefs.showWeekNumbers ? <div className="py-2 text-center text-xs font-semibold text-charcoal/40">#</div> : null}
                {weekdayLabels.map((w) => (
                  <div key={w} className="py-2 text-center text-xs font-semibold text-charcoal/70">
                    {w}
                  </div>
                ))}
              </div>

              <div>
                {weeks.map((week, weekIdx) => (
                  <div key={`week-${weekIdx}`} className={`grid ${gridColsClass}`}>
                    {prefs.showWeekNumbers ? (
                      <div className="h-28 sm:h-32 border-b border-r border-sand-dark/40 bg-offwhite/60 p-1.5 text-center text-xs font-semibold text-charcoal/50">
                        {isoWeekNumber(week[0]!)}
                      </div>
                    ) : null}

                    {week.map((day) => {
                      const k = dateKey(day)
                      const inMonth = day.getMonth() === monthStart.getMonth()
                      const isSelected = k === selectedKey
                      const isToday = k === todayKey
                      const allEvents = eventsByDayRaw.get(k) ?? []
                      const events = eventsByDayVisible.get(k) ?? []
                      const visible = events.slice(0, 4)
                      const extraCount = Math.max(0, events.length - visible.length)

                      return (
                        <button
                          key={k}
                          type="button"
                          className={[
                            'relative h-28 sm:h-32 border-b border-r border-sand-dark/40 p-1.5 text-left align-top',
                            inMonth ? 'bg-white' : 'bg-sand-light/70',
                            isSelected ? 'bg-sage-light/35' : '',
                          ].join(' ')}
                          onClick={() => {
                            if (ignoreNextCellClickRef.current) return
                            setSelectedDateAndCursor(day)

                            if (eventsQuery.isSuccess && allEvents.length === 0) {
                              openAddEventForDay(day)
                            }
                          }}
                        >
                          <div className="flex items-start justify-end">
                            <span
                              className={[
                                'grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-semibold leading-none',
                                inMonth ? 'text-charcoal/80' : 'text-charcoal/40',
                                isToday ? 'bg-forest text-white' : '',
                                isSelected && !isToday ? 'bg-sage-dark text-white' : '',
                              ].join(' ')}
                            >
                              {day.getDate()}
                            </span>
                          </div>

                          <div className="mt-1 space-y-1 overflow-hidden">
                            {visible.map((e) => {
                              const title = (e.title ?? 'Sem título').trim() || 'Sem título'
                              const color = getEventColor(e)
                              return (
                                <div
                                  key={`${e.id ?? 'event'}-${e.startUtc ?? ''}`}
                                  title={title}
                                  className="w-full truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
                                  style={{ backgroundColor: color }}
                                >
                                  {title}
                                </div>
                              )
                            })}

                            {extraCount > 0 ? (
                              <div className="text-[10px] font-semibold text-charcoal/60">+{extraCount} mais</div>
                            ) : null}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          ) : viewMode === 'family' ? (
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-bold text-charcoal">Visão da Família</div>
                  <div className="truncate text-sm text-charcoal/60">{formatDayHeader(selectedDate)}</div>
                </div>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light text-sage-dark"
                  onClick={() => openAddEventForDay(selectedDate)}
                  aria-label="Adicionar evento"
                >
                  <i className="ri-add-line text-2xl leading-none" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {familyMembersQuery.data && familyMembersQuery.data.length > 0 ? (
                  familyMembersQuery.data
                    .slice()
                    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt-PT', { sensitivity: 'base' }))
                    .map((m) => {
                      const id = m.userId ?? ''
                      if (!id) return null

                      const dayEvents = eventsByDayVisible.get(selectedKey) ?? []
                      const events = dayEvents.filter((e) => {
                        const ids = e.participantUserIds ?? null
                        if (!ids || ids.length === 0) return true
                        return ids.includes(id)
                      })

                      return (
                        <div key={id} className="rounded-2xl border border-sand-dark/60 bg-white shadow-sm">
                          <div className="flex items-center gap-3 border-b border-sand-dark/40 px-4 py-3">
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-sand-light text-charcoal/70 font-semibold">
                              {safeInitial(m.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-charcoal">{m.name ?? '—'}</div>
                              {m.email ? <div className="truncate text-xs text-charcoal/50">{m.email}</div> : null}
                            </div>
                          </div>

                          <div className="px-4 py-3">
                            {events.length === 0 ? (
                              <div className="text-sm text-charcoal/50">Sem eventos</div>
                            ) : (
                              <div className="space-y-2">
                                {events.map((e) => (
                                  <EventRow key={`${e.id ?? 'event'}-${e.startUtc ?? ''}`} event={e} />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                ) : familyMembersQuery.isLoading ? (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="text-sm text-charcoal/50">Sem membros para filtrar.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-sand-dark/40">
              {(viewMode === 'day'
                ? [selectedDate]
                : viewMode === 'threeDays'
                  ? threeDayRange
                  : viewMode === 'week'
                    ? weekDays
                    : monthDays
              ).map((day) => {
                const k = dateKey(day)
                const isSelected = k === selectedKey
                const isToday = k === todayKey
                const events = eventsByDayVisible.get(k) ?? []
                return (
                  <div key={k} className={['px-4 py-3', isSelected ? 'bg-sage-light/25' : ''].join(' ')}>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        className="min-w-0 text-left"
                        onClick={() => setSelectedDateAndCursor(day)}
                        aria-label={`Selecionar ${formatDayHeader(day)}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              'grid h-7 min-w-7 place-items-center rounded-full px-1 text-xs font-semibold leading-none',
                              isToday ? 'bg-forest text-white' : 'bg-sand-light text-charcoal/70',
                            ].join(' ')}
                          >
                            {day.getDate()}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-charcoal">{formatDayHeader(day)}</div>
                            <div className="truncate text-xs text-charcoal/50">
                              {events.length === 0 ? 'Sem eventos' : `${events.length} evento${events.length === 1 ? '' : 's'}`}
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-full hover:bg-sand-light text-sage-dark"
                        onClick={() => openAddEventForDay(day)}
                        aria-label="Adicionar evento"
                      >
                        <i className="ri-add-line text-xl leading-none" />
                      </button>
                    </div>

                    {events.length === 0 ? (
                      <div className="mt-3 text-sm text-charcoal/45">Nenhum evento para este dia.</div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {events.map((e) => (
                          <EventRow key={`${e.id ?? 'event'}-${e.startUtc ?? ''}`} event={e} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {eventsQuery.isFetching && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/35">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-sand-dark/60 bg-offwhite/90 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <div className="grid grid-cols-3">
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1 text-charcoal/70 hover:text-forest"
              onClick={() => {
                const d = new Date()
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
                setSelectedDate(d)
              }}
            >
              <i className="ri-time-line text-xl leading-none" />
              <span className="text-xs font-semibold">Hoje</span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1 text-charcoal/70 hover:text-forest"
              onClick={() => openAddEventForDay(selectedDate)}
            >
              <i className="ri-add-circle-line text-xl leading-none" />
              <span className="text-xs font-semibold">Adicionar</span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1 text-charcoal/70 hover:text-forest"
              onClick={() => {
                setSearchOpen(false)
                setIsFilterOpen(true)
              }}
            >
              <i className="ri-filter-3-line text-xl leading-none" />
              <span className="text-xs font-semibold">Filtrar</span>
            </button>
          </div>
        </div>
      </footer>

      {isJumpToDateOpen ? (
        <JumpToDateSheet
          initialMonthStart={monthStart}
          initialSelectedDate={selectedDate}
          firstDayOfWeek={prefs.firstDayOfWeek}
          onClose={() => setIsJumpToDateOpen(false)}
          onConfirm={(d) => {
            setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
            setSelectedDate(d)
            setIsJumpToDateOpen(false)
          }}
        />
      ) : null}

      {addEventDate ? (
        <AddEventSheet
          initialDate={addEventDate}
          defaultReminderMinutes={prefs.defaultReminderMinutes}
          isSaving={createEventMutation.isPending}
          errorMessage={createEventError}
          onClose={() => setAddEventDate(null)}
          onSave={(req) => {
            setCreateEventError(null)
            createEventMutation.mutate(req)
          }}
        />
      ) : null}

      {isViewMenuOpen ? (
        <CalendarViewMenu
          value={viewMode}
          onClose={() => setIsViewMenuOpen(false)}
          onChange={(v) => patchPrefs({ viewMode: v })}
        />
      ) : null}

      {isFilterOpen ? (
        <CalendarFilterSheet
          members={familyMembersQuery.data ?? []}
          initialSelectedUserIds={filterUserIds}
          onClose={() => setIsFilterOpen(false)}
          onSave={(selected) => {
            const allIds =
              (familyMembersQuery.data ?? [])
                .map((m) => m.userId ?? '')
                .filter(Boolean)
            const normalized = selected.filter(Boolean)
            const isAll = allIds.length > 0 && normalized.length === allIds.length && allIds.every((id) => normalized.includes(id))
            setFilterUserIds(isAll ? [] : normalized)
            setIsFilterOpen(false)
          }}
        />
      ) : null}

      {isSettingsOpen ? (
        <CalendarSettingsSheet
          token={token}
          prefs={prefs}
          visibleEventIds={visibleEventIds}
          onClose={() => setIsSettingsOpen(false)}
          onSave={(nextPrefs) => setPrefsPersist(nextPrefs)}
        />
      ) : null}
    </div>
  )
}

function formatMutationError(err: unknown): string {
  if (err instanceof ApiError) {
    if (typeof err.body === 'string' && err.body.trim()) return err.body
    try {
      return JSON.stringify(err.body, null, 2)
    } catch {
      return 'Erro ao criar evento.'
    }
  }
  if (err instanceof Error && err.message) return err.message
  return 'Erro ao criar evento.'
}

function normalizeColorHex(input: string | null | undefined): string | null {
  const raw = (input ?? '').trim()
  if (!raw) return null

  const withHash = raw.startsWith('#') ? raw : `#${raw}`
  if (/^#[0-9a-fA-F]{6}$/.test(withHash) || /^#[0-9a-fA-F]{3}$/.test(withHash)) return withHash
  return null
}

function getEventColor(e: CalendarResponse): string {
  const normalized = normalizeColorHex(e.colorHex)
  if (normalized) return normalized

  const palette = [
    'var(--color-amber-dark)',
    'var(--color-forest)',
    'var(--color-sage-dark)',
    'var(--color-amber)',
    '#7c3aed',
    '#0ea5e9',
    '#ef4444',
  ]

  const seed = (e.id ?? e.title ?? '').trim()
  const idx = Math.abs(hashString(seed)) % palette.length
  return palette[idx] ?? 'var(--color-amber)'
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return h
}

function groupEventsByDay(rows: CalendarResponse[]): Map<string, CalendarResponse[]> {
  const map = new Map<string, CalendarResponse[]>()

  for (const e of rows) {
    if (!e.startUtc) continue
    const d = new Date(e.startUtc)
    if (Number.isNaN(d.getTime())) continue

    const k = dateKey(d)
    const list = map.get(k) ?? []
    list.push(e)
    map.set(k, list)
  }

  for (const [k, list] of map.entries()) {
    list.sort((a, b) => (a.startUtc ?? '').localeCompare(b.startUtc ?? ''))
    map.set(k, list)
  }

  return map
}

function viewModeIcon(mode: CalendarViewMode): string {
  switch (mode) {
    case 'agenda':
      return 'ri-list-check-2'
    case 'family':
      return 'ri-group-line'
    case 'day':
      return 'ri-calendar-event-line'
    case 'threeDays':
      return 'ri-calendar-schedule-line'
    case 'week':
      return 'ri-calendar-2-line'
    case 'month':
      return 'ri-layout-grid-line'
    default:
      return 'ri-layout-grid-line'
  }
}

function chunkIntoWeeks<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items]
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function isoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const diffDays = Math.floor((date.getTime() - yearStart.getTime()) / 86400000) + 1
  return Math.ceil(diffDays / 7)
}

function formatDayHeader(d: Date): string {
  const raw = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
  return capitalizeFirst(raw)
}

function safeInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}

function EventRow({ event }: { event: CalendarResponse }) {
  const title = (event.title ?? 'Sem título').trim() || 'Sem título'
  const color = getEventColor(event)
  const time = formatEventTimeRange(event)

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-sm font-semibold text-charcoal">{title}</div>
          {time ? <div className="shrink-0 text-xs font-semibold text-charcoal/55">{time}</div> : null}
        </div>
        {event.location ? <div className="truncate text-xs text-charcoal/45">{event.location}</div> : null}
      </div>
    </div>
  )
}

function formatEventTimeRange(e: CalendarResponse): string | null {
  if (e.isAllDay) return 'Dia inteiro'
  if (!e.startUtc) return null

  const start = new Date(e.startUtc)
  if (Number.isNaN(start.getTime())) return null

  const startStr = start.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

  if (!e.endUtc) return startStr
  const end = new Date(e.endUtc)
  if (Number.isNaN(end.getTime())) return startStr

  const endStr = end.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  return `${startStr}–${endStr}`
}
