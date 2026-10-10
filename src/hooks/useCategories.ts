import { useLiveQuery } from 'dexie-react-hooks'
import { listCategories } from '../services/categoryService'
import type { Category } from '../types'

/** All categories (including inactive, needed to label historical expenses); `undefined` while loading. */
export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => listCategories({ includeInactive: true }), [])
}
