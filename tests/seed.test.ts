import { describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES, seedDefaultIncomeCategories } from '../src/db/seed'
import { db } from '../src/db/database'
import {
  ensureDefaultCategories,
  listCategories,
} from '../src/services/categoryService'
import { listIncomeCategories } from '../src/services/incomeCategoryService'
import { ALLOWED_ICONS } from '../src/constants/categoryAppearance'

describe('default categories seed', () => {
  it('creates the 8 default categories, all active', async () => {
    expect(await ensureDefaultCategories()).toBe(true)

    const categories = await listCategories()
    expect(categories.map((c) => c.name)).toEqual([
      'Alimentación',
      'Transporte',
      'Vivienda y servicios',
      'Compras personales',
      'Salud',
      'Educación',
      'Ocio y entretenimiento',
      'Otros',
    ])
    expect(categories).toHaveLength(DEFAULT_CATEGORIES.length)
    expect(categories.every((c) => c.active && c.icon !== '' && /^#[0-9A-F]{6}$/i.test(c.color))).toBe(true)
  })

  it('is idempotent when run again', async () => {
    await ensureDefaultCategories()
    expect(await ensureDefaultCategories()).toBe(false)
    expect(await listCategories()).toHaveLength(8)
  })

  it('does not duplicate categories when called concurrently', async () => {
    await Promise.all([ensureDefaultCategories(), ensureDefaultCategories(), ensureDefaultCategories()])
    expect(await listCategories()).toHaveLength(8)
  })

  it('runs only once: deleted defaults are never recreated', async () => {
    await ensureDefaultCategories()
    await db.categories.clear()
    expect(await listCategories({ includeInactive: true })).toHaveLength(0)

    expect(await ensureDefaultCategories()).toBe(false)
    expect(await listCategories({ includeInactive: true })).toHaveLength(0)
  })
})

describe('default income categories seed', () => {
  it('creates the 6 default income categories, all active', async () => {
    expect(await seedDefaultIncomeCategories()).toBe(true)

    const categories = await listIncomeCategories()
    expect(categories.map((c) => c.name)).toEqual([
      'Salario',
      'Freelance',
      'Negocio propio',
      'Regalo',
      'Reembolso',
      'Otros',
    ])
    expect(categories).toHaveLength(DEFAULT_INCOME_CATEGORIES.length)
    // Every seeded icon must be part of the allowed list (otherwise it falls back to a generic one).
    expect(categories.every((c) => ALLOWED_ICONS.includes(c.icon as never))).toBe(true)
    expect(categories.every((c) => c.active && /^#[0-9A-F]{6}$/i.test(c.color))).toBe(true)
  })

  it('is idempotent and never recreates deleted defaults', async () => {
    await seedDefaultIncomeCategories()
    expect(await seedDefaultIncomeCategories()).toBe(false)
    await db.incomeCategories.clear()
    expect(await seedDefaultIncomeCategories()).toBe(false)
    expect(await db.incomeCategories.count()).toBe(0)
  })
})
