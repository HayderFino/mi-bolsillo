import { describe, expect, it } from 'vitest'
import { ALLOWED_COLORS, getContrastColor } from '../../src/constants/categoryAppearance'

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '')
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16)
  }
}

function getLuminance(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

describe('categoryAppearance', () => {
  it('ALLOWED_COLORS contains unique colors', () => {
    const uniqueColors = new Set(ALLOWED_COLORS)
    expect(uniqueColors.size).toBe(ALLOWED_COLORS.length)
  })

  it('ensures all allowed colors have good contrast (>= 4.5:1) against their chosen text color', () => {
    const results = ALLOWED_COLORS.map(color => {
      const textColor = getContrastColor(color)
      const rgb = hexToRgb(color)
      const textRgb = hexToRgb(textColor)
      
      const bgL = getLuminance(rgb.r, rgb.g, rgb.b)
      const textL = getLuminance(textRgb.r, textRgb.g, textRgb.b)
      
      const ratio = (Math.max(bgL, textL) + 0.05) / (Math.min(bgL, textL) + 0.05)
      
      return {
        color,
        textColor,
        ratio: Number(ratio.toFixed(2))
      }
    })

    console.table(results)

    for (const res of results) {
      expect(res.ratio).toBeGreaterThanOrEqual(4.5)
    }
  })
})
