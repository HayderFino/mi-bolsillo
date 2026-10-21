import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Budget, Category, Expense, Income, IncomeCategory } from '../types'

export const DB_NAME = 'mi-bolsillo'

/** Key/value storage for internal flags (e.g. "default categories already seeded"). */
export interface MetaEntry {
  key: string
  value: unknown
}

export type MiBolsilloDB = Dexie & {
  expenses: EntityTable<Expense, 'id'>
  categories: EntityTable<Category, 'id'>
  budgets: Table<Budget, string>
  incomes: EntityTable<Income, 'id'>
  incomeCategories: EntityTable<IncomeCategory, 'id'>
  meta: Table<MetaEntry, string>
}

export const db = new Dexie(DB_NAME) as MiBolsilloDB

// Schema changes require a NEW version here with a migration (never edit version 1).
db.version(1).stores({
  expenses: '++id, date, categoryId, paymentMethod, [categoryId+date]',
  categories: '++id, active',
  budgets: 'id, categoryId, yearMonth',
  meta: 'key',
})

// v2: adds incomes and their own categories. Adding tables needs no data migration.
db.version(2).stores({
  expenses: '++id, date, categoryId, paymentMethod, [categoryId+date]',
  categories: '++id, active',
  budgets: 'id, categoryId, yearMonth',
  incomes: '++id, date, incomeCategoryId, paymentMethod',
  incomeCategories: '++id, active',
  meta: 'key',
})
