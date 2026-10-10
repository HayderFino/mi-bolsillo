import type { ExpenseFilter } from '../../services/expenseService'
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

/**
 * Translates UI filter state to the service filter. The same function must feed the list and,
 * later, the totals and charts, so every indicator uses identical filters.
 */
export function toExpenseFilter(state: FilterState, today: string = todayLocal()): FilterResult {
  const filter: ExpenseFilter = {}

  if (state.period === 'month') {
    Object.assign(filter, monthRange(yearMonthOf(today)))
  } else if (state.period === 'prevMonth') {
    Object.assign(filter, monthRange(previousYearMonth(yearMonthOf(today))))
  } else if (state.period === 'custom') {
    if (isValidDate(state.from)) filter.from = state.from
    if (isValidDate(state.to)) filter.to = state.to
    if (filter.from && filter.to && filter.from > filter.to) {
      return { filter: null, error: MESSAGES.dateRangeInvalid }
    }
  }

  if (state.categoryId !== '') filter.categoryId = Number(state.categoryId)
  if (state.paymentMethod !== '') filter.paymentMethod = state.paymentMethod
  if (state.search.trim() !== '') filter.search = state.search
  return { filter }
}
