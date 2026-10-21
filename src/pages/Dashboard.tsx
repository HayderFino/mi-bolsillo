import { lazy, Suspense, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { CategoryBadge } from '../components/ui/CategoryBadge'
import { MonthSelector } from '../components/ui/MonthSelector'
import { formatCOP } from '../utils/currency'
import { monthRange, todayLocal } from '../utils/dates'
import { es } from '../i18n/es'
import { 
  calculateTotalExpenses,
  calculateMovementCount,
  calculateTopCategories,
  calculateBudgetSummary,
  calculateDistributionByCategory,
  calculateEvolutionByDay,
  calculateCategoryComparison
} from '../services/statisticsService'
import { Plus } from 'lucide-react'
import classes from './Dashboard.module.css'
import { useCategories } from '../hooks/useCategories'

const DashboardCharts = lazy(() => import('./DashboardCharts'))

interface DashboardProps {
  onRegister?: () => void
}

export function DashboardPage({ onRegister }: DashboardProps) {
  const [yearMonth, setYearMonth] = useState(todayLocal().substring(0, 7))
  const { from, to } = monthRange(yearMonth)

  const categories = useCategories()

  const data = useLiveQuery(async () => {
    const allExpenses = await db.expenses
      .where('date')
      .between(from, to, true, true)
      .toArray()
      
    const recentExpenses = [...allExpenses]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)

    const budgets = await db.budgets.where('yearMonth').equals(yearMonth).toArray()

    return { allExpenses, recentExpenses, budgets }
  }, [from, to, yearMonth])

  if (!data || !categories) {
    return (
      <div className={classes.root}>
        <header className={classes.headerRow}>
          <h1 className={classes.header}>{es.dashboard.pageTitle}</h1>
          <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />
        </header>
        <div className={classes.loadingState}>
          {es.boot.loading}
        </div>
      </div>
    )
  }

  const { allExpenses, recentExpenses, budgets } = data

  const totalSpent = calculateTotalExpenses(allExpenses, yearMonth)
  const movementCount = calculateMovementCount(allExpenses, yearMonth)
  const topCategories = calculateTopCategories(allExpenses, categories, yearMonth, 1)
  const topCategory = topCategories.length > 0 ? topCategories[0] : null
  const budgetSummary = calculateBudgetSummary(allExpenses, budgets, categories, yearMonth)

  // Chart data
  const distribution = calculateDistributionByCategory(allExpenses, categories, yearMonth)
  const evolution = calculateEvolutionByDay(allExpenses, yearMonth)
  const comparison = calculateCategoryComparison(allExpenses, budgets, categories, yearMonth)

  const getCategory = (id: number) => categories.find(c => c.id === id)

  return (
    <div className={classes.root}>
      <header className={classes.headerRow}>
        <h1 className={classes.header}>{es.dashboard.pageTitle}</h1>
        <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />
      </header>

      {/* Indicadores Principales */}
      <div className={classes.kpiGrid}>
        <div className={classes.kpiCard}>
          <span className={classes.kpiLabel}>Total Gastado</span>
          <span className={classes.kpiValue}>{formatCOP(totalSpent)}</span>
        </div>
        <div className={classes.kpiCard}>
          <span className={classes.kpiLabel}>Movimientos</span>
          <span className={classes.kpiValue}>{movementCount}</span>
        </div>
        <div className={classes.kpiCard}>
          <span className={classes.kpiLabel}>Mayor Gasto</span>
          {topCategory ? (
            <div style={{ marginTop: '0.25rem' }}>
              <CategoryBadge category={topCategory.category} />
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>
                {formatCOP(topCategory.amount)}
              </div>
            </div>
          ) : (
            <span className={classes.kpiEmpty}>Ninguno</span>
          )}
        </div>
        <div className={classes.kpiCard}>
          <span className={classes.kpiLabel}>Presupuestos</span>
          {budgetSummary.status === 'none' ? (
            <span className={classes.kpiEmpty}>Sin definir</span>
          ) : (
            <div className={classes.budgetSummary}>
              <div className={classes.kpiValue} style={{ fontSize: '1.25rem' }}>{budgetSummary.percent}% consumido</div>
              <div className={classes.budgetWarnings}>
                {budgetSummary.warningCount > 0 && <span className={classes.badgeWarn}>{budgetSummary.warningCount} en advertencia</span>}
                {budgetSummary.exceededCount > 0 && <span className={classes.badgeErr}>{budgetSummary.exceededCount} excedido(s)</span>}
                {budgetSummary.warningCount === 0 && budgetSummary.exceededCount === 0 && <span className={classes.badgeOk}>Todo bien</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gráficas con Fallback */}
      <section className={classes.card}>
        <Suspense fallback={<div className={classes.loading}>Cargando gráficas...</div>}>
          <DashboardCharts distribution={distribution} evolution={evolution} comparison={comparison} />
        </Suspense>
      </section>

      {/* Últimos Movimientos */}
      <section className={classes.card}>
        <div className={classes.cardHeaderRow}>
          <h2 className={classes.cardTitle}>Últimos Movimientos</h2>
          <a href="#gastos" className={classes.viewAllLink}>Ver todos</a>
        </div>
        
        {recentExpenses.length > 0 ? (
          <ul className={classes.list}>
            {recentExpenses.map(exp => {
              const cat = getCategory(exp.categoryId)
              return (
                <li key={exp.id} className={classes.listItem}>
                  <div className={classes.itemLeft}>
                    {cat && <CategoryBadge category={cat} />}
                    <div className={classes.expenseDetails}>
                      <span className={classes.expenseDesc}>{exp.description}</span>
                      <span className={classes.expenseDate}>{exp.date}</span>
                    </div>
                  </div>
                  <span className={classes.itemAmount}>{formatCOP(exp.amount)}</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className={classes.emptyState}>No hay gastos recientes en este mes.</p>
        )}
      </section>

      {/* FAB para agregar gasto */}
      <button 
        className={classes.fab} 
        aria-label="Registrar gasto"
        onClick={onRegister}
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
