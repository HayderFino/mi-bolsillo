import {
  Bus,
  Clapperboard,
  Ellipsis,
  GraduationCap,
  HeartPulse,
  House,
  ShoppingBag,
  Tag,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { Category } from '../../types'
import styles from './CategoryBadge.module.css'

/** Category icons are stored as Lucide names; unknown names fall back to a generic tag. */
const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  bus: Bus,
  house: House,
  'shopping-bag': ShoppingBag,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  clapperboard: Clapperboard,
  ellipsis: Ellipsis,
}

export function CategoryBadge({ category }: { category: Pick<Category, 'name' | 'icon' | 'color'> }) {
  const Icon = ICONS[category.icon] ?? Tag
  return (
    <span className={styles.badge}>
      <span className={styles.dot} style={{ backgroundColor: category.color }}>
        <Icon aria-hidden="true" size={14} />
      </span>
      <span>{category.name}</span>
    </span>
  )
}
