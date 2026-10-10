import Dexie from 'dexie'
import { db } from '../db/database'
import { ServiceError, type Expense, type NewExpense, type PaymentMethod } from '../types'
import { nowISO } from '../utils/dates'
import { MESSAGES } from './messages'
import {
  assertDate,
  assertPaymentMethod,
  assertPositiveInteger,
  isEntityId,
  requireText,
} from './validation'

export interface ExpenseFilter {
  /** Inclusive lower bound, `YYYY-MM-DD`. */
  from?: string
  /** Inclusive upper bound, `YYYY-MM-DD`. */
  to?: string
  categoryId?: number
  paymentMethod?: PaymentMethod
  /** Text contained in the description; ignores case and accents. Blank means no filter. */
  search?: string
}

export async function createExpense(input: NewExpense): Promise<Expense> {
  const data = validateFields(input)

  return db.transaction('rw', db.expenses, db.categories, async () => {
    await requireCategory(data.categoryId, true)
    const now = nowISO()
    const record = { ...data, createdAt: now, updatedAt: now }
    const id = await db.expenses.add(record)
    return { ...record, id }
  })
}

export async function getExpense(id: number): Promise<Expense> {
  const expense = isEntityId(id) ? await db.expenses.get(id) : undefined
  if (!expense) throw new ServiceError('not_found', MESSAGES.expenseNotFound)
  return expense
}

/**
 * Updates an expense. The target category must be active only when the category
 * changes, so expenses of a deactivated category remain editable.
 */
export async function updateExpense(id: number, changes: Partial<NewExpense>): Promise<Expense> {
  return db.transaction('rw', db.expenses, db.categories, async () => {
    const existing = await getExpense(id)
    const data = validateFields({
      amount: changes.amount ?? existing.amount,
      description: changes.description ?? existing.description,
      date: changes.date ?? existing.date,
      categoryId: changes.categoryId ?? existing.categoryId,
      paymentMethod: changes.paymentMethod ?? existing.paymentMethod,
    })
    await requireCategory(data.categoryId, data.categoryId !== existing.categoryId)

    const updated: Expense = { ...existing, ...data, updatedAt: nowISO() }
    await db.expenses.put(updated)
    return updated
  })
}

/** Deletes an expense. Asking the user for confirmation is the UI's responsibility. */
export async function deleteExpense(id: number): Promise<void> {
  await db.transaction('rw', db.expenses, async () => {
    await getExpense(id)
    await db.expenses.delete(id)
  })
}

/** Lists expenses ordered by date descending (ties: newest id first). */
export async function listExpenses(filter: ExpenseFilter = {}): Promise<Expense[]> {
  const { from, to, categoryId, paymentMethod, search } = filter
  if (from !== undefined) assertDate(from)
  if (to !== undefined) assertDate(to)
  if (from !== undefined && to !== undefined && from > to) {
    throw new ServiceError('validation', MESSAGES.dateRangeInvalid)
  }
  if (paymentMethod !== undefined) assertPaymentMethod(paymentMethod)
  if (search !== undefined && typeof search !== 'string') {
    throw new ServiceError('validation', MESSAGES.searchInvalid)
  }
  const needle = search === undefined ? '' : normalizeForSearch(search)

  return db.expenses
    .where('date')
    .between(from ?? Dexie.minKey, to ?? Dexie.maxKey, true, true)
    .reverse()
    .filter(
      (expense) =>
        (categoryId === undefined || expense.categoryId === categoryId) &&
        (paymentMethod === undefined || expense.paymentMethod === paymentMethod) &&
        (needle === '' || normalizeForSearch(expense.description).includes(needle)),
    )
    .toArray()
}

/** Lowercases, trims and strips diacritics so "Café" and "cafe" match. */
function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim()
}

function validateFields(data: NewExpense): NewExpense {
  assertPositiveInteger(data.amount, MESSAGES.amountInvalid)
  const description = requireText(data.description, MESSAGES.descriptionRequired)
  assertDate(data.date)
  assertPaymentMethod(data.paymentMethod)
  if (!isEntityId(data.categoryId)) throw new ServiceError('validation', MESSAGES.categoryNotFound)

  return {
    amount: data.amount,
    description,
    date: data.date,
    categoryId: data.categoryId,
    paymentMethod: data.paymentMethod,
  }
}

async function requireCategory(categoryId: number, mustBeActive: boolean): Promise<void> {
  const category = await db.categories.get(categoryId)
  if (!category) throw new ServiceError('validation', MESSAGES.categoryNotFound)
  if (mustBeActive && !category.active) {
    throw new ServiceError('validation', MESSAGES.categoryInactive)
  }
}
