import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  domusApi,
  type CreateFinanceTransactionRequest,
  type FinanceTransactionResponse,
  type UpdateFinanceTransactionRequest,
} from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { queryKeys } from '../../api/queryKeys'
import { useI18n } from '../../i18n/i18n'
import { BottomSheetPicker, type BottomSheetOption } from '../../ui/BottomSheetPicker'
import { DatePickerSheet } from '../../ui/DatePickerSheet'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { getFinanceCategoryDisplayName } from '../../utils/categoryLocalization'
import { iconKeyToEmoji } from '../../utils/emojiIconKey'
import { financeCategoryEmoji } from '../../utils/financeCategoryEmoji'

type Props = {
  token: string
  budgetId: string
  currencyCode: string
  defaultDate: string
  transaction?: FinanceTransactionResponse | null
  onClose: () => void
  onSaved: () => void
}

type TransactionType = 'Expense' | 'Income'
type RepeatType = 'None' | 'Daily' | 'Weekdays' | 'Weekly' | 'BiWeekly' | 'Monthly' | 'Yearly' | 'Custom'
type ReminderType = 'None' | 'SameDayAt0900' | 'PreviousDayAt1800' | 'OneDayBeforeAt0900' | 'TwoDaysBeforeAt0900' | 'Custom'
type PickerId = null | 'type' | 'category' | 'account' | 'paidBy' | 'repeat' | 'reminder'

const TYPE_OPTION_KEYS = [
  { id: 'Expense', labelKey: 'budget.type.expense' },
  { id: 'Income', labelKey: 'budget.type.income' },
] as const

const REPEAT_OPTION_KEYS = [
  { id: 'None', labelKey: 'budget.repeat.none' },
  { id: 'Daily', labelKey: 'budget.repeat.daily' },
  { id: 'Weekdays', labelKey: 'budget.repeat.weekdays' },
  { id: 'Weekly', labelKey: 'budget.repeat.weekly' },
  { id: 'BiWeekly', labelKey: 'budget.repeat.biWeekly' },
  { id: 'Monthly', labelKey: 'budget.repeat.monthly' },
  { id: 'Yearly', labelKey: 'budget.repeat.yearly' },
] as const

const REMINDER_OPTION_KEYS = [
  { id: 'None', labelKey: 'budget.reminder.none' },
  { id: 'SameDayAt0900', labelKey: 'budget.reminder.sameDayAt0900' },
  { id: 'PreviousDayAt1800', labelKey: 'budget.reminder.previousDayAt1800' },
  { id: 'OneDayBeforeAt0900', labelKey: 'budget.reminder.oneDayBeforeAt0900' },
  { id: 'TwoDaysBeforeAt0900', labelKey: 'budget.reminder.twoDaysBeforeAt0900' },
] as const

type RowButtonProps = {
  left: ReactNode
  label: string
  onPress: () => void
  right?: ReactNode
  disabled?: boolean
  labelClassName?: string
}

function RowButton({ left, label, onPress, right, disabled, labelClassName }: RowButtonProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left hover:bg-sand-light disabled:opacity-60"
      onClick={onPress}
      disabled={disabled}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-7 w-7 shrink-0 place-items-center">{left}</div>
        <div className={`truncate ${labelClassName ?? 'text-charcoal'}`}>{label}</div>
      </div>
      {right ?? <i className="ri-arrow-right-s-line text-2xl text-sage-dark" aria-hidden="true" />}
    </button>
  )
}

function NoteSheet({ value, onClose, onSave }: { value: string; onClose: () => void; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  const { t } = useI18n()

  return (
    <div className="fixed inset-0 z-110">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              onClick={onClose}
              aria-label={t('common.cancel')}
              title={t('common.cancel')}
            >
              <i className="ri-close-line text-2xl text-sage-dark" />
            </button>
            <div className="text-base font-semibold text-forest">{t('common.note')}</div>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              onClick={() => onSave(draft)}
              aria-label={t('common.save')}
              title={t('common.save')}
            >
              <i className="ri-check-line text-2xl text-sage-dark" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('budget.transaction.note.placeholder')}
            className="min-h-35 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-charcoal outline-none focus:ring-2 focus:ring-blue-500/25 placeholder:text-gray-300"
          />
        </div>
      </div>
    </div>
  )
}

