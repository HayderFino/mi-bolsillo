import { Pencil, Trash2 } from 'lucide-react'
import { DESKTOP_QUERY, useMediaQuery } from '../../hooks/useMediaQuery'
import { es } from '../../i18n/es'
import type { Category, Expense } from '../../types'
import { formatCOP } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/dates'
import { CategoryBadge } from '../ui/CategoryBadge'
import styles from './ExpenseList.module.css'

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

/** Cards on mobile, table on wide screens. Only one of them is rendered. */
export function ExpenseList({ expenses, categories, onEdit, onDelete }: ExpenseListProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const byId = new Map(categories.map((category) => [category.id, category]))
  const rowProps = { expenses, byId, onEdit, onDelete }
  return isDesktop ? <ExpenseTable {...rowProps} /> : <ExpenseCards {...rowProps} />
}

interface RowsProps {
  expenses: Expense[]
  byId: Map<number, Category>
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

const FALLBACK_CATEGORY = { name: es.expenses.noCategory, icon: '', color: '#6b7280' }

function Actions({ expense, onEdit, onDelete }: Pick<RowsProps, 'onEdit' | 'onDelete'> & { expense: Expense }) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={es.expenses.editLabel(expense.description)}
        onClick={() => onEdit(expense)}
      >
        <Pencil aria-hidden="true" size={18} />
      </button>
      <button
        type="button"
        className={`${styles.iconButton} ${styles.danger}`}
        aria-label={es.expenses.deleteLabel(expense.description)}
        onClick={() => onDelete(expense)}
      >
        <Trash2 aria-hidden="true" size={18} />
      </button>
    </div>
  )
}

function ExpenseCards({ expenses, byId, onEdit, onDelete }: RowsProps) {
  return (
    <ul className={styles.cards}>
      {expenses.map((expense) => (
        <li key={expense.id} className={styles.card}>
          <div className={styles.cardMain}>
            <p className={styles.description}>{expense.description}</p>
            <p className={styles.amount}>{formatCOP(expense.amount)}</p>
          </div>
          <div className={styles.cardMeta}>
            <CategoryBadge category={byId.get(expense.categoryId) ?? FALLBACK_CATEGORY} />
            <span className={styles.muted}>
              {formatDisplayDate(expense.date)} · {es.expenses.paymentMethods[expense.paymentMethod]}
            </span>
          </div>
          <Actions expense={expense} onEdit={onEdit} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  )
}

function ExpenseTable({ expenses, byId, onEdit, onDelete }: RowsProps) {
  const columns = es.expenses.columns
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>{es.expenses.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.date}</th>
            <th scope="col">{columns.description}</th>
            <th scope="col">{columns.category}</th>
            <th scope="col">{columns.method}</th>
            <th scope="col" className={styles.right}>
              {columns.amount}
            </th>
            <th scope="col">
              <span className={styles.srOnly}>{columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td className={styles.nowrap}>{formatDisplayDate(expense.date)}</td>
              <td>{expense.description}</td>
              <td>
                <CategoryBadge category={byId.get(expense.categoryId) ?? FALLBACK_CATEGORY} />
              </td>
              <td>{es.expenses.paymentMethods[expense.paymentMethod]}</td>
              <td className={`${styles.right} ${styles.amount}`}>{formatCOP(expense.amount)}</td>
              <td>
                <Actions expense={expense} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
