import { describe, expect, it } from 'vitest'
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  hasActiveFilters,
  toExpenseFilter,
  type FilterState,
} from '../src/components/expenses/filterState'

const state = (changes: Partial<FilterState>): FilterState => ({ ...DEFAULT_FILTERS, ...changes })

describe('toExpenseFilter', () => {
  it('default state means no filtering', () => {
    expect(toExpenseFilter(DEFAULT_FILTERS, '2025-03-15')).toEqual({ filter: {} })
  })

  it('"this month" covers the whole current month', () => {
    expect(toExpenseFilter(state({ period: 'month' }), '2025-03-15').filter).toEqual({
      from: '2025-03-01',
      to: '2025-03-31',
    })
    expect(toExpenseFilter(state({ period: 'month' }), '2024-02-10').filter).toEqual({
      from: '2024-02-01',
      to: '2024-02-29',
    })
  })

  it('"previous month" rolls back over the year boundary', () => {
    expect(toExpenseFilter(state({ period: 'prevMonth' }), '2026-01-10').filter).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    })
  })

  it('custom ranges may be open-ended', () => {
    expect(toExpenseFilter(state({ period: 'custom', from: '2025-03-10' })).filter).toEqual({ from: '2025-03-10' })
    expect(toExpenseFilter(state({ period: 'custom', to: '2025-03-20' })).filter).toEqual({ to: '2025-03-20' })
    expect(toExpenseFilter(state({ period: 'custom' })).filter).toEqual({})
  })

  it('custom range with from after to is invalid and yields no filter', () => {
    const result = toExpenseFilter(state({ period: 'custom', from: '2025-03-10', to: '2025-03-01' }))
    expect(result.filter).toBeNull()
    expect(result.error).toBeTruthy()
  })

  it('ignores custom dates when another period is selected', () => {
    const result = toExpenseFilter(state({ period: 'all', from: '2025-03-10', to: '2025-03-01' }))
    expect(result).toEqual({ filter: {} })
  })

  it('ignores malformed custom dates', () => {
    expect(toExpenseFilter(state({ period: 'custom', from: 'garbage' })).filter).toEqual({})
  })

  it('maps category, payment method and search', () => {
    const result = toExpenseFilter(state({ categoryId: '3', paymentMethod: 'tarjeta', search: 'café' }))
    expect(result.filter).toEqual({ categoryId: 3, paymentMethod: 'tarjeta', search: 'café' })
  })

  it('drops a blank search', () => {
    expect(toExpenseFilter(state({ search: '   ' })).filter).toEqual({})
  })
})

describe('activeFilterCount / hasActiveFilters', () => {
  it('counts filters other than the search box', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0)
    expect(activeFilterCount(state({ period: 'month', categoryId: '2', paymentMethod: 'efectivo' }))).toBe(3)
    expect(activeFilterCount(state({ search: 'x' }))).toBe(0)
  })

  it('detects any active filter, including search', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false)
    expect(hasActiveFilters(state({ search: 'x' }))).toBe(true)
    expect(hasActiveFilters(state({ search: '  ' }))).toBe(false)
    expect(hasActiveFilters(state({ paymentMethod: 'tarjeta' }))).toBe(true)
  })
})
