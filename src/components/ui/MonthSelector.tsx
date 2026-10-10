import { ChevronLeft, ChevronRight } from 'lucide-react'
import { es } from '../../i18n/es'
import styles from './MonthSelector.module.css'

interface MonthSelectorProps {
  yearMonth: string
  onChange: (yearMonth: string) => void
}

export function MonthSelector({ yearMonth, onChange }: MonthSelectorProps) {
  const [yearStr, monthStr] = yearMonth.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) // 1-12

  function changeMonth(delta: number) {
    let nextMonth = month + delta
    let nextYear = year
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear++
    } else if (nextMonth < 1) {
      nextMonth = 12
      nextYear--
    }
    const nextMonthStr = nextMonth.toString().padStart(2, '0')
    onChange(`${nextYear}-${nextMonthStr}`)
  }

  // Create a local date for the 1st of the month to get the month name
  // Note: month index is 0-based for Date constructor
  const date = new Date(year, month - 1, 1)
  const monthName = date.toLocaleString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <div className={styles.container} role="group" aria-label={es.common.selectMonth}>
      <button 
        type="button" 
        className={styles.button} 
        onClick={() => changeMonth(-1)}
        aria-label={es.common.prevMonth}
      >
        <ChevronLeft size={24} />
      </button>
      <p className={styles.label} aria-live="polite">
        {monthName}
      </p>
      <button 
        type="button" 
        className={styles.button} 
        onClick={() => changeMonth(1)}
        aria-label={es.common.nextMonth}
      >
        <ChevronRight size={24} />
      </button>
    </div>
  )
}
