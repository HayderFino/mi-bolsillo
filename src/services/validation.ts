import { PAYMENT_METHODS, ServiceError, type PaymentMethod } from '../types'
import { isValidDate, isValidYearMonth } from '../utils/dates'
import { MESSAGES } from './messages'

/** True for a positive, safe integer (COP amounts have no decimals). */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

/** True for a valid auto-increment entity id. Guards Dexie against invalid keys. */
export function isEntityId(value: unknown): value is number {
  return isPositiveInteger(value)
}

export function assertPositiveInteger(value: unknown, message: string): asserts value is number {
  if (!isPositiveInteger(value)) throw new ServiceError('validation', message)
}

export function assertDate(value: unknown): asserts value is string {
  if (!isValidDate(value)) throw new ServiceError('validation', MESSAGES.dateInvalid)
}

export function assertYearMonth(value: unknown): asserts value is string {
  if (!isValidYearMonth(value)) throw new ServiceError('validation', MESSAGES.yearMonthInvalid)
}

export function assertPaymentMethod(value: unknown): asserts value is PaymentMethod {
  if (!(PAYMENT_METHODS as readonly unknown[]).includes(value)) {
    throw new ServiceError('validation', MESSAGES.paymentMethodInvalid)
  }
}

/** Returns the trimmed text, or throws if it is not a string or is empty after trimming. */
export function requireText(value: unknown, message: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ServiceError('validation', message)
  }
  return value.trim()
}
