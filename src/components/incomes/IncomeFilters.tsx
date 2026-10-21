import { useId, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { es } from '../../i18n/es'
import { PAYMENT_METHODS, type IncomeCategory, type PaymentMethod } from '../../types'
import { controlClassName } from '../ui/controlClassName'
import { Field } from '../ui/Field'
import { activeFilterCount, type FilterState, type Period } from '../expenses/filterState'
import styles from '../expenses/ExpenseFilters.module.css'

interface IncomeFiltersProps {
  state: FilterState
  onChange: (next: FilterState) => void
  categories: IncomeCategory[]
}

const PERIODS: Period[] = ['all', 'month', 'prevMonth', 'custom']

/** Same filter shape as expenses; only the category list and labels change. */
export function IncomeFilters({ state, onChange, categories }: IncomeFiltersProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const count = activeFilterCount(state)
  const patch = (changes: Partial<FilterState>) => onChange({ ...state, ...changes })

  return (
    <section className={styles.filters} aria-label={es.incomeFilters.toggle}>
      <div className={styles.top}>
        <Field label={es.incomeFilters.search}>
          {(control) => (
            <div className={styles.searchWrap}>
              <Search className={styles.searchIcon} aria-hidden="true" size={18} />
              <input
                {...control}
                className={`${controlClassName} ${styles.searchInput}`}
                type="search"
                autoComplete="off"
                value={state.search}
                onChange={(e) => patch({ search: e.target.value })}
              />
            </div>
          )}
        </Field>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <SlidersHorizontal aria-hidden="true" size={18} />
          <span>{es.incomeFilters.toggle}</span>
          {count > 0 && <span className={styles.count}>{count}</span>}
        </button>
      </div>

      <div id={panelId} className={`${styles.panel} ${open ? styles.open : ''}`}>
        <Field label={es.incomeFilters.period}>
          {(control) => (
            <select
              {...control}
              className={controlClassName}
              value={state.period}
              onChange={(e) => patch({ period: e.target.value as Period })}
            >
              {PERIODS.map((period) => (
                <option key={period} value={period}>
                  {es.incomeFilters.periods[period]}
                </option>
              ))}
            </select>
          )}
        </Field>

        {state.period === 'custom' && (
          <>
            <Field label={es.incomeFilters.from}>
              {(control) => (
                <input
                  {...control}
                  className={controlClassName}
                  type="date"
                  value={state.from}
                  onChange={(e) => patch({ from: e.target.value })}
                />
              )}
            </Field>
            <Field label={es.incomeFilters.to}>
              {(control) => (
                <input
                  {...control}
                  className={controlClassName}
                  type="date"
                  value={state.to}
                  onChange={(e) => patch({ to: e.target.value })}
                />
              )}
            </Field>
          </>
        )}

        <Field label={es.incomeFilters.category}>
          {(control) => (
            <select
              {...control}
              className={controlClassName}
              value={state.categoryId}
              onChange={(e) => patch({ categoryId: e.target.value })}
            >
              <option value="">{es.incomeFilters.allCategories}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label={es.incomeFilters.paymentMethod}>
          {(control) => (
            <select
              {...control}
              className={controlClassName}
              value={state.paymentMethod}
              onChange={(e) => patch({ paymentMethod: e.target.value as '' | PaymentMethod })}
            >
              <option value="">{es.incomeFilters.allPaymentMethods}</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {es.expenses.paymentMethods[method]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
    </section>
  )
}
