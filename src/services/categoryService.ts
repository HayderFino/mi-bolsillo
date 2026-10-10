import { db } from '../db/database'
import { seedDefaultCategories } from '../db/seed'
import { ServiceError, type Category, type NewCategory } from '../types'
import { MESSAGES } from './messages'
import { isEntityId, requireText } from './validation'

const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

export type CategoryChanges = Partial<Omit<Category, 'id'>>

/** Creates the default categories once (safe to call on every app start). */
export async function ensureDefaultCategories(): Promise<boolean> {
  return seedDefaultCategories()
}

/** Lists categories ordered by id. Inactive ones are excluded unless requested. */
export async function listCategories(options: { includeInactive?: boolean } = {}): Promise<Category[]> {
  const all = await db.categories.orderBy('id').toArray()
  return options.includeInactive ? all : all.filter((category) => category.active)
}

export async function getCategory(id: number): Promise<Category> {
  const category = isEntityId(id) ? await db.categories.get(id) : undefined
  if (!category) throw new ServiceError('not_found', MESSAGES.categoryNotFound)
  return category
}

export async function createCategory(input: NewCategory): Promise<Category> {
  const name = requireText(input.name, MESSAGES.categoryNameRequired)
  const icon = requireText(input.icon, MESSAGES.categoryIconRequired)
  const color = validateColor(input.color)

  return db.transaction('rw', db.categories, async () => {
    await assertNameAvailable(name)
    const record = { name, icon, color, active: true }
    const id = await db.categories.add(record)
    return { ...record, id }
  })
}

export async function updateCategory(id: number, changes: CategoryChanges): Promise<Category> {
  return db.transaction('rw', db.categories, async () => {
    const existing = await getCategory(id)
    const updated: Category = { ...existing }

    if (changes.name !== undefined) {
      updated.name = requireText(changes.name, MESSAGES.categoryNameRequired)
      await assertNameAvailable(updated.name, id)
    }
    if (changes.icon !== undefined) updated.icon = requireText(changes.icon, MESSAGES.categoryIconRequired)
    if (changes.color !== undefined) updated.color = validateColor(changes.color)
    if (changes.active !== undefined) {
      if (typeof changes.active !== 'boolean') {
        throw new ServiceError('validation', MESSAGES.categoryActiveInvalid)
      }
      updated.active = changes.active
    }

    await db.categories.put(updated)
    return updated
  })
}

/**
 * Deletes a category only if it has no expenses (otherwise it must be deactivated).
 * Budgets of the deleted category are removed too, so none are left orphaned.
 */
export async function deleteCategory(id: number): Promise<void> {
  await db.transaction('rw', db.categories, db.expenses, db.budgets, async () => {
    await getCategory(id)
    const expenseCount = await db.expenses.where('categoryId').equals(id).count()
    if (expenseCount > 0) throw new ServiceError('integrity', MESSAGES.categoryHasExpenses)
    await db.budgets.where('categoryId').equals(id).delete()
    await db.categories.delete(id)
  })
}

function validateColor(color: unknown): string {
  if (typeof color !== 'string' || !COLOR_PATTERN.test(color)) {
    throw new ServiceError('validation', MESSAGES.categoryColorInvalid)
  }
  return color
}

/** Names are unique ignoring case, so "salud" and "Salud" cannot coexist. */
async function assertNameAvailable(name: string, exceptId?: number): Promise<void> {
  const wanted = name.toLocaleLowerCase('es')
  const clash = await db.categories
    .filter((category) => category.id !== exceptId && category.name.toLocaleLowerCase('es') === wanted)
    .first()
  if (clash) throw new ServiceError('validation', MESSAGES.categoryNameDuplicate)
}
