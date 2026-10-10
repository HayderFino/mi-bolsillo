import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildBudgetId,
  deleteBudget,
  getBudget,
  listBudgets,
  setBudget,
} from '../src/services/budgetService'
import { ensureDefaultCategories, listCategories } from '../src/services/categoryService'
import { expectServiceError } from './helpers'

let categoryId: number
let otherCategoryId: number

beforeEach(async () => {
  await ensureDefaultCategories()
  const categories = await listCategories()
  categoryId = categories[0].id
  otherCategoryId = categories[1].id
})

describe('buildBudgetId', () => {
  it('is deterministic: categoryId_yearMonth', () => {
    expect(buildBudgetId(3, '2025-03')).toBe('3_2025-03')
  })
})

describe('setBudget', () => {
  it('creates a budget with the deterministic id', async () => {
    const budget = await setBudget({ categoryId, yearMonth: '2025-03', limitAmount: 500000 })

    expect(budget).toEqual({
      id: `${categoryId}_2025-03`,
      categoryId,
      yearMonth: '2025-03',
      limitAmount: 500000,
    })
    expect(await getBudget(categoryId, '2025-03')).toEqual(budget)
  })

  it('modifies the limit instead of creating a duplicate', async () => {
    await setBudget({ categoryId, yearMonth: '2025-03', limitAmount: 500000 })
    const updated = await setBudget({ categoryId, yearMonth: '2025-03', limitAmount: 750000 })

    expect(updated.limitAmount).toBe(750000)
    const budgets = await listBudgets('2025-03')
    expect(budgets).toHaveLength(1)
    expect(budgets[0].limitAmount).toBe(750000)
  })

  it('keeps budgets independent per category and per month', async () => {
    await setBudget({ categoryId, yearMonth: '2025-03', limitAmount: 100 })
    await setBudget({ categoryId, yearMonth: '2025-04', limitAmount: 200 })
    await setBudget({ categoryId: otherCategoryId, yearMonth: '2025-03', limitAmount: 300 })

    expect((await getBudget(categoryId, '2025-03'))?.limitAmount).toBe(100)
    expect((await getBudget(categoryId, '2025-04'))?.limitAmount).toBe(200)
    expect((await getBudget(otherCategoryId, '2025-03'))?.limitAmount).toBe(300)
    expect(await getBudget(otherCategoryId, '2025-04')).toBeUndefined()
  })

  it.each([0, -1, 1.5, Number.NaN, Infinity, '1000', null])('rejects limit %s', async (limit) => {
    await expectServiceError(
      setBudget({ categoryId, yearMonth: '2025-03', limitAmount: limit as number }),
      'validation',
    )
    expect(await listBudgets('2025-03')).toHaveLength(0)
  })

  it.each(['2025-13', '2025-00', '2025-1', '2025-01-01', '', 'marzo'])(
    'rejects yearMonth %j',
    async (yearMonth) => {
      await expectServiceError(setBudget({ categoryId, yearMonth, limitAmount: 1000 }), 'validation')
    },
  )

  it('rejects a category that does not exist', async () => {
    await expectServiceError(setBudget({ categoryId: 9999, yearMonth: '2025-03', limitAmount: 1000 }), 'validation')
    await expectServiceError(
      setBudget({ categoryId: Number.NaN, yearMonth: '2025-03', limitAmount: 1000 }),
      'validation',
    )
  })
})

describe('getBudget', () => {
  it('returns undefined when no budget is defined (no invented limit)', async () => {
    expect(await getBudget(categoryId, '2025-03')).toBeUndefined()
  })

  it('rejects an invalid month', async () => {
    await expectServiceError(getBudget(categoryId, '2025-13'), 'validation')
  })
})

describe('listBudgets', () => {
  it('lists only the requested month, ordered by category id', async () => {
    await setBudget({ categoryId: otherCategoryId, yearMonth: '2025-03', limitAmount: 2 })
    await setBudget({ categoryId, yearMonth: '2025-03', limitAmount: 1 })
    await setBudget({ categoryId, yearMonth: '2025-04', limitAmount: 3 })

    const march = await listBudgets('2025-03')
    expect(march.map((b) => b.categoryId)).toEqual([categoryId, otherCategoryId])
    expect(await listBudgets('2025-05')).toEqual([])
  })

  it('rejects an invalid month', async () => {
    await expectServiceError(listBudgets('2025-1'), 'validation')
  })
})

describe('deleteBudget', () => {
  it('deletes only the targeted budget', async () => {
    await setBudget({ categoryId, yearMonth: '2025-03', limitAmount: 1 })
    await setBudget({ categoryId, yearMonth: '2025-04', limitAmount: 2 })

    await deleteBudget(categoryId, '2025-03')

    expect(await getBudget(categoryId, '2025-03')).toBeUndefined()
    expect((await getBudget(categoryId, '2025-04'))?.limitAmount).toBe(2)
  })

  it('fails with not_found when it does not exist', async () => {
    await expectServiceError(deleteBudget(categoryId, '2025-03'), 'not_found')
  })

  it('rejects an invalid month', async () => {
    await expectServiceError(deleteBudget(categoryId, 'x'), 'validation')
  })
})
