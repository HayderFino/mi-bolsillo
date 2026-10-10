import { useRef } from 'react'
import { es } from '../../i18n/es'
import { useCategories } from '../../hooks/useCategories'
import type { Expense } from '../../types'
import { Dialog } from '../ui/Dialog'
import { ExpenseForm } from './ExpenseForm'

interface ExpenseFormDialogProps {
  /** Present when editing; absent when registering a new expense. */
  expense?: Expense
  onClose: () => void
  onSaved: (kind: 'created' | 'updated') => void
}

export function ExpenseFormDialog({ expense, onClose, onSaved }: ExpenseFormDialogProps) {
  const categories = useCategories()
  if (!categories) return null

  return (
    <ExpenseFormDialogContent
      expense={expense}
      categories={categories}
      onClose={onClose}
      onSaved={onSaved}
    />
  )
}

function ExpenseFormDialogContent({
  expense,
  categories,
  onClose,
  onSaved,
}: ExpenseFormDialogProps & { categories: NonNullable<ReturnType<typeof useCategories>> }) {
  const amountRef = useRef<HTMLInputElement>(null)
  return (
    <Dialog
      title={expense ? es.form.editTitle : es.form.createTitle}
      onClose={onClose}
      initialFocusRef={amountRef}
    >
      <ExpenseForm
        expense={expense}
        categories={categories}
        amountRef={amountRef}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </Dialog>
  )
}
