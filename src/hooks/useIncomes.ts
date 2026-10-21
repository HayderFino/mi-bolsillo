import { useLiveQuery } from 'dexie-react-hooks'
import { listIncomes, type IncomeFilter } from '../services/incomeService'
import type { Income } from '../types'

/**
 * Live list of incomes (updates by itself when data changes).
 * Returns `undefined` while loading. A `null` filter means "invalid filter": no query is run
 * (the caller shows the problem), because an invalid filter would make the service throw.
 */export function useIncomes(filter: IncomeFilter | null): Income[] | undefined {
  // The filter object changes identity on every render, so the query depends on its serialized form.
  const key = JSON.stringify(filter)
  return useLiveQuery(
    () => (filter === null ? Promise.resolve<Income[]>([]) : listIncomes(filter)),
    [key],
  )
}
