import { db } from '../db/database'
import { ServiceError, type Budget } from '../types'
import { MESSAGES } from './messages'
import { assertPositiveInteger, assertYearMonth, isEntityId } from './validation'

export interface BudgetInput {
  categoryId: number
  /** `YYYY-MM`. */
  yearMonth: string
  /** Positive integer, COP. */
  limitAmount: number
}

/** Deterministic budget id: one budget per category and month. */
import { syncBudgetToCloud, deleteBudgetFromCloud } from './syncService'

export function buildBudgetId(categoryId: number, yearMonth: string): string {
  return `${categoryId}_${yearMonth}`
}

/** Creates the budget for a category+month, or replaces its limit if it already exists. */
export async function setBudget(input: BudgetInput): Promise<Budget> {
  assertYearMonth(input.yearMonth)
  assertPositiveInteger(input.limitAmount, MESSAGES.budgetLimitInvalid)

  const budget = await db.transaction('rw', db.budgets, db.categories, async () => {
    const { categoryId, yearMonth, limitAmount } = input
    if (!isEntityId(categoryId) || !(await db.categories.get(categoryId))) {
      throw new ServiceError('validation', MESSAGES.categoryNotFound)
    }
    const result: Budget = { id: buildBudgetId(categoryId, yearMonth), categoryId, yearMonth, limitAmount }
    await db.budgets.put(result)
    return result
  })

  void syncBudgetToCloud(budget)
  return budget
}

/** Returns the budget, or `undefined` when none is defined (never invents a limit). */
export async function getBudget(categoryId: number, yearMonth: string): Promise<Budget | undefined> {
  assertYearMonth(yearMonth)
  return db.budgets.get(buildBudgetId(categoryId, yearMonth))
}

/** Lists the budgets of a month ordered by category id. */
export async function listBudgets(yearMonth: string): Promise<Budget[]> {
  assertYearMonth(yearMonth)
  const budgets = await db.budgets.where('yearMonth').equals(yearMonth).toArray()
  return budgets.sort((a, b) => a.categoryId - b.categoryId)
}

export async function deleteBudget(categoryId: number, yearMonth: string): Promise<void> {
  assertYearMonth(yearMonth)
  const id = buildBudgetId(categoryId, yearMonth)
  await db.transaction('rw', db.budgets, async () => {
    if (!(await db.budgets.get(id))) throw new ServiceError('not_found', MESSAGES.budgetNotFound)
    await db.budgets.delete(id)
  })
  void deleteBudgetFromCloud(id)
}
