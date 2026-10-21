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
  Smile,
  Smartphone,
  Book,
  Music,
  Scissors,
  Wrench,
  CircleHelp
} from 'lucide-react'
import type { AllowedIcon } from '../../constants/categoryAppearance'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<AllowedIcon, LucideIcon> = {
  'utensils': Utensils,
  // bus: Bus removed as it is not allowed
  'home': House,
  'shopping-cart': ShoppingCart,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'clapperboard': Clapperboard,
  'ellipsis': Ellipsis,
  'car': Car,
  'zap': Zap,
  'plane': Plane,
  'coffee': Coffee,
  'gift': Gift,
  'briefcase': Briefcase,
  'smile': Smile,
  'smartphone': Smartphone,
  'book': Book,
  'music': Music,
  'scissors': Scissors,
  'wrench': Wrench,
  'circle-help': CircleHelp
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
