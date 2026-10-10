import { describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORIES } from '../src/db/seed'
import {
  deleteCategory,
  ensureDefaultCategories,
  listCategories,
} from '../src/services/categoryService'

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
    for (const category of await listCategories()) await deleteCategory(category.id)
    expect(await listCategories({ includeInactive: true })).toHaveLength(0)

    expect(await ensureDefaultCategories()).toBe(false)
    expect(await listCategories({ includeInactive: true })).toHaveLength(0)
  })
})
