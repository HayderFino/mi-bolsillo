import { useDeferredValue, useState } from 'react'
import { SearchX, Wallet } from 'lucide-react'
import { IncomeFilters } from '../components/incomes/IncomeFilters'
import { IncomeList } from '../components/incomes/IncomeList'
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  toIncomeFilter,
  type FilterState,
} from '../components/expenses/filterState'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import type { Notice } from '../components/ui/NoticeHost'
import { useIncomeCategories } from '../hooks/useIncomeCategories'
import { useIncomes } from '../hooks/useIncomes'
import { es } from '../i18n/es'
import { deleteIncome } from '../services/incomeService'
import { ServiceError, type Income } from '../types'
import { formatCOP } from '../utils/currency'
import styles from './Expenses.module.css'

interface IncomesPageProps {
  onRegister: () => void
  onEdit: (income: Income) => void
  onNotify: (notice: Omit<Notice, 'id'>) => void
}

/**
 * Same shape as the expenses page, but on its own table.
 * `toIncomeFilter` shares the period/range logic with expenses and only renames the
 * category field, so both lists apply identical date/search filters.
 */
export function IncomesPage({ onRegister, onEdit, onNotify }: IncomesPageProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [pendingDelete, setPendingDelete] = useState<Income | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categories = useIncomeCategories()
  // Typing in the search box must not block the UI while the list re-queries.
  const deferredSearch = useDeferredValue(filters.search)
  const { filter, error } = toIncomeFilter({ ...filters, search: deferredSearch })
  const incomes = useIncomes(filter)

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteIncome(pendingDelete.id)
      onNotify({ kind: 'success', message: es.notice.incomeDeleted })
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

  const total = incomes?.reduce((sum, income) => sum + income.amount, 0) ?? 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{es.incomes.pageTitle}</h1>
        {incomes && incomes.length > 0 && (
          <p className={styles.summary}>
            {es.incomes.count(incomes.length)} · {es.incomes.total}{' '}
            <strong>{formatCOP(total)}</strong>
          </p>
        )}
      </header>

      <IncomeFilters state={filters} onChange={setFilters} categories={categories ?? []} />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {!error && (!incomes || !categories) && (
        <p className={styles.loading} role="status">
          {es.incomes.loading}
        </p>
      )}

      {!error && incomes && categories && incomes.length > 0 && (
        <IncomeList
          incomes={incomes}
          categories={categories}
          onEdit={onEdit}
          onDelete={setPendingDelete}
        />
      )}

      {!error && incomes && categories && incomes.length === 0 && (
        hasActiveFilters(filters) ? (
          <EmptyState
            icon={SearchX}
            title={es.incomes.empty.filteredTitle}
            text={es.incomes.empty.filteredText}
            action={
              <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                {es.common.clearFilters}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Wallet}
            title={es.incomes.empty.noneTitle}
            text={es.incomes.empty.noneText}
            action={<Button onClick={onRegister}>{es.incomes.register}</Button>}
          />
        )
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={es.incomes.confirmDelete.title}
          confirmLabel={es.incomes.confirmDelete.confirm}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
          busy={deleting}
        >
          {es.incomes.confirmDelete.text(pendingDelete.description, formatCOP(pendingDelete.amount))}
        </ConfirmDialog>
      )}
    </div>
  )
}
