import { beforeEach, describe, expect, it } from 'vitest'
import { ensureDefaultCategories, listCategories } from '../src/services/categoryService'
import { createExpense, listExpenses } from '../src/services/expenseService'
import type { NewExpense } from '../src/types'
import { expectServiceError, validExpense } from './helpers'

let food: number
let transport: number

async function add(overrides: Partial<NewExpense>) {
  return createExpense(validExpense(food, overrides))
}

const descriptions = (list: { description: string }[]) => list.map((e) => e.description)

beforeEach(async () => {
  await ensureDefaultCategories()
  const categories = await listCategories()
  food = categories[0].id
  transport = categories[1].id
})

describe('listExpenses: search by description', () => {
  beforeEach(async () => {
    await add({ description: 'Café con leche', date: '2025-03-01' })
    await add({ description: 'CAFETERÍA universidad', date: '2025-03-02' })
    await add({ description: 'Taxi al aeropuerto', date: '2025-03-03' })
    await add({ description: 'Compra de piña', date: '2025-03-04' })
    await add({ description: 'Descuento 50% (promo)', date: '2025-03-05' })
  })

  it('matches partial text ignoring case', async () => {
    expect(descriptions(await listExpenses({ search: 'taxi' }))).toEqual(['Taxi al aeropuerto'])
    expect(descriptions(await listExpenses({ search: 'AEROPUERTO' }))).toEqual(['Taxi al aeropuerto'])
  })

  it('ignores accents in both the query and the stored text', async () => {
    const expected = ['CAFETERÍA universidad', 'Café con leche']
    expect(descriptions(await listExpenses({ search: 'cafe' }))).toEqual(expected)
    expect(descriptions(await listExpenses({ search: 'CAFÉ' }))).toEqual(expected)
    expect(descriptions(await listExpenses({ search: 'pina' }))).toEqual(['Compra de piña'])
    expect(descriptions(await listExpenses({ search: 'cafeteria' }))).toEqual(['CAFETERÍA universidad'])
  })

  it('trims the query and treats a blank query as no filter', async () => {
    expect(descriptions(await listExpenses({ search: '  taxi  ' }))).toEqual(['Taxi al aeropuerto'])
    expect(await listExpenses({ search: '   ' })).toHaveLength(5)
    expect(await listExpenses({ search: '' })).toHaveLength(5)
  })

  it('treats special characters literally (not as a pattern)', async () => {
    expect(descriptions(await listExpenses({ search: '50% (promo)' }))).toEqual(['Descuento 50% (promo)'])
    expect(await listExpenses({ search: '.*' })).toEqual([])
  })

  it('returns nothing when no description matches', async () => {
    expect(await listExpenses({ search: 'zzz' })).toEqual([])
  })

  it('keeps date-descending order', async () => {
    const result = await listExpenses({ search: 'a' })
    expect(result.map((e) => e.date)).toEqual(['2025-03-04', '2025-03-03', '2025-03-02', '2025-03-01'])
  })

  it('rejects a non-string search', async () => {
    await expectServiceError(listExpenses({ search: 42 as unknown as string }), 'validation')
  })
})

describe('listExpenses: payment method', () => {
  beforeEach(async () => {
    await add({ description: 'A', paymentMethod: 'efectivo' })
    await add({ description: 'B', paymentMethod: 'tarjeta' })
    await add({ description: 'C', paymentMethod: 'tarjeta' })
    await add({ description: 'D', paymentMethod: 'transferencia' })
  })

  it('filters by each method', async () => {
    expect(descriptions(await listExpenses({ paymentMethod: 'efectivo' }))).toEqual(['A'])
    expect((await listExpenses({ paymentMethod: 'tarjeta' })).map((e) => e.description).sort()).toEqual(['B', 'C'])
    expect(descriptions(await listExpenses({ paymentMethod: 'transferencia' }))).toEqual(['D'])
  })

  it('rejects an invalid method', async () => {
    const paymentMethod = 'cheque' as unknown as NewExpense['paymentMethod']
    await expectServiceError(listExpenses({ paymentMethod }), 'validation')
  })
})

describe('listExpenses: combined filters', () => {
  it('applies period, category, payment method and search together (AND)', async () => {
    await createExpense(
      validExpense(food, { description: 'Almuerzo trabajo', date: '2025-03-10', paymentMethod: 'tarjeta' }),
    )
    await createExpense(
      validExpense(food, { description: 'Almuerzo trabajo', date: '2025-02-10', paymentMethod: 'tarjeta' }),
    )
    await createExpense(
      validExpense(transport, { description: 'Almuerzo trabajo', date: '2025-03-11', paymentMethod: 'tarjeta' }),
    )
    await createExpense(
      validExpense(food, { description: 'Almuerzo trabajo', date: '2025-03-12', paymentMethod: 'efectivo' }),
    )
    await createExpense(
      validExpense(food, { description: 'Cena', date: '2025-03-13', paymentMethod: 'tarjeta' }),
    )

    const result = await listExpenses({
      from: '2025-03-01',
      to: '2025-03-31',
      categoryId: food,
      paymentMethod: 'tarjeta',
      search: 'almuerzo',
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ date: '2025-03-10', categoryId: food, paymentMethod: 'tarjeta' })
  })
})
