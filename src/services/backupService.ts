import { db } from '../db/database'
import {
  PAYMENT_METHODS,
  ServiceError,
  type Budget,
  type Category,
  type Expense,
  type Income,
  type IncomeCategory,
} from '../types'
import { isValidDate, isValidYearMonth, nowISO, todayLocal } from '../utils/dates'
import { buildBudgetId } from './budgetService'
import { MESSAGES } from './messages'
import { isPositiveInteger } from './validation'

/** Format identifier stored in every exported file. */
export const BACKUP_APP_ID = 'mi-bolsillo'

/**
 * Format version of the exported file (independent from the Dexie schema version).
 * v2 added `incomes` and `incomeCategories`. v1 files keep importing: the new
 * tables default to empty.
 */
export const BACKUP_FORMAT_VERSION = 2

export interface BackupData {
  expenses: Expense[]
  categories: Category[]
  budgets: Budget[]
  incomes: Income[]
  incomeCategories: IncomeCategory[]
}

export interface BackupFile {
  app: typeof BACKUP_APP_ID
  version: number
  exportedAt: string
  data: BackupData
}

export interface BackupSummary {
  expenses: number
  categories: number
  budgets: number
  incomes: number
  incomeCategories: number
}

function invalid(message: string): ServiceError {
  return new ServiceError('validation', message)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireId(value: unknown, message: string): number {
  if (!isPositiveInteger(value)) throw invalid(message)
  return value
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw invalid(message)
  return value
}

function requireIsoLike(value: unknown, message: string): string {
  if (typeof value !== 'string' || value === '') throw invalid(message)
  return value
}

function toCategory(value: unknown): Category {
  const message = MESSAGES.backupCategoryInvalid
  if (!isPlainObject(value)) throw invalid(message)
  const id = requireId(value.id, message)
  const name = requireString(value.name, message)
  const icon = requireString(value.icon, message)
  const color = requireString(value.color, message)
  if (typeof value.active !== 'boolean') throw invalid(message)
  return { id, name, icon, color, active: value.active }
}

function toIncomeCategory(value: unknown): IncomeCategory {
  const message = MESSAGES.backupIncomeCategoryInvalid
  if (!isPlainObject(value)) throw invalid(message)
  const id = requireId(value.id, message)
  const name = requireString(value.name, message)
  const icon = requireString(value.icon, message)
  const color = requireString(value.color, message)
  if (typeof value.active !== 'boolean') throw invalid(message)
  return { id, name, icon, color, active: value.active }
}

function toExpense(value: unknown): Expense {
  const message = MESSAGES.backupExpenseInvalid
  if (!isPlainObject(value)) throw invalid(message)
  const id = requireId(value.id, message)
  const amount = value.amount
  if (!isPositiveInteger(amount)) throw invalid(message)
  const description = requireString(value.description, message)
  const date = value.date
  if (typeof date !== 'string' || !isValidDate(date)) throw invalid(message)
  const categoryId = requireId(value.categoryId, message)
  if (!(PAYMENT_METHODS as readonly unknown[]).includes(value.paymentMethod)) throw invalid(message)
  const createdAt = requireIsoLike(value.createdAt, message)
  const updatedAt = requireIsoLike(value.updatedAt, message)
  return {
    id,
    amount,
    description,
    date,
    categoryId,
    paymentMethod: value.paymentMethod as Expense['paymentMethod'],
    createdAt,
    updatedAt,
  }
}

function toIncome(value: unknown): Income {
  const message = MESSAGES.backupIncomeInvalid
  if (!isPlainObject(value)) throw invalid(message)
  const id = requireId(value.id, message)
  const amount = value.amount
  if (!isPositiveInteger(amount)) throw invalid(message)
  const description = requireString(value.description, message)
  const date = value.date
  if (typeof date !== 'string' || !isValidDate(date)) throw invalid(message)
  const incomeCategoryId = requireId(value.incomeCategoryId, message)
  if (!(PAYMENT_METHODS as readonly unknown[]).includes(value.paymentMethod)) throw invalid(message)
  const createdAt = requireIsoLike(value.createdAt, message)
  const updatedAt = requireIsoLike(value.updatedAt, message)
  return {
    id,
    amount,
    description,
    date,
    incomeCategoryId,
    paymentMethod: value.paymentMethod as Income['paymentMethod'],
    createdAt,
    updatedAt,
  }
}

function toBudget(value: unknown): Budget {
  const message = MESSAGES.backupBudgetInvalid
  if (!isPlainObject(value)) throw invalid(message)
  const id = requireString(value.id, message)
  const categoryId = requireId(value.categoryId, message)
  const yearMonth = value.yearMonth
  if (typeof yearMonth !== 'string' || !isValidYearMonth(yearMonth)) throw invalid(message)
  const limitAmount = value.limitAmount
  if (!isPositiveInteger(limitAmount)) throw invalid(message)
  if (id !== buildBudgetId(categoryId, yearMonth)) throw invalid(message)
  return { id, categoryId, yearMonth, limitAmount }
}

function assertUniqueIds(items: { id: number | string }[], message: string): void {
  const seen = new Set<number | string>()
  for (const item of items) {
    if (seen.has(item.id)) throw invalid(message)
    seen.add(item.id)
  }
}

function readArray(data: Record<string, unknown>, key: string): unknown[] {
  const value = data[key]
  // v1 files have no income tables: treat them as empty.
  if (value === undefined) return []
  if (!Array.isArray(value)) throw invalid(MESSAGES.backupInvalidStructure)
  return value
}

/**
 * Validates any parsed JSON as a backup file: structure, format version, every record,
 * unique ids and category references (gastos/presupuestos and ingresos must point to a
 * category included in the same file).
 *
 * @throws {ServiceError} `validation` when the file is malformed or incompatible.
 */
export function validateBackup(value: unknown): BackupFile {
  if (!isPlainObject(value)) throw invalid(MESSAGES.backupInvalidStructure)
  if (value.app !== BACKUP_APP_ID) throw invalid(MESSAGES.backupInvalidStructure)
  if (value.version !== 1 && value.version !== BACKUP_FORMAT_VERSION) {
    throw invalid(MESSAGES.backupVersionIncompatible)
  }
  if (typeof value.exportedAt !== 'string' || value.exportedAt === '') {
    throw invalid(MESSAGES.backupInvalidStructure)
  }
  if (!isPlainObject(value.data)) throw invalid(MESSAGES.backupInvalidStructure)

  const data = value.data
  if (!Array.isArray(data.categories) || !Array.isArray(data.expenses) || !Array.isArray(data.budgets)) {
    throw invalid(MESSAGES.backupInvalidStructure)
  }

  const categories = data.categories.map(toCategory)
  const expenses = data.expenses.map(toExpense)
  const budgets = data.budgets.map(toBudget)
  const incomeCategories = readArray(data, 'incomeCategories').map(toIncomeCategory)
  const incomes = readArray(data, 'incomes').map(toIncome)

  assertUniqueIds(categories, MESSAGES.backupDuplicateId)
  assertUniqueIds(expenses, MESSAGES.backupDuplicateId)
  assertUniqueIds(budgets, MESSAGES.backupDuplicateId)
  assertUniqueIds(incomeCategories, MESSAGES.backupDuplicateId)
  assertUniqueIds(incomes, MESSAGES.backupDuplicateId)

  const categoryIds = new Set(categories.map((category) => category.id))
  for (const expense of expenses) {
    if (!categoryIds.has(expense.categoryId)) throw invalid(MESSAGES.backupMissingCategory)
  }
  for (const budget of budgets) {
    if (!categoryIds.has(budget.categoryId)) throw invalid(MESSAGES.backupMissingCategory)
  }

  const incomeCategoryIds = new Set(incomeCategories.map((category) => category.id))
  for (const income of incomes) {
    if (!incomeCategoryIds.has(income.incomeCategoryId)) {
      throw invalid(MESSAGES.backupMissingIncomeCategory)
    }
  }

  return {
    app: BACKUP_APP_ID,
    version: BACKUP_FORMAT_VERSION,
    exportedAt: value.exportedAt,
    data: { expenses, categories, budgets, incomes, incomeCategories },
  }
}

/** Reads a backup file's content and validates it. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw invalid(MESSAGES.backupInvalidJson)
  }
  return validateBackup(raw)
}

/** Builds the backup object from already-loaded tables. */
export function buildBackup(data: BackupData, exportedAt = nowISO()): BackupFile {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_FORMAT_VERSION,
    exportedAt,
    data: {
      expenses: [...data.expenses],
      categories: [...data.categories],
      budgets: [...data.budgets],
      incomes: [...data.incomes],
      incomeCategories: [...data.incomeCategories],
    },
  }
}

