import { expect } from 'vitest'
import { ServiceError, type NewExpense } from '../src/types'

export function validExpense(categoryId: number, overrides: Partial<NewExpense> = {}): NewExpense {
  return {
    amount: 25000,
    description: 'Almuerzo',
    date: '2025-03-15',
    categoryId,
    paymentMethod: 'efectivo',
    ...overrides,
  }
}

/** Asserts that a promise rejects with a ServiceError of the given code. */
export async function expectServiceError(promise: Promise<unknown>, code: ServiceError['code']) {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(ServiceError)
  expect((error as ServiceError).code).toBe(code)
  expect((error as ServiceError).message).not.toBe('')
}
