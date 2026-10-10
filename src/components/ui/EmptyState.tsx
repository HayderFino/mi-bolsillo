import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  text: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, text, action }: EmptyStateProps) {
  return (
    <section className={styles.empty}>
      <span className={styles.iconWrap}>
        <Icon aria-hidden="true" size={28} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.text}>{text}</p>
      {action}
    </section>
  )
}
