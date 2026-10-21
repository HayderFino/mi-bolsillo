import { useEffect, useState, type ReactNode } from 'react'
import { Database } from 'lucide-react'
import { es } from '../../i18n/es'
import { ensureDefaultCategories } from '../../services/categoryService'
import { seedDefaultIncomeCategories } from '../../db/seed'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import styles from './DatabaseGate.module.css'

type Status = 'loading' | 'ready' | 'error'

/**
 * Startup: creates the default categories (idempotent) before rendering the app.
 * Safe under React StrictMode, which runs this effect twice in development: the seed is one
 * transaction guarded by a flag, so concurrent runs cannot duplicate categories.
 */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([ensureDefaultCategories(), seedDefaultIncomeCategories()]).then(
      () => {
        if (!cancelled) setStatus('ready')
      },
      () => {
        if (!cancelled) setStatus('error')
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (status === 'ready') return children

  if (status === 'error') {
    return (
      <div className={styles.center}>
        <EmptyState
          icon={Database}
          title={es.boot.errorTitle}
          text={es.boot.errorText}
          action={
            <Button
              onClick={() => {
                setStatus('loading')
                setAttempt((n) => n + 1)
              }}
            >
              {es.common.retry}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className={styles.center}>
      <p role="status">{es.boot.loading}</p>
    </div>
  )
}
