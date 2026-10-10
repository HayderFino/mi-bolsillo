import { describe, expect, it } from 'vitest'
import { formatAmountInput, formatCOP, parseAmountInput } from '../src/utils/currency'

// Intl uses a non-breaking space after "$"; normalize so assertions stay readable.
const plain = (text: string) => text.replace(/\s/g, ' ')

describe('formatCOP', () => {
  it.each([
    [0, '$ 0'],
    [999, '$ 999'],
    [1000, '$ 1.000'],
    [25000, '$ 25.000'],
    [1234567, '$ 1.234.567'],
  ])('formats %i as %s (no decimals)', (amount, expected) => {
    expect(plain(formatCOP(amount))).toBe(expected)
  })
})

describe('formatAmountInput', () => {
  it.each([
    ['', ''],
    ['5', '5'],
    ['25000', '25.000'],
    ['1234567', '1.234.567'],
    ['25.000', '25.000'],
    ['0012', '12'],
    ['0', '0'],
    ['abc12x', '12'],
    ['$ 1000', '1.000'],
  ])('shows %j as %j', (raw, expected) => {
    expect(formatAmountInput(raw)).toBe(expected)
  })

  it('caps the number of digits', () => {
    expect(formatAmountInput('1234567890123456')).toBe('123.456.789.012')
  })

  it('keeps a typed decimal comma so validation can reject it', () => {
    expect(formatAmountInput('10,5')).toBe('10,5')
  })
})

describe('parseAmountInput', () => {
  it.each([
    ['25000', 25000],
    ['25.000', 25000],
    ['1.234.567', 1234567],
    ['0', 0],
  ])('reads %j as the integer %i', (text, value) => {
    expect(parseAmountInput(text)).toEqual({ status: 'ok', value })
  })

  it.each(['', '   '])('reports %j as empty', (text) => {
    expect(parseAmountInput(text)).toEqual({ status: 'empty' })
  })

  it.each(['10,5', '10.5', '1.23', '12.3456', '-5', 'abc', '1e3', '$100'])(
    'rejects %j (not a whole number)',
    (text) => {
      expect(parseAmountInput(text)).toEqual({ status: 'invalid' })
    },
  )

  it('round-trips with the input formatter and always yields integers', () => {
    for (const value of [1, 999, 1000, 25000, 1234567, 999999999999]) {
      const shown = formatAmountInput(String(value))
      const parsed = parseAmountInput(shown)
      expect(parsed).toEqual({ status: 'ok', value })
      expect(Number.isInteger(value)).toBe(true)
    }
  })
})
