import { useLiveQuery } from 'dexie-react-hooks'
import { listIncomeCategories } from '../services/incomeCategoryService'
import type { IncomeCategory } from '../types'

/** All income categories (including inactive, needed to label historical incomes); `undefined` while loading. */
export function useIncomeCategories(): IncomeCategory[] | undefined {
  return useLiveQuery(() => listIncomeCategories({ includeInactive: true }), [])
}
