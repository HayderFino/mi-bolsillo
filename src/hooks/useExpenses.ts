import { useLiveQuery } from 'dexie-react-hooks'
import { listExpenses, type ExpenseFilter } from '../services/expenseService'
import type { Expense } from '../types'

/**
 * Live list of expenses (updates by itself when data changes).
 * Returns `undefined` while loading. A `null` filter means "invalid filter": no query is run
 * (the caller shows the problem), because an invalid filter would make the service throw.
 */
export function useExpenses(filter: ExpenseFilter | null): Expense[] | undefined {
  // The filter object changes identity on every render, so the query depends on its serialized form.
  const key = JSON.stringify(filter)
  return useLiveQuery(
    () => (filter === null ? Promise.resolve<Expense[]>([]) : listExpenses(filter)),
    [key],
  )
}
