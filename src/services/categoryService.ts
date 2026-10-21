import { db } from '../db/database'
import { seedDefaultCategories } from '../db/seed'
import { ServiceError, type Category, type NewCategory } from '../types'
import { MESSAGES } from './messages'
import { isEntityId, requireText } from './validation'

import { ALLOWED_COLORS, ALLOWED_ICONS, type AllowedColor, type AllowedIcon } from '../constants/categoryAppearance'

export type CategoryChanges = Partial<Omit<Category, 'id'>>

function validateCategoryName(name: string): string {
  const trimmed = requireText(name, MESSAGES.categoryNameRequired)
  if (trimmed.length > 30) throw new ServiceError('validation', MESSAGES.categoryNameTooLong)
  return trimmed
}

function validateIcon(icon: string): string {
  if (!ALLOWED_ICONS.includes(icon as AllowedIcon)) {
    throw new ServiceError('validation', MESSAGES.categoryIconInvalid)
  }
  return icon
}

function validateColor(color: string): string {
  if (!ALLOWED_COLORS.includes(color as AllowedColor)) {
    throw new ServiceError('validation', MESSAGES.categoryColorInvalid)
  }
  return color
}

const normalizeName = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

async function assertNameAvailable(name: string, excludeId?: number) {
  const normalizedName = normalizeName(name)
  const existing = await db.categories.toArray()
  const duplicate = existing.find(
    (c) => normalizeName(c.name) === normalizedName && c.id !== excludeId
  )
  if (duplicate) throw new ServiceError('conflict', MESSAGES.categoryNameDuplicate)
}

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

export async function getCategoryExpenseCount(id: number): Promise<number> {
  return db.expenses.where('categoryId').equals(id).count()
}

export async function createCategory(input: NewCategory): Promise<Category> {
  const name = validateCategoryName(input.name)
  const icon = validateIcon(input.icon)
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
      updated.name = validateCategoryName(changes.name)
      await assertNameAvailable(updated.name, id)
    }
    if (changes.icon !== undefined && changes.icon !== existing.icon) updated.icon = validateIcon(changes.icon)
    if (changes.color !== undefined && changes.color !== existing.color) updated.color = validateColor(changes.color)
    
    if (changes.active !== undefined) {
      if (typeof changes.active !== 'boolean') {
        throw new ServiceError('validation', MESSAGES.categoryActiveInvalid)
      }
      
      // Prevent deactivating the last active category
      if (changes.active === false && existing.active === true) {
        const activeCategories = await db.categories.filter(c => c.active).count()
        if (activeCategories <= 1) {
          throw new ServiceError('validation', MESSAGES.categoryLastActive)
        }
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
    const existing = await getCategory(id)
    
    if (existing.active) {
      const activeCategories = await db.categories.filter(c => c.active).count()
      if (activeCategories <= 1) {
        throw new ServiceError('validation', MESSAGES.categoryLastActive)
      }
    }
    
    const expenseCount = await db.expenses.where('categoryId').equals(id).count()
    if (expenseCount > 0) throw new ServiceError('integrity', MESSAGES.categoryHasExpenses)
    await db.budgets.where('categoryId').equals(id).delete()
    await db.categories.delete(id)
  })
}


