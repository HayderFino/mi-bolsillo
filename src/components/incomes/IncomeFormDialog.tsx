import { useRef } from 'react'
import { es } from '../../i18n/es'
import { useIncomeCategories } from '../../hooks/useIncomeCategories'
import type { Income } from '../../types'
import { Dialog } from '../ui/Dialog'
import { IncomeForm } from './IncomeForm'

interface IncomeFormDialogProps {
  /** Present when editing; absent when registering a new income. */
  income?: Income
  onClose: () => void
  onSaved: (kind: 'created' | 'updated') => void
}

export function IncomeFormDialog({ income, onClose, onSaved }: IncomeFormDialogProps) {
  const categories = useIncomeCategories()
  if (!categories) return null

  return (
    <IncomeFormDialogContent
      income={income}
      categories={categories}
      onClose={onClose}
      onSaved={onSaved}
    />
  )
}

function IncomeFormDialogContent({
  income,
  categories,
  onClose,
  onSaved,
}: IncomeFormDialogProps & { categories: NonNullable<ReturnType<typeof useIncomeCategories>> }) {
  const amountRef = useRef<HTMLInputElement>(null)
  return (
    <Dialog
      title={income ? es.incomeForm.editTitle : es.incomeForm.createTitle}
      onClose={onClose}
      initialFocusRef={amountRef}
    >
      <IncomeForm
        income={income}
        categories={categories}
        amountRef={amountRef}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </Dialog>
  )
}
