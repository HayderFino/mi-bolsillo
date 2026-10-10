import { beforeEach, describe, expect, it } from 'vitest'
import { setBudget, getBudget } from '../src/services/budgetService'
import {
  createCategory,
  deleteCategory,
  ensureDefaultCategories,
  getCategory,
  listCategories,
  updateCategory,
} from '../src/services/categoryService'
import { createExpense, getExpense, updateExpense } from '../src/services/expenseService'
import { expectServiceError, validExpense } from './helpers'

const newCategory = { name: 'Mascotas', icon: 'paw-print', color: '#336699' }

beforeEach(async () => {
  await ensureDefaultCategories()
})

describe('createCategory', () => {
  it('creates an active category and persists it', async () => {
    const created = await createCategory(newCategory)

    expect(created).toMatchObject({ ...newCategory, active: true })
    expect(await getCategory(created.id)).toEqual(created)
    expect(await listCategories()).toHaveLength(9)
  })

  it('trims the name', async () => {
    const created = await createCategory({ ...newCategory, name: '  Mascotas  ' })
    expect(created.name).toBe('Mascotas')
  })

  it.each(['', '   '])('rejects an empty name (%j)', async (name) => {
    await expectServiceError(createCategory({ ...newCategory, name }), 'validation')
  })

  it('rejects duplicate names ignoring case and accents-insensitive casing', async () => {
    await expectServiceError(createCategory({ ...newCategory, name: 'salud' }), 'validation')
    await expectServiceError(createCategory({ ...newCategory, name: 'ALIMENTACIÓN' }), 'validation')
  })

  it('rejects an empty icon and invalid colors', async () => {
    await expectServiceError(createCategory({ ...newCategory, icon: ' ' }), 'validation')
    for (const color of ['', 'red', '#12345', '#GGGGGG', '336699']) {
      await expectServiceError(createCategory({ ...newCategory, color }), 'validation')
    }
  })
})

describe('updateCategory', () => {
  it('renames and changes icon and color', async () => {
    const created = await createCategory(newCategory)
    const updated = await updateCategory(created.id, { name: 'Animales', icon: 'dog', color: '#112233' })

    expect(updated).toEqual({ id: created.id, name: 'Animales', icon: 'dog', color: '#112233', active: true })
    expect(await getCategory(created.id)).toEqual(updated)
  })

  it('allows changing only the case of its own name', async () => {
    const created = await createCategory(newCategory)
    expect((await updateCategory(created.id, { name: 'MASCOTAS' })).name).toBe('MASCOTAS')
  })

  it('rejects renaming to another category name', async () => {
    const created = await createCategory(newCategory)
    await expectServiceError(updateCategory(created.id, { name: 'Salud' }), 'validation')
    expect((await getCategory(created.id)).name).toBe('Mascotas')
  })

  it('rejects invalid values without changing the stored category', async () => {
    const created = await createCategory(newCategory)
    await expectServiceError(updateCategory(created.id, { name: '  ' }), 'validation')
    await expectServiceError(updateCategory(created.id, { color: 'nope' }), 'validation')
    await expectServiceError(updateCategory(created.id, { active: 'yes' as unknown as boolean }), 'validation')
    expect(await getCategory(created.id)).toEqual(created)
  })

  it('fails with not_found for an unknown id', async () => {
    await expectServiceError(updateCategory(9999, { name: 'X' }), 'not_found')
  })

  it('deactivating hides it from the default list but keeps historical expenses', async () => {
    const [first] = await listCategories()
    const expense = await createExpense(validExpense(first.id))

    await updateCategory(first.id, { active: false })

    expect((await listCategories()).map((c) => c.id)).not.toContain(first.id)
    expect((await listCategories({ includeInactive: true })).map((c) => c.id)).toContain(first.id)
    expect(await getExpense(expense.id)).toEqual(expense)
  })

  it('can be reactivated', async () => {
    const [first] = await listCategories()
    await updateCategory(first.id, { active: false })
    await updateCategory(first.id, { active: true })
    expect((await getCategory(first.id)).active).toBe(true)
  })
})

describe('getCategory', () => {
  it.each([9999, 0, -1, 1.5, Number.NaN])('fails with not_found for id %s', async (id) => {
    await expectServiceError(getCategory(id), 'not_found')
  })
})

describe('deleteCategory', () => {
  it('deletes a category without expenses', async () => {
    const created = await createCategory(newCategory)
    await deleteCategory(created.id)

    await expectServiceError(getCategory(created.id), 'not_found')
    expect(await listCategories()).toHaveLength(8)
  })

  it('also removes the budgets of the deleted category', async () => {
    const created = await createCategory(newCategory)
    await setBudget({ categoryId: created.id, yearMonth: '2025-03', limitAmount: 100000 })

    await deleteCategory(created.id)

    expect(await getBudget(created.id, '2025-03')).toBeUndefined()
  })

  it('refuses to delete a category that has expenses and leaves everything intact', async () => {
    const [first] = await listCategories()
    const expense = await createExpense(validExpense(first.id))

    await expectServiceError(deleteCategory(first.id), 'integrity')

    expect(await getCategory(first.id)).toEqual(first)
    expect(await getExpense(expense.id)).toEqual(expense)
  })

  it('still refuses when the category is inactive but has expenses', async () => {
    const [first] = await listCategories()
    await createExpense(validExpense(first.id))
    await updateCategory(first.id, { active: false })

    await expectServiceError(deleteCategory(first.id), 'integrity')
  })

  it('allows deleting after its expenses were moved to another category', async () => {
    const [first, second] = await listCategories()
    const expense = await createExpense(validExpense(first.id))
    await updateExpense(expense.id, { categoryId: second.id })

    await deleteCategory(first.id)
    await expectServiceError(getCategory(first.id), 'not_found')
  })

  it('fails with not_found for an unknown id', async () => {
    await expectServiceError(deleteCategory(9999), 'not_found')
  })
})
