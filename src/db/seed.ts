import type { NewCategory } from '../types'
import { db } from './database'

/** Icons are Lucide icon names (kebab-case); resolved to components in the UI phase. */
export const DEFAULT_CATEGORIES: readonly NewCategory[] = [
  { name: 'Alimentación', icon: 'utensils', color: '#2F7D5B' },
  { name: 'Transporte', icon: 'bus', color: '#2B5D8A' },
  { name: 'Vivienda y servicios', icon: 'house', color: '#8A6D3B' },
  { name: 'Compras personales', icon: 'shopping-bag', color: '#7B4F8A' },
  { name: 'Salud', icon: 'heart-pulse', color: '#B4493F' },
  { name: 'Educación', icon: 'graduation-cap', color: '#3F7F8C' },
  { name: 'Ocio y entretenimiento', icon: 'clapperboard', color: '#C27C2C' },
  { name: 'Otros', icon: 'ellipsis', color: '#6B7280' },
]

const SEEDED_KEY = 'defaultCategoriesSeeded'

/**
 * Creates the default categories exactly once.
 * The flag and the inserts share one transaction, so concurrent or repeated calls
 * are safe, and categories the user later deletes are never recreated.
 *
 * @returns `true` if categories were created, `false` if it had already run.
 */
export async function seedDefaultCategories(): Promise<boolean> {
  return db.transaction('rw', db.categories, db.meta, async () => {
    if (await db.meta.get(SEEDED_KEY)) return false
    await db.categories.bulkAdd(DEFAULT_CATEGORIES.map((category) => ({ ...category, active: true })))
    await db.meta.put({ key: SEEDED_KEY, value: true })
    return true
  })
}
