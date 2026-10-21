import { db } from '../db/database'
import { ServiceError, type IncomeCategory, type NewIncomeCategory } from '../types'
import { ALLOWED_COLORS, ALLOWED_ICONS } from '../constants/categoryAppearance'
import { MESSAGES } from './messages'
import { isEntityId, requireText } from './validation'

const NAME_MAX_LENGTH = 30

function validateName(value: unknown): string {
  const name = requireText(value, MESSAGES.incomeCategoryNameRequired)
  if (name.length > NAME_MAX_LENGTH) {
    throw new ServiceError('validation', MESSAGES.incomeCategoryNameTooLong)
  }
  return name
}

function validateIcon(value: unknown): string {
  if (typeof value !== 'string' || !(ALLOWED_ICONS as readonly string[]).includes(value)) {
    throw new ServiceError('validation', MESSAGES.incomeCategoryIconInvalid)
  }
  return value
}

function validateColor(value: unknown): string {
  if (typeof value !== 'string' || !(ALLOWED_COLORS as readonly string[]).includes(value)) {
    throw new ServiceError('validation', MESSAGES.incomeCategoryColorInvalid)
  }
  return value
}

/** Normalizes for comparison: no accents, lowercase, trimmed (same rule as expense categories). */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim()
}

async function assertNameAvailable(name: string, excludeId?: number): Promise<void> {
  const target = normalizeName(name)
  const all = await db.incomeCategories.toArray()
  const clash = all.find((category) => category.id !== excludeId && normalizeName(category.name) === target)
  if (clash) throw new ServiceError('conflict', MESSAGES.incomeCategoryNameDuplicate)
}

export async function listIncomeCategories(options: { includeInactive?: boolean } = {}): Promise<IncomeCategory[]> {
  const all = await db.incomeCategories.orderBy('id').toArray()
  return options.includeInactive ? all : all.filter((category) => category.active)
}

export async function getIncomeCategory(id: number): Promise<IncomeCategory> {
  const category = isEntityId(id) ? await db.incomeCategories.get(id) : undefined
  if (!category) throw new ServiceError('not_found', MESSAGES.incomeCategoryNotFound)
  return category
}

export async function getIncomeCategoryUsageCount(id: number): Promise<number> {
  return db.incomes.where('incomeCategoryId').equals(id).count()
}

export async function createIncomeCategory(input: NewIncomeCategory): Promise<IncomeCategory> {
  const name = validateName(input.name)
  const icon = validateIcon(input.icon)
  const color = validateColor(input.color)
  await assertNameAvailable(name)
  const id = await db.incomeCategories.add({ name, icon, color, active: true })
  return { id, name, icon, color, active: true }
}

export async function updateIncomeCategory(
  id: number,
  changes: Partial<Omit<IncomeCategory, 'id'>>,
): Promise<IncomeCategory> {
  const existing = await getIncomeCategory(id)
  const next: IncomeCategory = { ...existing }

  if (changes.name !== undefined) {
    next.name = validateName(changes.name)
    await assertNameAvailable(next.name, id)
  }
  // Icon/color validate only when changed, so legacy values stay editable.
  if (changes.icon !== undefined) next.icon = validateIcon(changes.icon)
  if (changes.color !== undefined) next.color = validateColor(changes.color)
  if (changes.active !== undefined) {
    if (typeof changes.active !== 'boolean') {
      throw new ServiceError('validation', MESSAGES.categoryActiveInvalid)
    }
    if (existing.active && !changes.active) await assertNotLastActive(id)
    next.active = changes.active
  }

  await db.incomeCategories.put(next)
  return next
}

async function assertNotLastActive(id: number): Promise<void> {
  const active = await db.incomeCategories.where('active').equals(1).toArray()
  if (active.length <= 1 && active.some((category) => category.id === id)) {
    throw new ServiceError('integrity', MESSAGES.categoryLastActive)
  }
}

/** Deletes a category only when no income references it. */
export async function deleteIncomeCategory(id: number): Promise<void> {
  await db.transaction('rw', db.incomeCategories, db.incomes, async () => {
    const existing = await getIncomeCategory(id)
    if (existing.active) await assertNotLastActive(id)
    const used = await db.incomes.where('incomeCategoryId').equals(id).count()
    if (used > 0) throw new ServiceError('integrity', MESSAGES.categoryHasExpenses)
    await db.incomeCategories.delete(id)
  })
}
