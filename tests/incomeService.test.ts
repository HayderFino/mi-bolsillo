import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../src/db/database'
import {
  createIncome,
  deleteIncome,
  getIncome,
  listIncomes,
  updateIncome,
} from '../src/services/incomeService'
import { createIncomeCategory } from '../src/services/incomeCategoryService'
import { MESSAGES } from '../src/services/messages'
import type { NewIncome } from '../src/types'
import { expectServiceError } from './helpers'

let categoryId: number

function validIncome(overrides: Partial<NewIncome> = {}): NewIncome {
  return {
    amount: 2500000,
    description: 'Salario de marzo',
    date: '2025-03-15',
    incomeCategoryId: categoryId,
    paymentMethod: 'transferencia',
    ...overrides,
  }
}

beforeEach(async () => {
  const category = await createIncomeCategory({ name: 'Salario', icon: 'briefcase', color: '#2F7D5B' })
  categoryId = category.id
})

describe('createIncome', () => {
  it('creates an income with timestamps and trimmed description', async () => {
    const income = await createIncome(validIncome({ description: '  Salario  ' }))
    expect(income.id).toBeGreaterThan(0)
    expect(income.description).toBe('Salario')
    expect(income.amount).toBe(2500000)
    expect(income.createdAt).toBe(income.updatedAt)
    expect(await getIncome(income.id)).toEqual(income)
  })

  it('allows past dates', async () => {
    const income = await createIncome(validIncome({ date: '2020-01-01' }))
    expect(income.date).toBe('2020-01-01')
  })

  it('rejects invalid amounts', async () => {
    for (const amount of [0, -1, 12.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expectServiceError(createIncome(validIncome({ amount })), 'validation')
    }
  })

  it('rejects an empty description', async () => {
    await expectServiceError(createIncome(validIncome({ description: '   ' })), 'validation')
  })

  it('rejects invalid dates', async () => {
    for (const date of ['2025-13-01', '2025-02-30', '15/03/2025', '']) {
      await expectServiceError(createIncome(validIncome({ date })), 'validation')
    }
  })

  it('rejects an invalid payment method and unknown category', async () => {
    await expectServiceError(
      createIncome(validIncome({ paymentMethod: 'cheque' as never })),
      'validation',
    )
    const missingCategory = await createIncome(validIncome({ incomeCategoryId: 9999 })).then(
      () => undefined,
      (error: unknown) => error,
    )
    expect((missingCategory as Error).message).toBe(MESSAGES.incomeCategoryNotFound)
  })

  it('rejects an inactive category for a new income', async () => {
    const inactive = await createIncomeCategory({ name: 'Antigua', icon: 'gift', color: '#7B4F8A' })
    await db.incomeCategories.update(inactive.id, { active: false })
    await expectServiceError(
      createIncome(validIncome({ incomeCategoryId: inactive.id })),
      'validation',
    )
  })
})

describe('updateIncome', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps createdAt and refreshes updatedAt', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2025-03-15T10:00:00.000Z'))
    const income = await createIncome(validIncome())

    vi.setSystemTime(new Date('2025-03-16T10:00:00.000Z'))
    const updated = await updateIncome(income.id, { amount: 3000000 })

    expect(updated.createdAt).toBe(income.createdAt)
    expect(updated.updatedAt).not.toBe(income.updatedAt)
    expect(updated.amount).toBe(3000000)
  })

  it('allows editing an income whose category was deactivated', async () => {
    const income = await createIncome(validIncome())
    await db.incomeCategories.update(categoryId, { active: false })
    const updated = await updateIncome(income.id, { description: 'Ajuste' })
    expect(updated.description).toBe('Ajuste')
  })

  it('throws not_found for an unknown id', async () => {
    await expectServiceError(updateIncome(4242, { amount: 1 }), 'not_found')
  })
})

describe('deleteIncome', () => {
  it('removes the income and throws not_found afterwards', async () => {
    const income = await createIncome(validIncome())
    await deleteIncome(income.id)
    await expectServiceError(getIncome(income.id), 'not_found')
  })

  it('throws not_found when it does not exist', async () => {
    await expectServiceError(deleteIncome(4242), 'not_found')
  })
})

describe('listIncomes', () => {
  beforeEach(async () => {
    await createIncome(validIncome({ amount: 100000, date: '2025-03-10', description: 'Venta' }))
    await createIncome(
      validIncome({ amount: 200000, date: '2025-03-20', description: 'Bono', paymentMethod: 'efectivo' }),
    )
    await createIncome(validIncome({ amount: 300000, date: '2025-04-05', description: 'Abril' }))
  })

  it('orders by date descending and filters by range', async () => {
    const march = await listIncomes({ from: '2025-03-01', to: '2025-03-31' })
    expect(march.map((i) => i.description)).toEqual(['Bono', 'Venta'])
  })

  it('filters by category and payment method', async () => {
    expect(await listIncomes({ incomeCategoryId: categoryId })).toHaveLength(3)
    const cash = await listIncomes({ paymentMethod: 'efectivo' })
    expect(cash.map((i) => i.description)).toEqual(['Bono'])
  })

  it('searches descriptions ignoring case and accents', async () => {
    await createIncome(validIncome({ description: 'Café de socios' }))
    const found = await listIncomes({ search: 'cafe' })
    expect(found.map((i) => i.description)).toEqual(['Café de socios'])
  })

  it('rejects an inverted date range', async () => {
    await expectServiceError(listIncomes({ from: '2025-05-01', to: '2025-01-01' }), 'validation')
  })
})
