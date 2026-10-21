import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/database'
import { seedDefaultCategories } from '../src/db/seed'
import {
  BACKUP_FORMAT_VERSION,
  backupFileName,
  collectBackup,
  collectStats,
  parseBackup,
  restoreBackup,
  serializeBackup,
} from '../src/services/backupService'
import { MESSAGES } from '../src/services/messages'
import { ServiceError } from '../src/types'
import { expectServiceError } from './helpers'

/** `parseBackup` throws synchronously; run it inside a promise to assert rejections. */
function parse(text: string): Promise<unknown> {
  return Promise.resolve().then(() => parseBackup(text))
}

function restore(value: unknown): Promise<unknown> {
  return Promise.resolve().then(() => restoreBackup(value))
}

/** Asserts a validation error and returns its message. */
async function validationMessage(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(ServiceError)
  expect((error as ServiceError).code).toBe('validation')
  return (error as ServiceError).message
}

async function seedSampleData() {
  await seedDefaultCategories()
  const category = (await db.categories.orderBy('id').first())!
  await db.expenses.add({
    id: 1,
    amount: 15000,
    description: 'Almuerzo',
    date: '2025-03-15',
    categoryId: category.id,
    paymentMethod: 'efectivo',
    createdAt: '2025-03-15T12:00:00.000Z',
    updatedAt: '2025-03-15T12:00:00.000Z',
  })
  await db.budgets.add({
    id: `${category.id}_2025-03`,
    categoryId: category.id,
    yearMonth: '2025-03',
    limitAmount: 500000,
  })
  return category
}

function backupWith(data: Record<string, unknown[]>): string {
  return JSON.stringify({
    app: 'mi-bolsillo',
    version: BACKUP_FORMAT_VERSION,
    exportedAt: '2026-10-20T10:00:00.000Z',
    data,
  })
}

