import { useState } from 'react'
import { es } from '../../i18n/es'
import { deleteBudget, setBudget } from '../../services/budgetService'
import { ServiceError, type Budget, type Category } from '../../types'
import { formatAmountInput, parseAmountInput } from '../../utils/currency'
import { Button } from '../ui/Button'
import { controlClassName } from '../ui/controlClassName'
import { Dialog } from '../ui/Dialog'
import { Field } from '../ui/Field'
import styles from './BudgetFormDialog.module.css'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface BudgetFormDialogProps {
  yearMonth: string
  category: Category
  budget?: Budget
  onClose: () => void
  onSaved: () => void
}

export function BudgetFormDialog({ yearMonth, category, budget, onClose, onSaved }: BudgetFormDialogProps) {
  const [amountText, setAmountText] = useState(budget ? formatAmountInput(String(budget.limitAmount)) : '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setError(null)

    const parsed = parseAmountInput(amountText)
    if (parsed.status !== 'ok' || parsed.value <= 0) {
      setError(es.form.errors.amountRequired)
      return
    }

    setSaving(true)
    try {
      await setBudget({ categoryId: category.id, yearMonth, limitAmount: parsed.value })
      onSaved()
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : es.common.unexpectedError)
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await deleteBudget(category.id, yearMonth)
      onSaved()
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : es.common.unexpectedError)
      setSaving(false)
      setConfirmDelete(false)
    }
  }

  if (confirmDelete) {
    return (
      <ConfirmDialog
        title={es.budgets.confirmDelete.title}
        confirmLabel={es.budgets.confirmDelete.confirm}
        busy={saving}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      >
        {es.budgets.confirmDelete.text(category.name)}
      </ConfirmDialog>
    )
  }

  return (
    <Dialog title={budget ? es.budgets.editBudget : es.budgets.setBudget} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <p className={styles.categoryName}>{category.name}</p>

        <Field label={es.budgets.form.limitAmount} error={error || undefined}>
          {(control) => (
            <div className={styles.amountWrap}>
              <span className={styles.prefix} aria-hidden="true">$</span>
              <input
                {...control}
                autoFocus
                className={`${controlClassName} ${styles.amountInput}`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={amountText}
                onChange={(e) => setAmountText(formatAmountInput(e.target.value))}
              />
            </div>
          )}
        </Field>

        <div className={styles.actions}>
          {budget ? (
            <Button variant="danger" type="button" onClick={() => setConfirmDelete(true)} disabled={saving}>
              {es.budgets.form.delete}
            </Button>
          ) : (
            <div /> // spacer
          )}
          
          <div className={styles.submitActions}>
            <Button variant="secondary" onClick={onClose} type="button">
              {es.common.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              {budget ? es.budgets.form.submitEdit : es.budgets.form.submitCreate}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
