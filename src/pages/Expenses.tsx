import { useDeferredValue, useState } from 'react'
import { Receipt, SearchX } from 'lucide-react'
import { ExpenseFilters } from '../components/expenses/ExpenseFilters'
import { ExpenseList } from '../components/expenses/ExpenseList'
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  toExpenseFilter,
  type FilterState,
} from '../components/expenses/filterState'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import type { Notice } from '../components/ui/NoticeHost'
import { useCategories } from '../hooks/useCategories'
import { useExpenses } from '../hooks/useExpenses'
import { es } from '../i18n/es'
import { deleteExpense } from '../services/expenseService'
import { ServiceError, type Expense } from '../types'
import { formatCOP } from '../utils/currency'
import styles from './Expenses.module.css'

interface ExpensesPageProps {
  onRegister: () => void
  onEdit: (expense: Expense) => void
  onNotify: (notice: Omit<Notice, 'id'>) => void
}

export function ExpensesPage({ onRegister, onEdit, onNotify }: ExpensesPageProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categories = useCategories()
  // Typing in the search box must not block the UI while the list re-queries.
  const deferredSearch = useDeferredValue(filters.search)
  const { filter, error } = toExpenseFilter({ ...filters, search: deferredSearch })
  const expenses = useExpenses(filter)

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteExpense(pendingDelete.id)
      onNotify({ kind: 'success', message: es.notice.deleted })
    } catch (e) {
      onNotify({
        kind: 'error',
        message: e instanceof ServiceError ? e.message : es.common.unexpectedError,
      })
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  const total = expenses?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{es.expenses.pageTitle}</h1>
        {expenses && expenses.length > 0 && (
          <p className={styles.summary}>
            {es.expenses.count(expenses.length)} · {es.expenses.total}{' '}
            <strong>{formatCOP(total)}</strong>
          </p>
        )}
      </header>

      <ExpenseFilters state={filters} onChange={setFilters} categories={categories ?? []} />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {!error && (!expenses || !categories) && (
        <p className={styles.loading} role="status">
          {es.expenses.loading}
        </p>
      )}

      {!error && expenses && categories && expenses.length > 0 && (
        <ExpenseList
          expenses={expenses}
          categories={categories}
          onEdit={onEdit}
          onDelete={setPendingDelete}
        />
      )}

      {!error && expenses && categories && expenses.length === 0 && (
        hasActiveFilters(filters) ? (
          <EmptyState
            icon={SearchX}
            title={es.expenses.empty.filteredTitle}
            text={es.expenses.empty.filteredText}
            action={
              <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                {es.common.clearFilters}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Receipt}
            title={es.expenses.empty.noneTitle}
            text={es.expenses.empty.noneText}
            action={<Button onClick={onRegister}>{es.expenses.register}</Button>}
          />
        )
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={es.expenses.confirmDelete.title}
          confirmLabel={es.expenses.confirmDelete.confirm}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
          busy={deleting}
        >
          {es.expenses.confirmDelete.text(pendingDelete.description, formatCOP(pendingDelete.amount))}
        </ConfirmDialog>
      )}
    </div>
  )
}