describe('export', () => {
  it('collects every table with format metadata', async () => {
    const category = await seedSampleData()
    const backup = await collectBackup()

    expect(backup.app).toBe('mi-bolsillo')
    expect(backup.version).toBe(BACKUP_FORMAT_VERSION)
    expect(backup.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(backup.data.categories).toHaveLength(8)
    expect(backup.data.expenses).toHaveLength(1)
    expect(backup.data.budgets).toHaveLength(1)
    expect(backup.data.expenses[0].categoryId).toBe(category.id)
  })

  it('round-trips through serialize and parse without losing data', async () => {
    await seedSampleData()
    const original = await collectBackup()
    const parsed = parseBackup(serializeBackup(original))
    expect(parsed.data).toEqual(original.data)
  })

  it('builds a dated file name', () => {
    expect(backupFileName('2026-10-20')).toBe('mi-bolsillo-copia-2026-10-20.json')
  })
})

describe('validation', () => {
  it('rejects text that is not JSON', async () => {
    expect(await validationMessage(parse('{no es json'))).toBe(MESSAGES.backupInvalidJson)
    expect(await validationMessage(parse(''))).toBe(MESSAGES.backupInvalidJson)
  })

  it('rejects structures that are not a backup file', async () => {
    for (const raw of ['null', '[]', '"texto"', '{}', '{"app":"otra"}']) {
      expect(await validationMessage(parse(raw))).toBe(MESSAGES.backupInvalidStructure)
    }
  })

  it('rejects an incompatible format version', async () => {
    const raw = JSON.stringify({ app: 'mi-bolsillo', version: 99, exportedAt: 'x', data: { expenses: [], categories: [], budgets: [] } })
    expect(await validationMessage(parse(raw))).toBe(MESSAGES.backupVersionIncompatible)

    const zero = JSON.stringify({ app: 'mi-bolsillo', version: 0, exportedAt: 'x', data: { expenses: [], categories: [], budgets: [] } })
    expect(await validationMessage(parse(zero))).toBe(MESSAGES.backupVersionIncompatible)
  })

  it('rejects a missing data section', async () => {
    const raw = JSON.stringify({ app: 'mi-bolsillo', version: BACKUP_FORMAT_VERSION, exportedAt: 'x' })
    expect(await validationMessage(parse(raw))).toBe(MESSAGES.backupInvalidStructure)
  })

  it('accepts a backup with empty tables', async () => {
    const parsed = parseBackup(backupWith({ expenses: [], categories: [], budgets: [] }))
    expect(parsed.data).toEqual({ expenses: [], categories: [], budgets: [] })
  })

  it('rejects invalid expense records', async () => {
    const category = { id: 1, name: 'Comida', icon: 'utensils', color: '#2F7D5B', active: true }
    const expense = { id: 1, amount: 1000, description: 'Almuerzo', date: '2026-01-01', categoryId: 1, paymentMethod: 'efectivo', createdAt: 'a', updatedAt: 'a' }

    for (const amount of [0, -5, 12.5, '1000']) {
      const raw = backupWith({ categories: [category], expenses: [{ ...expense, amount }], budgets: [] })
      expect(await validationMessage(parse(raw))).toBe(MESSAGES.backupExpenseInvalid)
    }

    const badDate = backupWith({ categories: [category], expenses: [{ ...expense, date: '2026-13-40' }], budgets: [] })
    expect(await validationMessage(parse(badDate))).toBe(MESSAGES.backupExpenseInvalid)

    const badMethod = backupWith({ categories: [category], expenses: [{ ...expense, paymentMethod: 'cheque' }], budgets: [] })
    expect(await validationMessage(parse(badMethod))).toBe(MESSAGES.backupExpenseInvalid)

    const emptyDescription = backupWith({ categories: [category], expenses: [{ ...expense, description: '   ' }], budgets: [] })
    expect(await validationMessage(parse(emptyDescription))).toBe(MESSAGES.backupExpenseInvalid)
  })

  it('rejects invalid category records', async () => {
    const raw = backupWith({ categories: [{ id: 1, name: '  ', icon: 'utensils', color: '#2F7D5B', active: true }], expenses: [], budgets: [] })
    expect(await validationMessage(parse(raw))).toBe(MESSAGES.backupCategoryInvalid)

    const inactive = backupWith({ categories: [{ id: 1, name: 'Comida', icon: 'utensils', color: '#2F7D5B', active: 'si' }], expenses: [], budgets: [] })
    expect(await validationMessage(parse(inactive))).toBe(MESSAGES.backupCategoryInvalid)
  })

  it('rejects invalid budget records, including a mismatched id', async () => {
    const category = { id: 1, name: 'Comida', icon: 'utensils', color: '#2F7D5B', active: true }

    const mismatched = backupWith({ categories: [category], expenses: [], budgets: [{ id: '9_2026-01', categoryId: 1, yearMonth: '2026-01', limitAmount: 1000 }] })
    expect(await validationMessage(parse(mismatched))).toBe(MESSAGES.backupBudgetInvalid)

    const badLimit = backupWith({ categories: [category], expenses: [], budgets: [{ id: '1_2026-01', categoryId: 1, yearMonth: '2026-01', limitAmount: 0 }] })
    expect(await validationMessage(parse(badLimit))).toBe(MESSAGES.backupBudgetInvalid)

    const badMonth = backupWith({ categories: [category], expenses: [], budgets: [{ id: '1_2026-13', categoryId: 1, yearMonth: '2026-13', limitAmount: 1000 }] })
    expect(await validationMessage(parse(badMonth))).toBe(MESSAGES.backupBudgetInvalid)
  })

  it('rejects expenses that point to a category missing from the file', async () => {
    const raw = backupWith({
      categories: [],
      expenses: [{ id: 1, amount: 1000, description: 'x', date: '2026-01-01', categoryId: 7, paymentMethod: 'efectivo', createdAt: 'a', updatedAt: 'a' }],
      budgets: [],
    })
    expect(await validationMessage(parse(raw))).toBe(MESSAGES.backupMissingCategory)
  })

  it('rejects budgets that point to a category missing from the file', async () => {
    const raw = backupWith({ categories: [], expenses: [], budgets: [{ id: '7_2026-01', categoryId: 7, yearMonth: '2026-01', limitAmount: 1000 }] })
    expect(await validationMessage(parse(raw))).toBe(MESSAGES.backupMissingCategory)
  })

  it('rejects duplicated ids', async () => {
    const category = { id: 1, name: 'Comida', icon: 'utensils', color: '#2F7D5B', active: true }
    const raw = backupWith({ categories: [category, { ...category, name: 'Otra' }], expenses: [], budgets: [] })
    expect(await validationMessage(parse(raw))).toBe(MESSAGES.backupDuplicateId)
  })
})

describe('restore', () => {
  it('replaces all data and preserves expense-category-budget relations', async () => {
    await seedSampleData()
    const backup = await collectBackup()

    await db.categories.add({ id: 500, name: 'Temporal', icon: 'circle-help', color: '#6B7280', active: true })
    await db.expenses.add({
      id: 501,
      amount: 999,
      description: 'Se descarta',
      date: '2025-05-01',
      categoryId: 500,
      paymentMethod: 'tarjeta',
      createdAt: '2025-05-01T10:00:00.000Z',
      updatedAt: '2025-05-01T10:00:00.000Z',
    })

    const summary = await restoreBackup(backup)

    expect(summary).toEqual({ expenses: 1, categories: 8, budgets: 1 })
    expect(await db.categories.get(500)).toBeUndefined()
    expect(await db.expenses.get(501)).toBeUndefined()

    const expense = (await db.expenses.get(1))!
    expect(await db.categories.get(expense.categoryId)).toBeDefined()
    expect(await db.budgets.get(`${expense.categoryId}_2025-03`)).toBeDefined()
  })

  it('keeps the seed flag so default categories are never re-created', async () => {
    const backup = await collectBackup()
    expect(await restoreBackup(backup)).toEqual({ expenses: 0, categories: 0, budgets: 0 })
    expect(await seedDefaultCategories()).toBe(false)
    expect(await db.meta.get('defaultCategoriesSeeded')).toEqual({ key: 'defaultCategoriesSeeded', value: true })
  })

  it('does not modify any table when the backup is invalid (all or nothing)', async () => {
    await seedSampleData()
    const before = await collectStats()

    await expectServiceError(restore({ app: 'mi-bolsillo', version: 99 }), 'validation')
    await expectServiceError(restore('no soy un objeto'), 'validation')
    await expectServiceError(
      restore({
        app: 'mi-bolsillo',
        version: BACKUP_FORMAT_VERSION,
        exportedAt: 'x',
        data: {
          categories: [{ id: 1, name: 'Comida', icon: 'utensils', color: '#2F7D5B', active: true }],
          expenses: [{ id: 1, amount: 1, description: 'x', date: '2026-01-01', categoryId: 99, paymentMethod: 'efectivo', createdAt: 'a', updatedAt: 'a' }],
          budgets: [],
        },
      }),
      'validation',
    )

    expect(await collectStats()).toEqual(before)
  })
})

describe('stats', () => {
  beforeEach(async () => {
    await db.categories.clear()
    await db.expenses.clear()
    await db.budgets.clear()
  })

  it('returns zeros on an empty database', async () => {
    expect(await collectStats()).toEqual({ expenses: 0, categories: 0, budgets: 0 })
  })

  it('counts every table', async () => {
    await seedSampleData()
    expect(await collectStats()).toEqual({ expenses: 1, categories: 8, budgets: 1 })
  })
})
