import type { Budget, Category, Expense } from '../types'

export interface CategoryTotal {
  category: Category
  amount: number
}

export interface BudgetProgress {
  category: Category
  spent: number
  limit: number
  percent: number
  status: 'ok' | 'warning' | 'exceeded'
}

/** Filters expenses to only those in the given YYYY-MM month. */
export function filterExpensesByMonth(expenses: Expense[], yearMonth: string): Expense[] {
  return expenses.filter(e => e.date.startsWith(yearMonth))
}

/** Calculates the total sum of the given expenses in a specific month. */
export function calculateTotalExpenses(expenses: Expense[], yearMonth: string): number {
  return filterExpensesByMonth(expenses, yearMonth).reduce((sum, e) => sum + e.amount, 0)
}

/** 
 * Returns the top N categories by expense amount in a specific month.
 * Ignores expenses whose category is not found in the provided list.
 */
export function calculateTopCategories(
  expenses: Expense[],
  categories: Category[],
  yearMonth: string,
  limit: number = 5
): CategoryTotal[] {
  const categoryMap = new Map(categories.map(c => [c.id, c]))
  const totals = new Map<number, number>()

  for (const expense of filterExpensesByMonth(expenses, yearMonth)) {
    if (categoryMap.has(expense.categoryId)) {
      totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + expense.amount)
    }
  }

  return Array.from(totals.entries())
    .map(([categoryId, amount]) => ({
      category: categoryMap.get(categoryId)!,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

/** 
 * Calculates the progress of budgets based on the given expenses in a specific month.
 * Status is 'warning' if spent >= 80% and < 100%, 'exceeded' if > 100%, 'ok' otherwise.
 */
export function calculateBudgetProgress(
  expenses: Expense[],
  budgets: Budget[],
  categories: Category[],
  yearMonth: string
): BudgetProgress[] {
  const categoryMap = new Map(categories.map(c => [c.id, c]))
  const spentByCat = new Map<number, number>()

  for (const expense of filterExpensesByMonth(expenses, yearMonth)) {
    spentByCat.set(expense.categoryId, (spentByCat.get(expense.categoryId) ?? 0) + expense.amount)
  }

  return budgets
    .filter(b => categoryMap.has(b.categoryId))
    .map(b => {
      const spent = spentByCat.get(b.categoryId) ?? 0
      const percent = Math.min(100, Math.round((spent / b.limitAmount) * 100))
      
      let status: BudgetProgress['status'] = 'ok'
      if (spent > b.limitAmount) status = 'exceeded'
      else if (spent >= b.limitAmount * 0.8) status = 'warning'

      return {
        category: categoryMap.get(b.categoryId)!,
        spent,
        limit: b.limitAmount,
        percent,
        status,
      }
    })
    .sort((a, b) => a.category.name.localeCompare(b.category.name))
}