/** Reads every table from IndexedDB and builds the backup object. */
export async function collectBackup(): Promise<BackupFile> {
  const [expenses, categories, budgets, incomes, incomeCategories] = await Promise.all([
    db.expenses.toArray(),
    db.categories.toArray(),
    db.budgets.toArray(),
    db.incomes.toArray(),
    db.incomeCategories.toArray(),
  ])
  return buildBackup({ expenses, categories, budgets, incomes, incomeCategories })
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2)
}

/** Suggested file name for an export, e.g. `mi-bolsillo-copia-2026-10-20.json`. */
export function backupFileName(date = todayLocal()): string {
  return `mi-bolsillo-copia-${date}.json`
}

/** Record counts for the settings screen (also used to preview an import). */
export async function collectStats(): Promise<BackupSummary> {
  const [expenses, categories, budgets, incomes, incomeCategories] = await Promise.all([
    db.expenses.count(),
    db.categories.count(),
    db.budgets.count(),
    db.incomes.count(),
    db.incomeCategories.count(),
  ])
  return { expenses, categories, budgets, incomes, incomeCategories }
}

/**
 * Replaces every expense, category, budget, income and income category with the backup content.
 *
 * Validation runs BEFORE writing, and all writes share a single Dexie
 * transaction, so the operation is all-or-nothing: an invalid file never
 * touches the existing data.
 *
 * @returns the number of restored records per table.
 */
export async function restoreBackup(value: unknown): Promise<BackupSummary> {
  const backup = validateBackup(value)
  const { expenses, categories, budgets, incomes, incomeCategories } = backup.data

  const summary: BackupSummary = {
    expenses: expenses.length,
    categories: categories.length,
    budgets: budgets.length,
    incomes: incomes.length,
    incomeCategories: incomeCategories.length,
  }

  await db.transaction(
    'rw',
    [db.expenses, db.categories, db.budgets, db.incomes, db.incomeCategories, db.meta],
    async () => {
      await db.expenses.clear()
      await db.categories.clear()
      await db.budgets.clear()
      await db.incomes.clear()
      await db.incomeCategories.clear()
      await db.categories.bulkAdd(categories)
      await db.expenses.bulkAdd(expenses)
      await db.budgets.bulkAdd(budgets)
      await db.incomeCategories.bulkAdd(incomeCategories)
      await db.incomes.bulkAdd(incomes)
      // The restored file already carries the category lists: keep the seed flags in
      // sync so the seed never re-creates duplicates later.
      await db.meta.put({ key: 'defaultCategoriesSeeded', value: true })
      await db.meta.put({ key: 'defaultIncomeCategoriesSeeded', value: true })
    },
  )

  return summary
}
