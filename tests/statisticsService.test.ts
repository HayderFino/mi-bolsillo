import { describe, expect, it } from 'vitest'
import {
  calculateBudgetProgress,
  calculateTopCategories,
  calculateTotalExpenses,
  filterExpensesByMonth,
} from '../src/services/statisticsService'
import type { Budget, Category, Expense } from '../src/types'

describe('statisticsService', () => {
  const cat1: Category = { id: 1, name: 'Comida', icon: '🍔', color: '#ff0000', active: true, order: 1 }
  const cat2: Category = { id: 2, name: 'Transporte', icon: '🚗', color: '#00ff00', active: true, order: 2 }
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
      const cat3: Category = { id: 3, name: 'Ocio', icon: '🎮', color: '#0000ff', active: true, order: 3 }
      const allCategories = [...categories, cat3]
      
      const expenses = [
        createExpense(1, 500, '2023-10-01', 3), // No budget for category 3
      ]

      const progress = calculateBudgetProgress(expenses, budgets, allCategories, month)
      expect(progress.some(p => p.category.id === 3)).toBe(false)
    })
  })
})
