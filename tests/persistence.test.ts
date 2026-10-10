import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { DB_NAME, db } from '../src/db/database'
import { getBudget, setBudget } from '../src/services/budgetService'
import { createCategory, ensureDefaultCategories, listCategories } from '../src/services/categoryService'
import { createExpense, listExpenses } from '../src/services/expenseService'
import { validExpense } from './helpers'

// These tests close and reopen the database connection (what a page reload does to the
// IndexedDB connection). They run against fake-indexeddb, an in-memory implementation,
// so they do NOT prove persistence in a real browser profile.
describe('persistence across connections', () => {
  it('keeps categories, expenses and budgets after closing and reopening the database', async () => {
    await ensureDefaultCategories()
    const custom = await createCategory({ name: 'Mascotas', icon: 'paw-print', color: '#336699' })
    const [first] = await listCategories()
    const expense = await createExpense(validExpense(first.id, { amount: 99000, date: '2025-12-31' }))
    const budget = await setBudget({ categoryId: first.id, yearMonth: '2025-12', limitAmount: 400000 })

    db.close()
    expect(db.isOpen()).toBe(false)
    await db.open()

    expect(await listCategories()).toHaveLength(9)
    expect((await listCategories()).map((c) => c.id)).toContain(custom.id)
    expect(await listExpenses()).toEqual([expense])
    expect(await getBudget(first.id, '2025-12')).toEqual(budget)
  })

  it('does not seed the default categories again after reopening', async () => {
    await ensureDefaultCategories()
    db.close()
    await db.open()

    expect(await ensureDefaultCategories()).toBe(false)
    expect(await listCategories()).toHaveLength(8)
  })

  it('stores the expected schema as version 1', async () => {
    const raw = new Dexie(DB_NAME)
    await raw.open()
    try {
      expect(raw.verno).toBe(1)
      expect(raw.tables.map((t) => t.name).sort()).toEqual(['budgets', 'categories', 'expenses', 'meta'])
      expect(raw.table('expenses').schema.indexes.map((i) => i.name).sort()).toEqual([
        '[categoryId+date]',
        'categoryId',
        'date',
        'paymentMethod',
      ])
    } finally {
      raw.close()
    }
  })
})
