import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { CategoryBadge } from '../components/ui/CategoryBadge'
import { formatCOP } from '../utils/currency'
import { monthRange, todayLocal, yearMonthOf } from '../utils/dates'
import { es } from '../i18n/es'
import { calculateBudgetProgress, calculateTopCategories, calculateTotalExpenses } from '../services/statisticsService'
import classes from './Dashboard.module.css'

export function DashboardPage() {
  const today = todayLocal()
  const yearMonth = yearMonthOf(today)
  const { from, to } = monthRange(yearMonth)

  const data = useLiveQuery(async () => {
    const expenses = await db.expenses
      .where('date')
      .between(from, to, true, true)
      .toArray()
    
    const categories = await db.categories.toArray()
    const budgets = await db.budgets.where('yearMonth').equals(yearMonth).toArray()

    return { expenses, categories, budgets }
  }, [from, to, yearMonth])

  if (!data) return null // Initial load

  const { expenses, categories, budgets } = data

  const totalSpent = calculateTotalExpenses(expenses, yearMonth)
  const topCategories = calculateTopCategories(expenses, categories, yearMonth, 5)
  const budgetProgress = calculateBudgetProgress(expenses, budgets, categories, yearMonth)

  return (
    <div className={classes.root}>
      <h1 className={classes.header}>{es.dashboard.pageTitle}</h1>

      <section className={classes.card}>
        <h2 className={classes.cardTitle}>{es.dashboard.totalSpentThisMonth}</h2>
        <p className={classes.totalAmount}>{formatCOP(totalSpent)}</p>
      </section>

      <section className={classes.card}>
        <h2 className={classes.cardTitle}>{es.dashboard.topCategories}</h2>
        {topCategories.length > 0 ? (
          <ul className={classes.list}>
            {topCategories.map(({ category, amount }) => (
              <li key={category!.id} className={classes.listItem}>
                <div className={classes.itemLeft}>
                  <CategoryBadge category={category!} />
                </div>
                <span className={classes.itemAmount}>{formatCOP(amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={classes.emptyState}>{es.dashboard.noExpenses}</p>
        )}
      </section>

      <section className={classes.card}>
        <h2 className={classes.cardTitle}>{es.dashboard.budgetStatus}</h2>
        {budgetProgress.length > 0 ? (
          <div className={classes.list}>
            {budgetProgress.map(({ category, spent, limit, percent, status }) => (
              <div key={category!.id} className={classes.budgetRow}>
                <div className={classes.budgetHeader}>
                  <div className={classes.itemLeft}>
                    <CategoryBadge category={category!} />
                  </div>
                  <span className={classes.budgetAmounts}>
                    {es.dashboard.spentOf(formatCOP(spent), formatCOP(limit))}
                  </span>
                </div>
                <div className={classes.budgetBarBg}>
                  <div 
                    className={classes.budgetBarFill} 
                    style={{ width: `${percent}%` }}
                    data-status={status}
                  />
                </div>
                <div className={classes.budgetStats}>
                  <span>{percent}%</span>
                  {status === 'exceeded' && <span>¡Excedido!</span>}
                  {status === 'warning' && <span>¡Cerca del límite!</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={classes.emptyState}>{es.dashboard.noBudgets}</p>
        )}
      </section>
    </div>
  )
}
