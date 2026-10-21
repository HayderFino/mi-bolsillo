import {
  Utensils,
  House,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Clapperboard,
  Ellipsis,
  Car,
  Zap,
  Plane,
  Coffee,
  Gift,
  Briefcase,
  Smartphone,
  Music,
  Scissors,
  Wrench,
  CircleHelp,
  Monitor,
  Pill,
  Baby,
  Dog,
  Film,
  Bus,
  ShoppingBag
} from 'lucide-react'
import type { AllowedIcon } from '../../constants/categoryAppearance'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<AllowedIcon, LucideIcon> & Record<string, LucideIcon> = {
  // Allowed icons
  'utensils': Utensils,
  'shopping-cart': ShoppingCart,
  'car': Car,
  'home': House,
  'zap': Zap,
  'smartphone': Smartphone,
  'monitor': Monitor,
  'briefcase': Briefcase,
  'graduation-cap': GraduationCap,
  'heart-pulse': HeartPulse,
  'pill': Pill,
  'baby': Baby,
  'dog': Dog,
  'plane': Plane,
  'coffee': Coffee,
  'gift': Gift,
  'film': Film,
  'music': Music,
  'scissors': Scissors,
  'wrench': Wrench,
  'circle-help': CircleHelp,

  // Legacy / seed aliases
  'house': House,
  'bus': Bus,
  'shopping-bag': ShoppingBag,
  'clapperboard': Clapperboard,
  'ellipsis': Ellipsis,
}

interface Props {
  iconName: string
  className?: string
  size?: number
}

export function CategoryIcon({ iconName, className, size = 24 }: Props) {
  const Icon = iconMap[iconName as AllowedIcon] || CircleHelp
  return <Icon className={className} size={size} aria-hidden="true" />
}
