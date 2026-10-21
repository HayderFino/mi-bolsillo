import { describe, expect, it } from 'vitest'
import {
  calculateBudgetProgress,
  calculateTopCategories,
  calculateTotalExpenses,
  filterExpensesByMonth,
  calculateMovementCount,
  calculateDistributionByCategory,
  calculateEvolutionByDay,
  calculateCategoryComparison,
  calculateBudgetSummary,
  calculateTotalIncome,
  calculateBalance,
} from '../src/services/statisticsService'
import type { Budget, Category, Expense, Income } from '../src/types'

describe('statisticsService', () => {
  const cat1: Category = { id: 1, name: 'Comida', icon: '🍔', color: '#ff0000', active: true }
  const cat2: Category = { id: 2, name: 'Transporte', icon: '🚗', color: '#00ff00', active: true }
  const categories = [cat1, cat2]

  const month = '2023-10'
  
  const createExpense = (id: number, amount: number, date: string, categoryId: number): Expense => ({
    id, amount, date, categoryId, paymentMethod: 'efectivo', description: `Expense ${id}`, createdAt: '', updatedAt: ''
  })

  describe('filterExpensesByMonth', () => {
    it('filters expenses correctly by yearMonth', () => {
      const expenses = [
        createExpense(1, 100, '2023-10-01', 1),
        createExpense(2, 200, '2023-10-31', 1),
        createExpense(3, 300, '2023-09-30', 1), // Previous month
        createExpense(4, 400, '2023-11-01', 1), // Next month
        createExpense(5, 500, '2022-10-15', 1), // Previous year
      ]

      const filtered = filterExpensesByMonth(expenses, month)
      expect(filtered.map(e => e.id)).toEqual([1, 2])
    })
  })

  describe('calculateTotalExpenses', () => {
    it('returns 0 for month without expenses', () => {
      expect(calculateTotalExpenses([], month)).toBe(0)
    })

    it('sums only expenses from the given month', () => {
      const expenses = [
        createExpense(1, 100, '2023-10-01', 1),
        createExpense(2, 200, '2023-10-31', 1),
        createExpense(3, 1000, '2023-09-30', 1),
      ]
      expect(calculateTotalExpenses(expenses, month)).toBe(300)
    })
  })

  describe('calculateTopCategories', () => {
    it('returns empty array if no expenses', () => {
      expect(calculateTopCategories([], categories, month)).toEqual([])
    })

    it('ranks categories correctly for the given month', () => {
      const expenses = [
        createExpense(1, 100, '2023-10-01', 1),
        createExpense(2, 50, '2023-10-02', 1),
        createExpense(3, 300, '2023-10-05', 2),
        createExpense(4, 1000, '2023-09-01', 1), // Ignored
      ]

      const top = calculateTopCategories(expenses, categories, month)
      expect(top).toHaveLength(2)
      // Transporte (300) > Comida (150)
      expect(top[0].category.name).toBe('Transporte')
      expect(top[0].amount).toBe(300)
      expect(top[1].category.name).toBe('Comida')
      expect(top[1].amount).toBe(150)
    })

    it('handles ties deterministically (by amount desc, then name asc)', () => {
      const catA: Category = { id: 3, name: 'Zanahorias', icon: '🥕', color: '#ff0000', active: true }
      const catB: Category = { id: 4, name: 'Arándanos', icon: '🫐', color: '#0000ff', active: true }
      const expenses = [
        createExpense(1, 300, '2023-10-01', 3),
        createExpense(2, 300, '2023-10-05', 4),
      ]
      const top = calculateTopCategories(expenses, [...categories, catA, catB], month)
      expect(top[0].category.name).toBe('Arándanos') // 'A' comes before 'Z'
      expect(top[1].category.name).toBe('Zanahorias')
    })
  })

  describe('calculateBudgetProgress', () => {
    const budgets: Budget[] = [
      { id: '1_2023-10', categoryId: 1, yearMonth: month, limitAmount: 1000 },
      { id: '2_2023-10', categoryId: 2, yearMonth: month, limitAmount: 2000 },
    ]

    it('calculates progress correctly for various thresholds', () => {
      const expenses = [
        // Category 1: 790 / 1000 = 79% (ok)
        createExpense(1, 790, '2023-10-01', 1),
        // Category 2: 1600 / 2000 = 80% (warning)
        createExpense(2, 1600, '2023-10-01', 2),
      ]

      const progress = calculateBudgetProgress(expenses, budgets, categories, month)
      expect(progress).toHaveLength(2)
      
      const p1 = progress.find(p => p.category.id === 1)!
      expect(p1.spent).toBe(790)
      expect(p1.percent).toBe(79)
      expect(p1.status).toBe('ok')

      const p2 = progress.find(p => p.category.id === 2)!
      expect(p2.spent).toBe(1600)
      expect(p2.percent).toBe(80)
      expect(p2.status).toBe('warning')
    })

    it('handles exactly 100% and 101% correctly', () => {
      const expenses = [
        // Category 1: 1000 / 1000 = 100% (warning, not exceeded because spent > limit is false, it is equal)
        createExpense(1, 1000, '2023-10-01', 1),
        // Category 2: 2020 / 2000 = 101% (exceeded)
        createExpense(2, 2020, '2023-10-01', 2),
      ]

      const progress = calculateBudgetProgress(expenses, budgets, categories, month)
      
      const p1 = progress.find(p => p.category.id === 1)!
      expect(p1.percent).toBe(100)
      expect(p1.status).toBe('warning')

      const p2 = progress.find(p => p.category.id === 2)!
      expect(p2.percent).toBe(100) // Capped at 100
      expect(p2.status).toBe('exceeded')
    })

    it('ignores category without budget', () => {
      const cat3: Category = { id: 3, name: 'Ocio', icon: '🎮', color: '#0000ff', active: true }
      const allCategories = [...categories, cat3]
      
      const expenses = [
        createExpense(1, 500, '2023-10-01', 3), // No budget for category 3
      ]

      const progress = calculateBudgetProgress(expenses, budgets, allCategories, month)
      expect(progress.some(p => p.category.id === 3)).toBe(false)
    })
  })

  describe('calculateMovementCount', () => {
    it('returns 0 for empty month or expenses from other months', () => {
      expect(calculateMovementCount([], month)).toBe(0)
      const otherMonth = [createExpense(1, 100, '2023-09-15', 1)]
      expect(calculateMovementCount(otherMonth, month)).toBe(0)
    })

    it('returns correct count for expenses at the boundaries of the month', () => {
      const expenses = [
        createExpense(1, 100, '2023-10-01', 1),
        createExpense(2, 200, '2023-10-31', 1),
      ]
      expect(calculateMovementCount(expenses, month)).toBe(2)
    })
  })

  describe('calculateDistributionByCategory', () => {
    it('returns correct distribution sorting and grouping', () => {
      const expenses = [
        createExpense(1, 100, '2023-10-01', 1),
        createExpense(2, 300, '2023-10-05', 2),
        createExpense(3, 50, '2023-10-10', 1),
      ]
      const dist = calculateDistributionByCategory(expenses, categories, month)
      expect(dist).toHaveLength(2)
      expect(dist[0]).toEqual({ name: 'Transporte', value: 300, color: '#00ff00' })
      expect(dist[1]).toEqual({ name: 'Comida', value: 150, color: '#ff0000' })
    })

    it('handles zero total without NaNs', () => {
      const dist = calculateDistributionByCategory([], categories, month)
      expect(dist).toEqual([]) // No categories have expenses > 0
    })

    it('includes inactive categories with expenses in top, distribution, and comparison', () => {
      const inactiveCat: Category = { id: 99, name: 'Inactiva', icon: '❌', color: '#000000', active: false }
      const allCats = [...categories, inactiveCat]
      const expenses = [createExpense(1, 500, '2023-10-01', 99)]
      
      const top = calculateTopCategories(expenses, allCats, month)
      expect(top[0].category.name).toBe('Inactiva')
      
      const dist = calculateDistributionByCategory(expenses, allCats, month)
      expect(dist[0].name).toBe('Inactiva')
      
      const comp = calculateCategoryComparison(expenses, [], allCats, month)
      expect(comp[0].name).toBe('Inactiva')
    })

    it('handles ties in top category', () => {
      const expenses = [
        createExpense(1, 300, '2023-10-01', 1),
        createExpense(2, 300, '2023-10-05', 2),
      ]
      const dist = calculateDistributionByCategory(expenses, categories, month)
      expect(dist[0].value).toBe(300)
      expect(dist[1].value).toBe(300)
    })
  })

  describe('calculateEvolutionByDay', () => {
    it('groups by day and sorts chronologically, filling missing days with 0 (28 days in Feb)', () => {
      const expenses = [
        createExpense(1, 100, '2023-02-15', 1),
        createExpense(2, 200, '2023-02-01', 2),
      ]
      const evo = calculateEvolutionByDay(expenses, '2023-02')
      expect(evo).toHaveLength(28)
      expect(evo[0]).toEqual({ date: '2023-02-01', amount: 200 })
      expect(evo[14]).toEqual({ date: '2023-02-15', amount: 100 })
      expect(evo[27]).toEqual({ date: '2023-02-28', amount: 0 })
    })

    it('handles leap years (29 days in Feb)', () => {
      const evo = calculateEvolutionByDay([], '2024-02')
      expect(evo).toHaveLength(29)
      expect(evo[28]).toEqual({ date: '2024-02-29', amount: 0 })
    })
  })

  describe('calculateCategoryComparison', () => {
    it('returns the same format as distribution but can be used for bar charts and includes limits', () => {
      const expenses = [createExpense(1, 100, '2023-10-15', 1)]
      const budgets: Budget[] = [{ id: '1_2023-10', categoryId: 1, yearMonth: month, limitAmount: 1000 }]
      const comp = calculateCategoryComparison(expenses, budgets, categories, month)
      expect(comp).toEqual([{ name: 'Comida', value: 100, color: '#ff0000', limit: 1000, percent: 10 }])
    })
  })
  
  describe('calculateBudgetSummary', () => {
    const budgets: Budget[] = [
      { id: '1_2023-10', categoryId: 1, yearMonth: month, limitAmount: 1000 },
      { id: '2_2023-10', categoryId: 2, yearMonth: month, limitAmount: 2000 },
    ]

    it('returns "none" status if no budgets are set and no NaN', () => {
      const summary = calculateBudgetSummary([], [], categories, month)
      expect(summary).toEqual({ totalLimit: 0, totalSpent: 0, percent: 0, status: 'none', warningCount: 0, exceededCount: 0 })
      expect(Number.isNaN(summary.percent)).toBe(false)
    })

    it('counts inactive categories with budgets', () => {
      const inactiveCat: Category = { id: 99, name: 'Inactiva', icon: '❌', color: '#000000', active: false }
      const inactiveBudgets: Budget[] = [{ id: '99_2023-10', categoryId: 99, yearMonth: month, limitAmount: 1000 }]
      const summary = calculateBudgetSummary([createExpense(1, 500, '2023-10-01', 99)], inactiveBudgets, [...categories, inactiveCat], month)
      expect(summary.totalLimit).toBe(1000)
      expect(summary.totalSpent).toBe(500)
      expect(summary.percent).toBe(50)
    })

    it('calculates correctly for different thresholds (79%, 80%, 100%, 101%)', () => {
      // 79% (ok)
      let summary = calculateBudgetSummary([
        createExpense(1, 2370, '2023-10-01', 1)
      ], budgets, categories, month)
      expect(summary.totalLimit).toBe(3000)
      expect(summary.totalSpent).toBe(2370)
      expect(summary.percent).toBe(79)
      expect(summary.status).toBe('ok')
      expect(summary.exceededCount).toBe(1) // category 1 exceeded its individual 1000 limit! (spent 2370)

      // Let's do tests that actually hit the overall thresholds without forcing individual limits.
      // 80% (warning) overall
      summary = calculateBudgetSummary([
        createExpense(1, 800, '2023-10-01', 1),
        createExpense(2, 1600, '2023-10-01', 2),
      ], budgets, categories, month)
      expect(summary.percent).toBe(80)
      expect(summary.status).toBe('warning')
      expect(summary.warningCount).toBe(2) // Both are exactly at 80%

      // 100% (warning, capped) overall
      summary = calculateBudgetSummary([
        createExpense(1, 1000, '2023-10-01', 1),
        createExpense(2, 2000, '2023-10-01', 2),
      ], budgets, categories, month)
      expect(summary.percent).toBe(100)
      expect(summary.status).toBe('warning')
      expect(summary.warningCount).toBe(2)

      // 101% (exceeded, percent capped at 100) overall
      summary = calculateBudgetSummary([
        createExpense(1, 1010, '2023-10-01', 1),
        createExpense(2, 2020, '2023-10-01', 2),
      ], budgets, categories, month)
      expect(summary.percent).toBe(100)
      expect(summary.status).toBe('exceeded')
      expect(summary.exceededCount).toBe(2)
    })
  })

  describe('consistency invariant', () => {
    it('distribution sum, comparison sum, and evolution sum must equal total expenses', () => {
      const inactiveCat: Category = { id: 99, name: 'Inactiva', icon: '❌', color: '#000000', active: false }
      const allCats = [...categories, inactiveCat]
      const expenses = [
        createExpense(1, 100, '2023-10-01', 1),
        createExpense(2, 200, '2023-10-15', 2),
        createExpense(3, 500, '2023-10-31', 99), // Inactive
      ]
      
      const total = calculateTotalExpenses(expenses, month)
      
      const distSum = calculateDistributionByCategory(expenses, allCats, month).reduce((sum, d) => sum + d.value, 0)
      const compSum = calculateCategoryComparison(expenses, [], allCats, month).reduce((sum, c) => sum + c.value, 0)
      const evoSum = calculateEvolutionByDay(expenses, month).reduce((sum, e) => sum + e.amount, 0)
      
      expect(distSum).toBe(total)
      expect(compSum).toBe(total)
      expect(evoSum).toBe(total)
      expect(total).toBe(800)
    })
  })
})