function formatDateLabel(dateUtc: string, todayUtc: string, locale: string, todayLabel: string): string {
  if (!dateUtc) return '—'
  if (dateUtc === todayUtc) return todayLabel

  const d = new Date(`${dateUtc}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return dateUtc
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function AddTransactionSheet({ token, budgetId, currencyCode, defaultDate, transaction, onClose, onSaved }: Props) {
  const titleRef = useRef<HTMLInputElement | null>(null)
  const prevTypeRef = useRef<TransactionType | null>(null)
  const { t, locale, language } = useI18n()

  const isEditing = Boolean(transaction?.id)
  const transactionId = transaction?.id ?? null

  const [type, setType] = useState<TransactionType>(() =>
    (transaction?.type ?? '').toLowerCase() === 'income' ? 'Income' : 'Expense',
  )
  const [title, setTitle] = useState('')
  const [amountText, setAmountText] = useState('')
  const [date, setDate] = useState(() => transaction?.date ?? defaultDate)
  const [categoryId, setCategoryId] = useState<string | null>(() => transaction?.categoryId ?? null)
  const [accountId, setAccountId] = useState<string | null>(() => transaction?.accountId ?? null)
  const [paidByUserId, setPaidByUserId] = useState<string | null>(() => transaction?.paidByUserId ?? null)
  const [isPaid, setIsPaid] = useState(() => Boolean(transaction?.isPaid ?? true))
  const [repeatType, setRepeatType] = useState<RepeatType>(() => (transaction?.repeatType as RepeatType) ?? 'None')
  const [repeatInterval, setRepeatInterval] = useState<number | null>(() => transaction?.repeatInterval ?? null)
  const [repeatUnit, setRepeatUnit] = useState<string | null>(() => transaction?.repeatUnit ?? null)
  const [reminderType, setReminderType] = useState<ReminderType>(() => (transaction?.reminderType as ReminderType) ?? 'None')
  const [reminderValue, setReminderValue] = useState<number | null>(() => transaction?.reminderValue ?? null)
  const [reminderUnit, setReminderUnit] = useState<string | null>(() => transaction?.reminderUnit ?? null)
  const [note, setNote] = useState(() => transaction?.note ?? '')

  const [picker, setPicker] = useState<PickerId>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const categoriesQuery = useQuery({
    queryKey: queryKeys.financeCategories(type),
    queryFn: () => domusApi.getFinanceCategories(token, type),
  })

  const visibleAccountsQuery = useQuery({
    queryKey: queryKeys.budgetAccountsVisible(budgetId),
    queryFn: () => domusApi.getBudgetVisibleAccounts(token, budgetId),
  })

  const isAccountVisible = Boolean(accountId) && (visibleAccountsQuery.data ?? []).some((a) => a.id === accountId)

  const hiddenAccountsQuery = useQuery({
    queryKey: queryKeys.budgetAccountsHidden(budgetId),
    queryFn: () => domusApi.getBudgetHiddenAccounts(token, budgetId),
    enabled: Boolean(accountId) && !isAccountVisible,
  })

  const membersQuery = useQuery({
    queryKey: queryKeys.budgetMembers(budgetId),
    queryFn: () => domusApi.getBudgetMembers(token, budgetId),
  })

  useEffect(() => {
    if (!transactionId) return

    setType((transaction?.type ?? '').toLowerCase() === 'income' ? 'Income' : 'Expense')
    setTitle((transaction?.title ?? '').trim())
    setAmountText(transaction?.amount === null || transaction?.amount === undefined ? '' : String(Math.abs(transaction.amount)))
    setDate(transaction?.date ?? defaultDate)
    setCategoryId(transaction?.categoryId ?? null)
    setAccountId(transaction?.accountId ?? null)
    setPaidByUserId(transaction?.paidByUserId ?? null)
    setIsPaid(Boolean(transaction?.isPaid ?? true))
    setRepeatType(((transaction?.repeatType as RepeatType) ?? 'None'))
    setRepeatInterval(transaction?.repeatInterval ?? null)
    setRepeatUnit(transaction?.repeatUnit ?? null)
    setReminderType(((transaction?.reminderType as ReminderType) ?? 'None'))
    setReminderValue(transaction?.reminderValue ?? null)
    setReminderUnit(transaction?.reminderUnit ?? null)
    setNote(transaction?.note ?? '')
  }, [defaultDate, transaction, transactionId])

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    const first = categoriesQuery.data?.find((c) => Boolean(c.id))?.id ?? null
    setCategoryId((prev) => (prev ? prev : first))
  }, [categoriesQuery.data])

  useEffect(() => {
    const first = visibleAccountsQuery.data?.find((a) => Boolean(a.id))?.id ?? null
    setAccountId((prev) => (prev ? prev : first))
  }, [visibleAccountsQuery.data])

  useEffect(() => {
    const me = getUserIdFromAccessToken(token)
    const members = membersQuery.data ?? []
    const best = (me && members.some((m) => m.userId === me) ? me : members.find((m) => Boolean(m.userId))?.userId) ?? null
    setPaidByUserId((prev) => (prev ? prev : best))
  }, [membersQuery.data, token])

  useEffect(() => {
    const prev = prevTypeRef.current
    prevTypeRef.current = type
    if (prev === null) return
    setCategoryId(null)
  }, [type])

  const amountValue = useMemo(() => {
    const cleaned = amountText.replace(',', '.').trim()
    const n = Number.parseFloat(cleaned)
    return Number.isFinite(n) ? n : null
  }, [amountText])

  const selectedCategory = useMemo(() => {
    if (!categoryId) return null
    return (categoriesQuery.data ?? []).find((c) => c.id === categoryId) ?? null
  }, [categoriesQuery.data, categoryId])

  const selectedAccount = useMemo(() => {
    if (!accountId) return null
    return (
      (visibleAccountsQuery.data ?? []).find((a) => a.id === accountId) ??
      (hiddenAccountsQuery.data ?? []).find((a) => a.id === accountId) ??
      null
    )
  }, [accountId, hiddenAccountsQuery.data, visibleAccountsQuery.data])

  const selectedMember = useMemo(() => {
    if (!paidByUserId) return null
    return (membersQuery.data ?? []).find((m) => m.userId === paidByUserId) ?? null
  }, [membersQuery.data, paidByUserId])

  const categoriesOptions = useMemo<BottomSheetOption[]>(() => {
    return (categoriesQuery.data ?? [])
      .filter((c) => Boolean(c.id))
      .map((c) => {
        const emoji = financeCategoryEmoji({ iconKey: c.iconKey ?? null, name: c.name ?? null, type })
        const rawName = (c.name ?? '').trim()
        const name = getFinanceCategoryDisplayName({ type, iconKey: c.iconKey ?? null, name: rawName, language }) || '—'
        return { id: c.id!, label: `${emoji} ${name}` }
      })
  }, [categoriesQuery.data, language, type])

  const selectedCategoryLabel = useMemo(() => {
    const rawName = (selectedCategory?.name ?? '').trim()
    const name = getFinanceCategoryDisplayName({ type, iconKey: selectedCategory?.iconKey ?? null, name: rawName, language })
    return name.trim() ? name : null
  }, [language, selectedCategory?.iconKey, selectedCategory?.name, type])

  const accountsOptions = useMemo<BottomSheetOption[]>(() => {
    const visible = (visibleAccountsQuery.data ?? []).filter((a) => Boolean(a.id))
    const options = visible.map((a) => {
      const emoji = iconKeyToEmoji(a.iconKey ?? null) ?? '🏦'
      return { id: a.id!, label: `${emoji} ${a.name ?? '—'}` }
    })

    const selectedId = accountId
    const selected = selectedAccount
    const selectedIsVisible = Boolean(selectedId) && visible.some((a) => a.id === selectedId)
    if (selected && selected.id && !selectedIsVisible) {
      const emoji = iconKeyToEmoji(selected.iconKey ?? null) ?? '🏦'
      options.unshift({ id: selected.id, label: `${emoji} ${selected.name ?? '—'} · ${t('budget.accounts.hidden.badge')}` })
    }

    return options
  }, [accountId, selectedAccount, t, visibleAccountsQuery.data])

  const membersOptions = useMemo<BottomSheetOption[]>(() => {
    return (membersQuery.data ?? [])
      .filter((m) => Boolean(m.userId))
      .map((m) => ({ id: m.userId!, label: m.name ?? '—' }))
  }, [membersQuery.data])

  const canSave =
    title.trim().length > 0 &&
    amountValue !== null &&
    amountValue > 0 &&
    Boolean(categoryId) &&
    Boolean(accountId) &&
    Boolean(paidByUserId) &&
    (repeatType !== 'Custom' || (repeatInterval !== null && repeatInterval > 0 && Boolean(repeatUnit))) &&
    (reminderType !== 'Custom' || (reminderValue !== null && reminderValue > 0 && Boolean(reminderUnit))) &&
    !categoriesQuery.isLoading &&
    !visibleAccountsQuery.isLoading &&
    !membersQuery.isLoading

  const createMutation = useMutation({
    mutationFn: (req: CreateFinanceTransactionRequest) => domusApi.createBudgetTransaction(token, budgetId, req),
    onSuccess: () => {
      onClose()
      onSaved()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (req: UpdateFinanceTransactionRequest) => {
      if (!transactionId) throw new Error('Missing transactionId')
      return domusApi.updateBudgetTransaction(token, budgetId, transactionId, req)
    },
    onSuccess: () => {
      onClose()
      onSaved()
    },
  })

  const activeMutation = isEditing ? updateMutation : createMutation

  const errorMessage = useMemo(() => {
    const err = activeMutation.error
    if (!err) return null
    if (err instanceof ApiError) return typeof err.body === 'string' ? err.body : JSON.stringify(err.body, null, 2)
    return err instanceof Error ? err.message : String(err)
  }, [activeMutation.error])

  const submit = () => {
    if (!canSave || amountValue === null || !categoryId || !accountId || !paidByUserId) return

    const normalizedNote = note.trim() ? note.trim() : null

    if (isEditing) {
      const request: UpdateFinanceTransactionRequest = {
        title: title.trim(),
        amount: amountValue,
        type,
        categoryId,
        accountId,
        paidByUserId,
        date: date || null,
        isPaid,
        repeatType,
        repeatInterval: repeatType === 'Custom' ? repeatInterval : null,
        repeatUnit: repeatType === 'Custom' ? repeatUnit : null,
        reminderType,
        reminderValue: reminderType === 'Custom' ? reminderValue : null,
        reminderUnit: reminderType === 'Custom' ? reminderUnit : null,
        note: normalizedNote,
        noteChangeRequested: true,
      }

      updateMutation.mutate(request)
      return
    }

    const request: CreateFinanceTransactionRequest = {
      title: title.trim(),
      amount: amountValue,
      type,
      categoryId,
      accountId,
      paidByUserId,
      date: date || null,
      isPaid,
      repeatType,
      reminderType,
      note: normalizedNote,
    }

    createMutation.mutate(request)
  }

  const typeOptions = useMemo<BottomSheetOption[]>(() => {
    return TYPE_OPTION_KEYS.map((o) => ({ id: o.id, label: t(o.labelKey) }))
  }, [t])

  const repeatOptions = useMemo<BottomSheetOption[]>(() => {
    return REPEAT_OPTION_KEYS.map((o) => ({ id: o.id, label: t(o.labelKey) }))
  }, [t])

  const reminderOptions = useMemo<BottomSheetOption[]>(() => {
    return REMINDER_OPTION_KEYS.map((o) => ({ id: o.id, label: t(o.labelKey) }))
  }, [t])

  const repeatLabel = repeatOptions.find((o) => o.id === repeatType)?.label ?? t('budget.repeat.none')
  const reminderLabel =
    reminderType === 'None'
      ? t('budget.transaction.reminder.add')
      : reminderOptions.find((o) => o.id === reminderType)?.label ?? t('budget.transaction.reminder.add')

  const saveDisabled =
    activeMutation.isPending ||
    !canSave ||
    categoriesQuery.isLoading ||
    visibleAccountsQuery.isLoading ||
    membersQuery.isLoading

  const typeLabel = type === 'Income' ? t('budget.type.income') : t('budget.type.expense')
  const typeIconBg = type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-600'
  const typeIcon = type === 'Income' ? 'ri-arrow-left-up-line' : 'ri-arrow-right-down-line'

  const categoryEmoji = financeCategoryEmoji({ iconKey: selectedCategory?.iconKey ?? null, name: selectedCategory?.name ?? null, type })
  const accountEmoji = iconKeyToEmoji(selectedAccount?.iconKey ?? null) ?? '🏦'

  const meUserId = useMemo(() => getUserIdFromAccessToken(token), [token])
  const paidByLabel = useMemo(() => {
    const name = (selectedMember?.name ?? '').trim()
    if (meUserId && paidByUserId === meUserId) return t('budget.transaction.paidBy.me')
    if (!name) return t('budget.transaction.paidBy.unknown')
    return t('budget.transaction.paidBy.someone', { name })
  }, [meUserId, paidByUserId, selectedMember?.name, t])

  const dateLabel = useMemo(() => formatDateLabel(date, defaultDate, locale, t('common.today')), [date, defaultDate, locale, t])

  return (
    <div className="fixed inset-0 z-80">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={onClose}
              disabled={activeMutation.isPending}
              aria-label={t('common.cancel')}
              title={t('common.cancel')}
            >
              <i className="ri-close-line text-2xl leading-none text-sage-dark" />
            </button>

            <div className="text-lg font-extrabold text-forest">
              {isEditing ? t('budget.transaction.editTitle') : t('budget.transaction.newTitle')}
            </div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={submit}
              disabled={saveDisabled}
              aria-label={t('common.save')}
              title={t('common.save')}
            >
              <i
                className={
                  activeMutation.isPending
                    ? 'ri-loader-4-line animate-spin text-2xl text-sage-dark'
                    : 'ri-check-line text-2xl text-sage-dark'
                }
              />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-64px)] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {errorMessage ? (
            <div className="mx-4 mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
              {errorMessage}
            </div>
          ) : null}

          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex items-end justify-between gap-4">
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('budget.transaction.titlePlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-3xl font-extrabold text-charcoal outline-none placeholder:text-sage-dark/25"
                disabled={activeMutation.isPending}
              />

              <div className="flex items-end gap-2">
                <input
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  inputMode="decimal"
                  placeholder={t('budget.transaction.amountPlaceholder')}
                  className="w-32 bg-transparent text-right text-3xl font-extrabold text-charcoal outline-none placeholder:text-sage-dark/25"
                  disabled={activeMutation.isPending}
                />
                <div className="pb-1 text-sm font-bold text-forest">{currencyCode.toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div className="mx-4 mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <RowButton
              left={
                <div className={`grid h-7 w-7 place-items-center rounded-full ${typeIconBg}`}>
                  <i className={`${typeIcon} text-xl`} aria-hidden="true" />
                </div>
              }
              label={typeLabel}
              onPress={() => setPicker('type')}
              disabled={activeMutation.isPending}
            />

            <RowButton
              left={<span className="text-xl" aria-hidden="true">{categoryEmoji}</span>}
              label={selectedCategoryLabel ?? t('common.category')}
              onPress={() => setPicker('category')}
              disabled={activeMutation.isPending || categoriesQuery.isLoading || categoriesOptions.length === 0}
              right={categoriesQuery.isLoading ? <LoadingSpinner size="sm" /> : undefined}
            />

            <RowButton
              left={<span className="text-xl" aria-hidden="true">{accountEmoji}</span>}
              label={selectedAccount?.name ?? t('common.account')}
              onPress={() => setPicker('account')}
              disabled={activeMutation.isPending || visibleAccountsQuery.isLoading || accountsOptions.length === 0}
              right={visibleAccountsQuery.isLoading || hiddenAccountsQuery.isLoading ? <LoadingSpinner size="sm" /> : undefined}
            />

            <RowButton
              left={
                <div className="grid h-7 w-7 place-items-center rounded-full bg-sage-dark text-sm text-white" aria-hidden="true">
                  {safeAvatarText(selectedMember?.name)}
                </div>
              }
              label={paidByLabel}
              onPress={() => setPicker('paidBy')}
              disabled={activeMutation.isPending || membersQuery.isLoading || membersOptions.length === 0}
              right={membersQuery.isLoading ? <LoadingSpinner size="sm" /> : undefined}
            />

            <RowButton
              left={<i className="ri-time-line text-xl text-sage-dark" aria-hidden="true" />}
              label={dateLabel}
              onPress={() => setDatePickerOpen(true)}
              disabled={activeMutation.isPending}
            />

            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid h-7 w-7 shrink-0 place-items-center">
                  <i className="ri-checkbox-circle-line text-xl text-sage-dark" aria-hidden="true" />
                </div>
                <div className="truncate text-charcoal">{t('budget.transaction.markAsPaid')}</div>
              </div>
              <button
                type="button"
                className={`relative h-7 w-12 rounded-full transition ${isPaid ? 'bg-sage-dark' : 'bg-gray-200'}`}
                onClick={() => setIsPaid((v) => !v)}
                disabled={activeMutation.isPending}
                aria-label={t('budget.transaction.markAsPaid')}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${isPaid ? 'left-6' : 'left-0.5'}`}
                />
              </button>
            </div>

            <RowButton
              left={<i className="ri-repeat-2-line text-xl text-sage-dark" aria-hidden="true" />}
              label={repeatLabel}
              onPress={() => setPicker('repeat')}
              disabled={activeMutation.isPending}
            />

            <RowButton
              left={<i className="ri-notification-3-line text-xl text-sage-dark" aria-hidden="true" />}
              label={reminderLabel}
              labelClassName={reminderType === 'None' ? 'text-gray-300' : 'text-charcoal'}
              onPress={() => setPicker('reminder')}
              disabled={activeMutation.isPending}
            />

            <RowButton
              left={<i className="ri-image-add-line text-xl text-sage-dark" aria-hidden="true" />}
              label={t('budget.transaction.photo.add')}
              labelClassName="text-gray-300"
              onPress={() => window.alert(t('common.comingSoon'))}
              disabled
            />

            <RowButton
              left={<i className="ri-sticky-note-line text-xl text-sage-dark" aria-hidden="true" />}
              label={note.trim() ? note.trim() : t('budget.transaction.note.add')}
              labelClassName={note.trim() ? 'text-charcoal' : 'text-gray-300'}
              onPress={() => setNoteOpen(true)}
              disabled={activeMutation.isPending}
            />
          </div>
        </div>
      </div>

      {picker === 'type' ? (
        <BottomSheetPicker
          title={t('common.type')}
          options={typeOptions}
          selectedId={type}
          onSelect={(id) => id && setType(id === 'Income' ? 'Income' : 'Expense')}
          onClose={() => setPicker(null)}
          zIndexClass="z-[100]"
        />
      ) : null}

      {picker === 'category' ? (
        <BottomSheetPicker
          title={t('common.category')}
          options={categoriesOptions}
          selectedId={categoryId}
          onSelect={(id) => setCategoryId(id)}
          onClose={() => setPicker(null)}
          isLoading={categoriesQuery.isLoading}
          zIndexClass="z-[100]"
        />
      ) : null}

      {picker === 'account' ? (
        <BottomSheetPicker
          title={t('common.account')}
          options={accountsOptions}
          selectedId={accountId}
          onSelect={(id) => setAccountId(id)}
          onClose={() => setPicker(null)}
          isLoading={visibleAccountsQuery.isLoading || hiddenAccountsQuery.isLoading}
          zIndexClass="z-[100]"
        />
      ) : null}

      {picker === 'paidBy' ? (
        <BottomSheetPicker
          title={t('budget.transaction.paidBy.title')}
          options={membersOptions}
          selectedId={paidByUserId}
          onSelect={(id) => setPaidByUserId(id)}
          onClose={() => setPicker(null)}
          isLoading={membersQuery.isLoading}
          zIndexClass="z-[100]"
        />
      ) : null}

      {picker === 'repeat' ? (
        <BottomSheetPicker
          title={t('budget.transaction.repeat.title')}
          options={repeatOptions}
          selectedId={repeatType}
          onSelect={(id) => id && setRepeatType(id as RepeatType)}
          onClose={() => setPicker(null)}
          zIndexClass="z-[100]"
        />
      ) : null}

      {picker === 'reminder' ? (
        <BottomSheetPicker
          title={t('budget.transaction.reminder.title')}
          options={reminderOptions}
          selectedId={reminderType}
          onSelect={(id) => id && setReminderType(id as ReminderType)}
          onClose={() => setPicker(null)}
          zIndexClass="z-[100]"
        />
      ) : null}

      {datePickerOpen ? (
        <DatePickerSheet
          title={t('common.date')}
          value={date || null}
          onClose={() => setDatePickerOpen(false)}
          onConfirm={(v) => {
            if (typeof v === 'string') setDate(v)
            setDatePickerOpen(false)
          }}
          isBusy={activeMutation.isPending}
          zIndexClass="z-[120]"
        />
      ) : null}

      {noteOpen ? (
        <NoteSheet
          value={note}
          onClose={() => setNoteOpen(false)}
          onSave={(v) => {
            setNoteOpen(false)
            setNote(v)
          }}
        />
      ) : null}
    </div>
  )
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const payload = parts[1]!
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const json = atob(padded)

    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function getUserIdFromAccessToken(token: string): string | null {
  const payload = decodeJwtPayload(token)
  const sub = payload?.sub
  return typeof sub === 'string' ? sub : null
}

function safeAvatarText(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return '—'

  const chars = Array.from(trimmed)
  if (chars.length === 1) return chars[0]!.toLocaleUpperCase()
  return `${chars[0]!.toLocaleUpperCase()}${chars[1]!.toLocaleLowerCase()}`
}
