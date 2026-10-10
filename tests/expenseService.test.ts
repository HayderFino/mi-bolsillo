import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureDefaultCategories, listCategories, updateCategory } from '../src/services/categoryService'
import {
  createExpense,
  deleteExpense,
  getExpense,
  listExpenses,
  updateExpense,
} from '../src/services/expenseService'
import type { NewExpense } from '../src/types'
import { expectServiceError, validExpense } from './helpers'

let categoryId: number
let otherCategoryId: number

beforeEach(async () => {
  await ensureDefaultCategories()
  const categories = await listCategories()
  categoryId = categories[0].id
  otherCategoryId = categories[1].id
})

describe('createExpense', () => {
  it('creates and persists a valid expense', async () => {
    const created = await createExpense(validExpense(categoryId))

    expect(created).toMatchObject({
      amount: 25000,
      description: 'Almuerzo',
      date: '2025-03-15',
      categoryId,
      paymentMethod: 'efectivo',
    })
    expect(typeof created.id).toBe('number')
    expect(created.createdAt).toBe(created.updatedAt)
    expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt)
    expect(await getExpense(created.id)).toEqual(created)
  })

  it('trims the description', async () => {
    const created = await createExpense(validExpense(categoryId, { description: '  Taxi  ' }))
    expect(created.description).toBe('Taxi')
  })

  it('accepts past dates and every payment method', async () => {
    await createExpense(validExpense(categoryId, { date: '2020-01-01', paymentMethod: 'tarjeta' }))
    await createExpense(validExpense(categoryId, { paymentMethod: 'transferencia' }))
    expect(await listExpenses()).toHaveLength(2)
  })

  it('accepts a leap day', async () => {
    const created = await createExpense(validExpense(categoryId, { date: '2024-02-29' }))
    expect(created.date).toBe('2024-02-29')
  })
})

describe('createExpense validation', () => {
  const invalidAmounts: [string, unknown][] = [
    ['zero', 0],
    ['negative', -5],
    ['decimal', 10.5],
    ['NaN', Number.NaN],
    ['Infinity', Infinity],
    ['unsafe integer', 2 ** 60],
    ['numeric string', '1000'],
    ['null', null],
    ['undefined', undefined],
  ]
  it.each(invalidAmounts)('rejects amount: %s', async (_label, amount) => {
    await expectServiceError(createExpense(validExpense(categoryId, { amount: amount as number })), 'validation')
    expect(await listExpenses()).toHaveLength(0)
  })

  it.each(['', '   ', '\t\n'])('rejects empty description %j', async (description) => {
    await expectServiceError(createExpense(validExpense(categoryId, { description })), 'validation')
  })

  it('rejects a non-string description', async () => {
    const description = 123 as unknown as string
    await expectServiceError(createExpense(validExpense(categoryId, { description })), 'validation')
  })

  it.each(['', '2025-02-30', '2023-02-29', '2025-13-01', '15/03/2025', '2025-3-5', 'hoy'])(
    'rejects invalid date %j',
    async (date) => {
      await expectServiceError(createExpense(validExpense(categoryId, { date })), 'validation')
    },
  )

  it('rejects an invalid payment method', async () => {
    const paymentMethod = 'cheque' as unknown as NewExpense['paymentMethod']
    await expectServiceError(createExpense(validExpense(categoryId, { paymentMethod })), 'validation')
  })

  it('rejects a category that does not exist', async () => {
    await expectServiceError(createExpense(validExpense(9999)), 'validation')
    await expectServiceError(createExpense(validExpense(Number.NaN)), 'validation')
    await expectServiceError(createExpense(validExpense(undefined as unknown as number)), 'validation')
  })

  it('rejects an inactive category for a new expense', async () => {
    await updateCategory(categoryId, { active: false })
    await expectServiceError(createExpense(validExpense(categoryId)), 'validation')
    expect(await listExpenses()).toHaveLength(0)
  })
})

describe('getExpense', () => {
  it.each([9999, 0, -1, Number.NaN])('fails with not_found for id %s', async (id) => {
    await expectServiceError(getExpense(id), 'not_found')
  })
})

