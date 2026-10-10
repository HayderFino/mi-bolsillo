import { useId, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { es } from '../../i18n/es'
import { PAYMENT_METHODS, type Category, type PaymentMethod } from '../../types'
import { controlClassName } from '../ui/controlClassName'
import { Field } from '../ui/Field'
import { activeFilterCount, type FilterState, type Period } from './filterState'
import styles from './ExpenseFilters.module.css'

interface ExpenseFiltersProps {
  state: FilterState
  onChange: (next: FilterState) => void
  categories: Category[]
}

const PERIODS: Period[] = ['all', 'month', 'prevMonth', 'custom']

export function ExpenseFilters({ state, onChange, categories }: ExpenseFiltersProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const count = activeFilterCount(state)
  const patch = (changes: Partial<FilterState>) => onChange({ ...state, ...changes })

  return (
    <section className={styles.filters} aria-label={es.filters.toggle}>
      <div className={styles.top}>
        <Field label={es.filters.search}>
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
          <span>{es.filters.toggle}</span>
          {count > 0 && <span className={styles.count}>{count}</span>}
        </button>
      </div>

      {/* Collapsible on mobile; always visible on wide screens (see CSS). */}
      <div id={panelId} className={`${styles.panel} ${open ? styles.open : ''}`}>
        <Field label={es.filters.period}>
          {(control) => (
            <select
              {...control}
              className={controlClassName}
              value={state.period}
              onChange={(e) => patch({ period: e.target.value as Period })}
            >
              {PERIODS.map((period) => (
                <option key={period} value={period}>
                  {es.filters.periods[period]}
                </option>
              ))}
            </select>
          )}
        </Field>

        {state.period === 'custom' && (
          <>
            <Field label={es.filters.from}>
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
            <Field label={es.filters.to}>
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

        <Field label={es.filters.category}>
          {(control) => (
            <select
              {...control}
              className={controlClassName}
              value={state.categoryId}
              onChange={(e) => patch({ categoryId: e.target.value })}
            >
              <option value="">{es.filters.allCategories}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label={es.filters.paymentMethod}>
          {(control) => (
            <select
              {...control}
              className={controlClassName}
              value={state.paymentMethod}
              onChange={(e) => patch({ paymentMethod: e.target.value as '' | PaymentMethod })}
            >
              <option value="">{es.filters.allPaymentMethods}</option>
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
