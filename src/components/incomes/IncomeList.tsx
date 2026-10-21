import { Pencil, Trash2 } from 'lucide-react'
import { DESKTOP_QUERY, useMediaQuery } from '../../hooks/useMediaQuery'
import { es } from '../../i18n/es'
import type { Income, IncomeCategory } from '../../types'
import { formatCOP } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/dates'
import { CategoryBadge } from '../ui/CategoryBadge'
import styles from '../expenses/ExpenseList.module.css'

interface IncomeListProps {
  incomes: Income[]
  categories: IncomeCategory[]
  onEdit: (income: Income) => void
  onDelete: (income: Income) => void
}

/** Cards on mobile, table on wide screens. Only one of them is rendered. */
export function IncomeList({ incomes, categories, onEdit, onDelete }: IncomeListProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const byId = new Map(categories.map((category) => [category.id, category]))
  const rowProps = { incomes, byId, onEdit, onDelete }
  return isDesktop ? <IncomeTable {...rowProps} /> : <IncomeCards {...rowProps} />
}

interface RowsProps {
  incomes: Income[]
  byId: Map<number, IncomeCategory>
  onEdit: (income: Income) => void
  onDelete: (income: Income) => void
}

const FALLBACK_CATEGORY = { name: es.incomes.noCategory, icon: '', color: '#6b7280' }

function Actions({ income, onEdit, onDelete }: Pick<RowsProps, 'onEdit' | 'onDelete'> & { income: Income }) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={es.incomes.editLabel(income.description)}
        onClick={() => onEdit(income)}
      >
        <Pencil aria-hidden="true" size={18} />
      </button>
      <button
        type="button"
        className={`${styles.iconButton} ${styles.danger}`}
        aria-label={es.incomes.deleteLabel(income.description)}
        onClick={() => onDelete(income)}
      >
        <Trash2 aria-hidden="true" size={18} />
      </button>
    </div>
  )
}

function IncomeCards({ incomes, byId, onEdit, onDelete }: RowsProps) {
  return (
    <ul className={styles.cards}>
      {incomes.map((income) => (
        <li key={income.id} className={styles.card}>
          <div className={styles.cardMain}>
            <p className={styles.description}>{income.description}</p>
            <p className={styles.amount}>{formatCOP(income.amount)}</p>
          </div>
          <div className={styles.cardMeta}>
            <CategoryBadge category={byId.get(income.incomeCategoryId) ?? FALLBACK_CATEGORY} />
            <span className={styles.muted}>
              {formatDisplayDate(income.date)} · {es.expenses.paymentMethods[income.paymentMethod]}
            </span>
          </div>
          <Actions income={income} onEdit={onEdit} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  )
}

function IncomeTable({ incomes, byId, onEdit, onDelete }: RowsProps) {
  const columns = es.incomes.columns
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>{es.incomes.tableCaption}</caption>
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
          {incomes.map((income) => (
            <tr key={income.id}>
              <td className={styles.nowrap}>{formatDisplayDate(income.date)}</td>
              <td>{income.description}</td>
              <td>
                <CategoryBadge category={byId.get(income.incomeCategoryId) ?? FALLBACK_CATEGORY} />
              </td>
              <td>{es.expenses.paymentMethods[income.paymentMethod]}</td>
              <td className={`${styles.right} ${styles.amount}`}>{formatCOP(income.amount)}</td>
              <td>
                <Actions income={income} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
