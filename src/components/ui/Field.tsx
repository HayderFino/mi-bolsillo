import { useId, type ReactNode } from 'react'
import styles from './Field.module.css'

export interface FieldControlProps {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

interface FieldProps {
  label: string
  error?: string
  children: (control: FieldControlProps) => ReactNode
}

/** Visible label + control + error message, wired with `for`, `aria-invalid` and `aria-describedby`. */
export function Field({ label, error, children }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
