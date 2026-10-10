import { useMemo, useState } from 'react'

import { BudgetFormDialog } from '../components/budgets/BudgetFormDialog'
import { Button } from '../components/ui/Button'
import { CategoryBadge } from '../components/ui/CategoryBadge'
import { MonthSelector } from '../components/ui/MonthSelector'
import { useCategories } from '../hooks/useCategories'
import { es } from '../i18n/es'
import { listBudgets } from '../services/budgetService'
import { calculateBudgetProgress } from '../services/statisticsService'
import type { Category } from '../types'
import { formatCOP } from '../utils/currency'
import { todayLocal } from '../utils/dates'
import styles from './Budgets.module.css'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export function BudgetsPage() {
  const [yearMonth, setYearMonth] = useState(todayLocal().substring(0, 7))
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  const categories = useCategories()
  const activeCategories = useMemo(() => categories?.filter(c => c.active) ?? [], [categories])

  // Get budgets for the selected month
  const budgets = useLiveQuery(() => listBudgets(yearMonth), [yearMonth])
  
  // Get expenses for the selected month
  const expenses = useLiveQuery(
    () => db.expenses.where('date').startsWith(yearMonth).toArray(),
    [yearMonth]
  )

  const progress = useMemo(() => {
    if (!expenses || !budgets || !categories) return []
    return calculateBudgetProgress(expenses, budgets, categories, yearMonth)
  }, [expenses, budgets, categories, yearMonth])

  const progressByCat = useMemo(() => new Map(progress.map(p => [p.category.id, p])), [progress])
  const budgetByCat = useMemo(() => new Map((budgets ?? []).map(b => [b.categoryId, b])), [budgets])

  if (!categories || !budgets || !expenses) {
    return (
      <div className={styles.page}>
        <p className={styles.loading} role="status">{es.boot.loading}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{es.budgets.pageTitle}</h1>
      </header>

      <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />

      {activeCategories.length === 0 ? (
        <p className={styles.empty}>{es.budgets.noCategoryAvailable}</p>
      ) : (
        <ul className={styles.list}>
          {activeCategories.map((category) => {
            const stat = progressByCat.get(category.id)
            const budget = budgetByCat.get(category.id)
            // If stat is undefined, it means there is no budget for this category.
            // But we still want to show the category so the user can add a budget.
            // Wait, calculateBudgetProgress ONLY returns categories that HAVE a budget!
            // Let's calculate spent manually if there's no budget.
            const spent = stat 
              ? stat.spent 
              : expenses.filter(e => e.categoryId === category.id).reduce((sum, e) => sum + e.amount, 0)

            return (
              <li key={category.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <CategoryBadge category={category} />
                  <Button 
                    variant="secondary" 
                    className={styles.editBtn} 
                    onClick={() => setEditingCategory(category)}
                  >
                    {budget ? es.budgets.editBudget : es.budgets.setBudget}
                  </Button>
                </div>
                
                {stat ? (
                  <div className={styles.stats}>
                    <div className={styles.statsText}>
                      <span className={styles.spent}>{formatCOP(stat.spent)}</span>
                      <span className={styles.limit}> / {formatCOP(stat.limit)}</span>
                    </div>
                    
                    <div className={styles.barBg}>
                      <div 
                        className={styles.barFill} 
                        data-status={stat.status}
                        style={{ width: `${stat.percent}%` }}
                        role="progressbar"
                        aria-valuenow={stat.spent}
                        aria-valuemin={0}
                        aria-valuemax={stat.limit}
                        aria-label={`Progreso del presupuesto de ${category.name}`}
                      />
                    </div>
                    
                    <p className={styles.statusText} data-status={stat.status}>
                      {es.budgets.status[stat.status]}
                    </p>
                  </div>
                ) : (
                  <div className={styles.stats}>
                    <p className={styles.notSet}>{es.budgets.notSet}</p>
                    {spent > 0 && (
                      <p className={styles.spentOnly}>{es.dashboard.spentOf(formatCOP(spent), '?')}</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {editingCategory && (
        <BudgetFormDialog
          yearMonth={yearMonth}
          category={editingCategory}
          budget={budgetByCat.get(editingCategory.id)}
          onClose={() => setEditingCategory(null)}
          onSaved={() => setEditingCategory(null)}
        />
      )}
    </div>
  )
}
