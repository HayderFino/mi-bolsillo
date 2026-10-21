/** Single source of truth for the app name (provisional, easy to change). */
export const APP_NAME = 'Mi Bolsillo'

export const PAYMENT_METHODS = ['efectivo', 'tarjeta', 'transferencia'] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export interface Expense {
  id: number
  /** Positive integer, COP. */
  amount: number
  description: string
  /** Local date, `YYYY-MM-DD`. */
  date: string
  categoryId: number
  paymentMethod: PaymentMethod
  /** ISO 8601. */
  createdAt: string
  /** ISO 8601. */
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  icon: string
  color: string
  active: boolean
}

export interface Budget {
  /** Deterministic: `${categoryId}_${yearMonth}`. */
  id: string
  categoryId: number
  /** `YYYY-MM`. */
  yearMonth: string
  /** Positive integer, COP. */
  limitAmount: number
}

/** Income category: own list, independent from expense categories. */
export interface IncomeCategory {
  id: number
  name: string
  icon: string
  color: string
  active: boolean
}

export interface Income {
  id: number
  /** Positive integer, COP. */
  amount: number
  description: string
  /** Local date, `YYYY-MM-DD`. */
  date: string
  incomeCategoryId: number
  paymentMethod: PaymentMethod
  /** ISO 8601. */
  createdAt: string
  /** ISO 8601. */
  updatedAt: string
}

export type NewExpense = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
export type NewCategory = Omit<Category, 'id' | 'active'>
export type NewIncome = Omit<Income, 'id' | 'createdAt' | 'updatedAt'>
export type NewIncomeCategory = Omit<IncomeCategory, 'id' | 'active'>

/** Typed error thrown by the service layer; `message` is user-readable (Spanish). */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode

  constructor(code: ServiceErrorCode, message: string) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
  }
}

export type ServiceErrorCode = 'validation' | 'not_found' | 'integrity' | 'conflict'
