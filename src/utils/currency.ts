const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Formats an integer amount as COP, e.g. `$ 25.000`. */
export function formatCOP(amount: number): string {
  return copFormatter.format(amount)
}

/** Maximum digits accepted in the amount field (keeps values far below MAX_SAFE_INTEGER). */
export const MAX_AMOUNT_DIGITS = 12

/**
 * Display value for the amount input: digits grouped with "." (es-CO), e.g. `1.234.567`.
 * Grouping is done by hand (not Intl) so what the user sees while typing is deterministic.
 * A comma means the user typed or pasted a decimal; it is kept as-is so validation can reject it.
 */
export function formatAmountInput(raw: string): string {
  if (raw.includes(',')) return raw.replace(/[^\d.,]/g, '')
  const digits = raw.replace(/\D/g, '').slice(0, MAX_AMOUNT_DIGITS).replace(/^0+(?=\d)/, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export type ParsedAmount =
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'ok'; value: number }

/**
 * Reads the amount input text. "." is a thousands separator; any decimal part is invalid
 * because COP amounts are stored as whole numbers.
 */
export function parseAmountInput(text: string): ParsedAmount {
  const trimmed = text.trim()
  if (trimmed === '') return { status: 'empty' }
  if (!/^\d{1,3}(\.\d{3})*$|^\d+$/.test(trimmed)) return { status: 'invalid' }
  return { status: 'ok', value: Number(trimmed.replaceAll('.', '')) }
}