describe('updateExpense', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates fields, keeps createdAt and refreshes updatedAt', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2025-03-01T10:00:00.000Z'))
    const created = await createExpense(validExpense(categoryId))

    vi.setSystemTime(new Date('2025-03-02T12:30:00.000Z'))
    const updated = await updateExpense(created.id, {
      amount: 40000,
      description: '  Cena  ',
      date: '2025-02-28',
      paymentMethod: 'tarjeta',
      categoryId: otherCategoryId,
    })

    expect(updated).toEqual({
      id: created.id,
      amount: 40000,
      description: 'Cena',
      date: '2025-02-28',
      paymentMethod: 'tarjeta',
      categoryId: otherCategoryId,
      createdAt: '2025-03-01T10:00:00.000Z',
      updatedAt: '2025-03-02T12:30:00.000Z',
    })
    expect(await getExpense(created.id)).toEqual(updated)
  })

  it('keeps unspecified fields unchanged', async () => {
    const created = await createExpense(validExpense(categoryId))
    const updated = await updateExpense(created.id, { amount: 1 })
    expect(updated).toMatchObject({ amount: 1, description: 'Almuerzo', date: '2025-03-15', categoryId })
  })

  it('validates changes and leaves the stored expense untouched', async () => {
    const created = await createExpense(validExpense(categoryId))

    await expectServiceError(updateExpense(created.id, { amount: 0 }), 'validation')
    await expectServiceError(updateExpense(created.id, { amount: 1.5 }), 'validation')
    await expectServiceError(updateExpense(created.id, { description: '   ' }), 'validation')
    await expectServiceError(updateExpense(created.id, { date: '2025-02-30' }), 'validation')
    await expectServiceError(updateExpense(created.id, { categoryId: 9999 }), 'validation')

    expect(await getExpense(created.id)).toEqual(created)
  })

  it('rejects moving an expense to an inactive category', async () => {
    const created = await createExpense(validExpense(categoryId))
    await updateCategory(otherCategoryId, { active: false })

    await expectServiceError(updateExpense(created.id, { categoryId: otherCategoryId }), 'validation')
    expect((await getExpense(created.id)).categoryId).toBe(categoryId)
  })

  it('still allows editing an expense whose category was deactivated', async () => {
    const created = await createExpense(validExpense(categoryId))
    await updateCategory(categoryId, { active: false })

    const updated = await updateExpense(created.id, { description: 'Corregido' })
    expect(updated.description).toBe('Corregido')
  })

  it('fails with not_found for an unknown id', async () => {
    await expectServiceError(updateExpense(9999, { amount: 5 }), 'not_found')
  })
})

describe('deleteExpense', () => {
  it('deletes only the targeted expense', async () => {
    const a = await createExpense(validExpense(categoryId, { description: 'A' }))
    const b = await createExpense(validExpense(categoryId, { description: 'B' }))

    await deleteExpense(a.id)

    await expectServiceError(getExpense(a.id), 'not_found')
    expect(await listExpenses()).toEqual([b])
  })

  it('fails with not_found for an unknown id', async () => {
    await expectServiceError(deleteExpense(9999), 'not_found')
  })
})

describe('listExpenses', () => {
  it('orders by date descending, ties by newest first', async () => {
    const old = await createExpense(validExpense(categoryId, { date: '2025-01-10' }))
    const recent1 = await createExpense(validExpense(categoryId, { date: '2025-03-20' }))
    const recent2 = await createExpense(validExpense(categoryId, { date: '2025-03-20' }))
    const middle = await createExpense(validExpense(categoryId, { date: '2025-02-05' }))

    const ids = (await listExpenses()).map((e) => e.id)
    expect(ids).toEqual([recent2.id, recent1.id, middle.id, old.id])
  })

  it('filters by an inclusive date range, including month and year boundaries', async () => {
    const dec31 = await createExpense(validExpense(categoryId, { date: '2025-12-31' }))
    const jan01 = await createExpense(validExpense(categoryId, { date: '2026-01-01' }))
    const jan31 = await createExpense(validExpense(categoryId, { date: '2026-01-31' }))
    const feb01 = await createExpense(validExpense(categoryId, { date: '2026-02-01' }))

    const january = await listExpenses({ from: '2026-01-01', to: '2026-01-31' })
    expect(january.map((e) => e.id)).toEqual([jan31.id, jan01.id])

    const december = await listExpenses({ to: '2025-12-31' })
    expect(december.map((e) => e.id)).toEqual([dec31.id])

    const fromFeb = await listExpenses({ from: '2026-02-01' })
    expect(fromFeb.map((e) => e.id)).toEqual([feb01.id])
  })

  it('filters by category, combined with dates', async () => {
    const a = await createExpense(validExpense(categoryId, { date: '2025-03-01' }))
    const b = await createExpense(validExpense(otherCategoryId, { date: '2025-03-02' }))
    await createExpense(validExpense(categoryId, { date: '2025-04-01' }))

    expect((await listExpenses({ categoryId: otherCategoryId })).map((e) => e.id)).toEqual([b.id])
    const marchOfFirst = await listExpenses({ categoryId, from: '2025-03-01', to: '2025-03-31' })
    expect(marchOfFirst.map((e) => e.id)).toEqual([a.id])
  })

  it('returns an empty list when nothing matches', async () => {
    expect(await listExpenses()).toEqual([])
    await createExpense(validExpense(categoryId))
    expect(await listExpenses({ from: '2030-01-01' })).toEqual([])
  })

  it('rejects invalid filters', async () => {
    await expectServiceError(listExpenses({ from: '2025-02-30' }), 'validation')
    await expectServiceError(listExpenses({ to: 'x' }), 'validation')
    await expectServiceError(listExpenses({ from: '2025-03-02', to: '2025-03-01' }), 'validation')
  })
})
