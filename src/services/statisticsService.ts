import type { Budget, Category, Expense, Income } from '../types'

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
    .sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount
      return a.category.name.localeCompare(b.category.name)
    })
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

export interface BudgetSummary {
  totalLimit: number
  totalSpent: number
  percent: number
  status: 'ok' | 'warning' | 'exceeded' | 'none'
  warningCount: number
  exceededCount: number
}

/** Summarizes the budget status for a given month considering only categories with a budget */
export function calculateBudgetSummary(
  expenses: Expense[],
  budgets: Budget[],
  categories: Category[],
  yearMonth: string
): BudgetSummary {
  const progress = calculateBudgetProgress(expenses, budgets, categories, yearMonth)
  
  if (progress.length === 0) {
    return { totalLimit: 0, totalSpent: 0, percent: 0, status: 'none', warningCount: 0, exceededCount: 0 }
  }

  const totalLimit = progress.reduce((sum, p) => sum + p.limit, 0)
  const totalSpent = progress.reduce((sum, p) => sum + p.spent, 0)
  const percent = totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0
  
  let status: BudgetSummary['status'] = 'ok'
  if (totalSpent > totalLimit) status = 'exceeded'
  else if (totalSpent >= totalLimit * 0.8) status = 'warning'

  const warningCount = progress.filter(p => p.status === 'warning').length
  const exceededCount = progress.filter(p => p.status === 'exceeded').length

  return { totalLimit, totalSpent, percent, status, warningCount, exceededCount }
}

export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface ComparisonDataPoint extends ChartDataPoint {
  limit?: number
  percent?: number
}

export interface DailyEvolution {
  date: string
  amount: number
}

/** Returns the number of movements in a specific month */
export function calculateMovementCount(expenses: Expense[], yearMonth: string): number {
  return filterExpensesByMonth(expenses, yearMonth).length
}

/** Sum of the incomes that fall in the given month (an empty list returns 0, never a fake value). */
export function calculateTotalIncome(incomes: Income[], yearMonth: string): number {
  return incomes
    .filter((income) => income.date.startsWith(yearMonth))
    .reduce((sum, income) => sum + income.amount, 0)
}

/** Income minus expenses for the month; negative means more spending than income. */
export function calculateBalance(totalIncome: number, totalExpenses: number): number {
  return totalIncome - totalExpenses
}

/** Returns data for category distribution (Pie Chart) */
export function calculateDistributionByCategory(
  expenses: Expense[],
  categories: Category[],
  yearMonth: string
): ChartDataPoint[] {
  // Only include categories that actually have expenses to avoid cluttering the pie chart with 0s
  return calculateTopCategories(expenses, categories, yearMonth, Infinity)
    .filter(c => c.amount > 0)
    .map(c => ({
      name: c.category.name,
      value: c.amount,
      color: c.category.color,
    }))
}

/** Returns daily aggregated expenses for a given month, sorted chronologically, filling empty days with 0 */
export function calculateEvolutionByDay(
  expenses: Expense[],
  yearMonth: string
): DailyEvolution[] {
  const daily = new Map<string, number>()
  const [yearStr, monthStr] = yearMonth.split('-')
  const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate()
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = String(i).padStart(2, '0')
    daily.set(`${yearMonth}-${dayStr}`, 0)
  }

  for (const expense of filterExpensesByMonth(expenses, yearMonth)) {
    if (daily.has(expense.date)) {
      daily.set(expense.date, daily.get(expense.date)! + expense.amount)
    }
  }
  
  return Array.from(daily.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Returns data for comparing all active categories (Bar Chart) */
export function calculateCategoryComparison(
  expenses: Expense[],
  budgets: Budget[],
  categories: Category[],
  yearMonth: string
): ComparisonDataPoint[] {
  const budgetMap = new Map(budgets.map(b => [b.categoryId, b.limitAmount]))
  
  return calculateTopCategories(expenses, categories, yearMonth, Infinity)
    .filter(c => c.amount > 0 || budgetMap.has(c.category.id))
    .map(c => {
      const limit = budgetMap.get(c.category.id)
      const percent = limit && limit > 0 ? Math.min(100, Math.round((c.amount / limit) * 100)) : undefined
      return {
        name: c.category.name,
        value: c.amount,
        color: c.category.color,
        limit,
        percent,
      }
    })
}
