import Dexie from 'dexie'
import { db } from '../db/database'
import { ServiceError, type Income, type NewIncome, type PaymentMethod } from '../types'
import { nowISO } from '../utils/dates'
import { MESSAGES } from './messages'
import {
  assertDate,
  assertPaymentMethod,
  assertPositiveInteger,
  isEntityId,
  requireText,
} from './validation'

export interface IncomeFilter {
  /** Inclusive lower bound, `YYYY-MM-DD`. */
  from?: string
  /** Inclusive upper bound, `YYYY-MM-DD`. */
  to?: string
  incomeCategoryId?: number
  paymentMethod?: PaymentMethod
  /** Text contained in the description; ignores case and accents. Blank means no filter. */
  search?: string
}

export async function createIncome(input: NewIncome): Promise<Income> {
  const data = validateFields(input)

  return db.transaction('rw', db.incomes, db.incomeCategories, async () => {
    await requireCategory(data.incomeCategoryId, true)
    const now = nowISO()
    const record = { ...data, createdAt: now, updatedAt: now }
    const id = await db.incomes.add(record)
    return { ...record, id }
  })
}

export async function getIncome(id: number): Promise<Income> {
  const income = isEntityId(id) ? await db.incomes.get(id) : undefined
  if (!income) throw new ServiceError('not_found', MESSAGES.incomeNotFound)
  return income
}

/**
 * Updates an income. The target category must be active only when the category
 * changes, so incomes of a deactivated category remain editable.
 */
export async function updateIncome(id: number, changes: Partial<NewIncome>): Promise<Income> {
  return db.transaction('rw', db.incomes, db.incomeCategories, async () => {
    const existing = await getIncome(id)
    const data = validateFields({
      amount: changes.amount ?? existing.amount,
      description: changes.description ?? existing.description,
      date: changes.date ?? existing.date,
      incomeCategoryId: changes.incomeCategoryId ?? existing.incomeCategoryId,
      paymentMethod: changes.paymentMethod ?? existing.paymentMethod,
    })
    await requireCategory(data.incomeCategoryId, data.incomeCategoryId !== existing.incomeCategoryId)

    const result: Income = { ...existing, ...data, updatedAt: nowISO() }
    await db.incomes.put(result)
    return result
  })
}

/** Deletes an income. Asking the user for confirmation is the UI's responsibility. */
export async function deleteIncome(id: number): Promise<void> {
  await db.transaction('rw', db.incomes, async () => {
    await getIncome(id)
    await db.incomes.delete(id)
  })
}

/** Lists incomes ordered by date descending (ties: newest id first). */
export async function listIncomes(filter: IncomeFilter = {}): Promise<Income[]> {
  const { from, to, incomeCategoryId, paymentMethod, search } = filter
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

  return db.incomes
    .where('date')
    .between(from ?? Dexie.minKey, to ?? Dexie.maxKey, true, true)
    .reverse()
    .filter(
      (income) =>
        (incomeCategoryId === undefined || income.incomeCategoryId === incomeCategoryId) &&
        (paymentMethod === undefined || income.paymentMethod === paymentMethod) &&
        (needle === '' || normalizeForSearch(income.description).includes(needle)),
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

function validateFields(data: NewIncome): NewIncome {
  assertPositiveInteger(data.amount, MESSAGES.amountInvalid)
  const description = requireText(data.description, MESSAGES.descriptionRequired)
  assertDate(data.date)
  assertPaymentMethod(data.paymentMethod)
  if (!isEntityId(data.incomeCategoryId)) {
    throw new ServiceError('validation', MESSAGES.incomeCategoryNotFound)
  }

  return {
    amount: data.amount,
    description,
    date: data.date,
    incomeCategoryId: data.incomeCategoryId,
    paymentMethod: data.paymentMethod,
  }
}

async function requireCategory(incomeCategoryId: number, mustBeActive: boolean): Promise<void> {
  const category = await db.incomeCategories.get(incomeCategoryId)
  if (!category) throw new ServiceError('validation', MESSAGES.incomeCategoryNotFound)
  if (mustBeActive && !category.active) {
    throw new ServiceError('validation', MESSAGES.categoryInactive)
  }
}