describe('income totals and balance', () => {
  const income = (overrides: Partial<Income>): Income => ({
    id: 1,
    amount: 1000,
    description: 'Ingreso',
    date: '2023-10-05',
    incomeCategoryId: 1,
    paymentMethod: 'transferencia',
    createdAt: '2023-10-05T10:00:00.000Z',
    updatedAt: '2023-10-05T10:00:00.000Z',
    ...overrides,
  })

  it('sums only the incomes of the requested month', () => {
    const incomes = [
      income({ id: 1, amount: 2000000, date: '2023-10-01' }),
      income({ id: 2, amount: 500000, date: '2023-10-31' }),
      income({ id: 3, amount: 9999999, date: '2023-11-01' }),
      income({ id: 4, amount: 123, date: '2022-10-15' }),
    ]
    expect(calculateTotalIncome(incomes, '2023-10')).toBe(2500000)
  })

  it('returns 0 when there are no incomes (never invents data)', () => {
    expect(calculateTotalIncome([], '2023-10')).toBe(0)
    expect(calculateTotalIncome([income({ date: '2023-12-01' })], '2023-10')).toBe(0)
  })

  it('computes the balance as income minus expenses, positive or negative', () => {
    expect(calculateBalance(3000000, 1200000)).toBe(1800000)
    expect(calculateBalance(500000, 800000)).toBe(-300000)
    expect(calculateBalance(0, 0)).toBe(0)
  })
})
