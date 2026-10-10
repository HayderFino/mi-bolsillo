import { afterEach, describe, expect, it } from 'vitest'
import {
  formatDisplayDate,
  isValidDate,
  isValidYearMonth,
  monthRange,
  previousYearMonth,
  todayLocal,
  yearMonthOf,
} from '../src/utils/dates'

describe('isValidDate', () => {
  it.each(['2025-03-15', '2024-02-29', '2025-12-31', '2025-01-01'])('accepts %s', (value) => {
    expect(isValidDate(value)).toBe(true)
  })

  it.each([
    '2023-02-29', // not a leap year
    '2025-02-30',
    '2025-13-01',
    '2025-00-10',
    '2025-04-31',
    '2025-1-1',
    '25-01-01',
    '2025/01/01',
    '2025-01-01T00:00:00Z',
    '1800-01-01',
    '',
    'abc',
  ])('rejects %s', (value) => {
    expect(isValidDate(value)).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isValidDate(undefined)).toBe(false)
    expect(isValidDate(null)).toBe(false)
    expect(isValidDate(20250101)).toBe(false)
  })
})

describe('isValidYearMonth', () => {
  it.each(['2025-01', '2025-12'])('accepts %s', (value) => {
    expect(isValidYearMonth(value)).toBe(true)
  })

  it.each(['2025-13', '2025-00', '2025-1', '2025-01-01', '', 'abc'])('rejects %s', (value) => {
    expect(isValidYearMonth(value)).toBe(false)
  })
})

describe('yearMonthOf', () => {
  it('extracts the month, including year boundaries', () => {
    expect(yearMonthOf('2025-12-31')).toBe('2025-12')
    expect(yearMonthOf('2026-01-01')).toBe('2026-01')
  })
})

describe('monthRange', () => {
  it.each([
    ['2025-01', '2025-01-01', '2025-01-31'],
    ['2025-02', '2025-02-01', '2025-02-28'],
    ['2024-02', '2024-02-01', '2024-02-29'], // leap year
    ['2025-04', '2025-04-01', '2025-04-30'],
    ['2025-12', '2025-12-01', '2025-12-31'],
  ])('%s spans %s to %s', (yearMonth, from, to) => {
    expect(monthRange(yearMonth)).toEqual({ from, to })
  })
})

describe('previousYearMonth', () => {
  it('goes back one month, rolling over the year boundary', () => {
    expect(previousYearMonth('2025-03')).toBe('2025-02')
    expect(previousYearMonth('2025-12')).toBe('2025-11')
    expect(previousYearMonth('2026-01')).toBe('2025-12')
  })
})

describe('local dates: no timezone shift', () => {
  const originalTZ = process.env.TZ
  afterEach(() => {
    if (originalTZ === undefined) delete process.env.TZ
    else process.env.TZ = originalTZ
  })

  it('the test can really change the timezone (guards against a vacuous pass)', () => {
    process.env.TZ = 'Pacific/Pago_Pago' // UTC-11
    const lateNight = new Date(2025, 2, 15, 23, 30)
    // The naive UTC approach WOULD give the next day here; that is the bug being prevented.
    expect(lateNight.toISOString().slice(0, 10)).toBe('2025-03-16')
  })

  it.each(['America/Bogota', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'Asia/Tokyo', 'UTC'])(
    'todayLocal keeps the local calendar day in %s',
    (timeZone) => {
      process.env.TZ = timeZone
      expect(todayLocal(new Date(2025, 2, 15, 0, 30))).toBe('2025-03-15')
      expect(todayLocal(new Date(2025, 2, 15, 23, 30))).toBe('2025-03-15')
      expect(todayLocal(new Date(2025, 11, 31, 23, 59))).toBe('2025-12-31')
      expect(todayLocal(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01')
    },
  )

  it.each(['America/Bogota', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'Asia/Tokyo', 'UTC'])(
    'formatDisplayDate shows the same day in %s',
    (timeZone) => {
      process.env.TZ = timeZone
      expect(formatDisplayDate('2025-03-15')).toMatch(/^15 de mar/)
      expect(formatDisplayDate('2025-12-31')).toMatch(/^31 de dic/)
      expect(formatDisplayDate('2026-01-01')).toMatch(/^1 de ene/)
    },
  )
})
