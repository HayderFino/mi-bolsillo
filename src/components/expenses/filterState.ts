import type { ExpenseFilter } from '../../services/expenseService'
import type { IncomeFilter } from '../../services/incomeService'
import { MESSAGES } from '../../services/messages'
import type { PaymentMethod } from '../../types'
import { isValidDate, monthRange, previousYearMonth, todayLocal, yearMonthOf } from '../../utils/dates'

export type Period = 'all' | 'month' | 'prevMonth' | 'custom'

/** Filter values as edited in the UI (strings straight from the controls). */
export interface FilterState {
  search: string
  period: Period
  /** Only used when `period` is `custom`; `YYYY-MM-DD` or empty. */
  from: string
  to: string
  /** Category id as string, or empty for all. */
  categoryId: string
  paymentMethod: '' | PaymentMethod
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  period: 'all',
  from: '',
  to: '',
  categoryId: '',
  paymentMethod: '',
}

/** Number of filters active besides the search box (shown on the "Filtros" toggle). */
export function activeFilterCount(state: FilterState): number {
  return [state.period !== 'all', state.categoryId !== '', state.paymentMethod !== ''].filter(Boolean).length
}

export function hasActiveFilters(state: FilterState): boolean {
  return state.search.trim() !== '' || activeFilterCount(state) > 0
}

export interface FilterResult {
  /** `null` when the state is invalid (no query must run); see `error`. */
  filter: ExpenseFilter | null
  error?: string
}

export interface IncomeFilterResult {
  /** `null` when the state is invalid (no query must run); see `error`. */
  filter: IncomeFilter | null
  error?: string
}

/**
 * Translates UI filter state to the service filter. The same function must feed the list and,
 * later, the totals and charts, so every indicator uses identical filters.
 */
export function toExpenseFilter(state: FilterState, today: string = todayLocal()): FilterResult {
  const { from, to, error } = resolveRange(state, today)
  if (error) return { filter: null, error }

  const filter: ExpenseFilter = { ...from }
  Object.assign(filter, to)
  if (state.categoryId !== '') filter.categoryId = Number(state.categoryId)
  if (state.paymentMethod !== '') filter.paymentMethod = state.paymentMethod
  if (state.search.trim() !== '') filter.search = state.search
  return { filter }
}

/** Builds the income service filter from the same UI state (only the category field name changes). */
export function toIncomeFilter(state: FilterState, today: string = todayLocal()): IncomeFilterResult {
  const { from, to, error } = resolveRange(state, today)
  if (error) return { filter: null, error }

  const filter: IncomeFilter = { ...from, ...to }
  if (state.categoryId !== '') filter.incomeCategoryId = Number(state.categoryId)
  if (state.paymentMethod !== '') filter.paymentMethod = state.paymentMethod
  if (state.search.trim() !== '') filter.search = state.search
  return { filter }
}

interface RangeParts {
  from: Pick<ExpenseFilter, 'from' | 'to'>
  to: Pick<ExpenseFilter, 'from' | 'to'>
  error?: string
}

/** Shared period/custom-range resolution for both services. */
function resolveRange(state: FilterState, today: string): RangeParts {
  const empty: RangeParts = { from: {}, to: {} }
  if (state.period === 'month') {
    const range = monthRange(yearMonthOf(today))
    return { from: range, to: range }
  }
  if (state.period === 'prevMonth') {
    const range = monthRange(previousYearMonth(yearMonthOf(today)))
    return { from: range, to: range }
  }
  if (state.period === 'custom') {
    const range: Pick<ExpenseFilter, 'from' | 'to'> = {}
    if (isValidDate(state.from)) range.from = state.from
    if (isValidDate(state.to)) range.to = state.to
    if (range.from && range.to && range.from > range.to) {
      return { ...empty, error: MESSAGES.dateRangeInvalid }
    }
    return { from: range, to: range }
  }
  return empty
}
