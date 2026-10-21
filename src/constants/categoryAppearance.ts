export const ALLOWED_ICONS = [
  'utensils',
  'shopping-cart',
  'car',
  'home',
  'zap',
  'smartphone',
  'monitor',
  'briefcase',
  'graduation-cap',
  'heart-pulse',
  'pill',
  'baby',
  'dog',
  'plane',
  'coffee',
  'gift',
  'film',
  'music',
  'scissors',
  'wrench',
  'circle-help'
] as const

export type AllowedIcon = typeof ALLOWED_ICONS[number]

export const ALLOWED_COLORS = [
  '#B4493F', // Rojo sobrio
  '#C27C2C', // Naranja/Ambar sobrio
  '#2F7D5B', // Verde oscuro
  '#2B5D8A', // Azul sobrio
  '#7B4F8A', // Violeta sobrio
  '#3F7F8C', // Teal sobrio
  '#8A6D3B', // Oro oscuro
  '#6B7280'  // Gris
] as const

export type AllowedColor = typeof ALLOWED_COLORS[number]

export const ICON_LABELS: Record<AllowedIcon, string> = {
  'utensils': 'Alimentación',
  'shopping-cart': 'Compras',
  'car': 'Vehículo',
  'home': 'Hogar',
  'zap': 'Electricidad',
  'smartphone': 'Celular',
  'monitor': 'Tecnología',
  'briefcase': 'Trabajo',
  'graduation-cap': 'Educación',
  'heart-pulse': 'Salud',
  'pill': 'Medicamentos',
  'baby': 'Bebé',
  'dog': 'Mascotas',
  'plane': 'Viajes',
  'coffee': 'Café',
  'gift': 'Regalos',
  'film': 'Cine',
  'music': 'Música',
  'scissors': 'Belleza',
  'wrench': 'Mantenimiento',
  'circle-help': 'Ayuda'
}

export const COLOR_LABELS: Record<AllowedColor, string> = {
  '#B4493F': 'Rojo terracota',
  '#C27C2C': 'Ocre',
  '#2F7D5B': 'Verde bosque',
  '#2B5D8A': 'Azul acero',
  '#7B4F8A': 'Púrpura',
  '#3F7F8C': 'Verde mar',
  '#8A6D3B': 'Dorado oscuro',
  '#6B7280': 'Gris neutro'
}

/**
 * Calculates the relative luminance of a color.
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Parses a hex color string (e.g. '#FFFFFF') to RGB values.
 */
function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '')
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16)
  }
}

/**
 * Returns either white or dark gray depending on which provides better contrast.
 * Using WCAG 2.0 formula for contrast ratio.
 */
export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor)
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  
  // Calcular luminancia real del texto oscuro y claro
  const darkRgb = hexToRgb('#111827')
  const darkLuminance = getLuminance(darkRgb.r, darkRgb.g, darkRgb.b)
  
  const whiteLuminance = getLuminance(255, 255, 255)
  
  // Ratios
  const ratioDark = (Math.max(luminance, darkLuminance) + 0.05) / (Math.min(luminance, darkLuminance) + 0.05)
  const ratioWhite = (Math.max(luminance, whiteLuminance) + 0.05) / (Math.min(luminance, whiteLuminance) + 0.05)
  
  return ratioWhite >= ratioDark ? '#FFFFFF' : '#111827'
}
