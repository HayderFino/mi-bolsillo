import { useCallback, useRef, useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGate } from './components/auth/AuthGate'
import { AppShell } from './components/layout/AppShell'
import { DatabaseGate } from './components/layout/DatabaseGate'
import { ExpenseFormDialog } from './components/expenses/ExpenseFormDialog'
import { IncomeFormDialog } from './components/incomes/IncomeFormDialog'
import type { Notice } from './components/ui/NoticeHost'
import { useHashRoute } from './hooks/useHashRoute'
import { es } from './i18n/es'
import { BudgetsPage } from './pages/Budgets'
import { CategoriesPage } from './pages/Categories'
import { DashboardPage } from './pages/Dashboard'
import { ExpensesPage } from './pages/Expenses'
import { IncomesPage } from './pages/Incomes'
import { SettingsPage } from './pages/Settings'
import type { Expense, Income } from './types'

/** `null` = closed; `{}` = registering a new expense; `{ expense }` = editing it. */
type ExpenseDialogState = { expense?: Expense } | null

/** Same shape for incomes: `null` = closed; `{}` = new; `{ income }` = editing it. */
type IncomeDialogState = { income?: Income } | null

function App() {
  const route = useHashRoute()
  const [expenseDialog, setExpenseDialog] = useState<ExpenseDialogState>(null)
  const [incomeDialog, setIncomeDialog] = useState<IncomeDialogState>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [historyCategory, setHistoryCategory] = useState<number | null>(null)
  const nextNoticeId = useRef(0)

  const notify = useCallback((next: Omit<Notice, 'id'>) => {
    nextNoticeId.current += 1
    setNotice({ ...next, id: nextNoticeId.current })
  }, [])

  function handleSaved(kind: 'created' | 'updated') {
    setExpenseDialog(null)
    notify({ kind: 'success', message: kind === 'created' ? es.notice.created : es.notice.updated })
  }

  function handleIncomeSaved(kind: 'created' | 'updated') {
    setIncomeDialog(null)
    notify({
      kind: 'success',
      message: kind === 'created' ? es.notice.incomeCreated : es.notice.incomeUpdated,
    })
  }

  return (
    <AuthProvider>
      <AuthGate>
        <DatabaseGate>
          <AppShell
            route={route}
            onRegisterExpense={() => setExpenseDialog({})}
            notice={notice}
            onDismissNotice={() => setNotice(null)}
          >
            {route === 'gastos' && (
              <ExpensesPage
                onRegister={() => setExpenseDialog({})}
                onEdit={(expense) => setExpenseDialog({ expense })}
                onNotify={notify}
                initialCategoryId={historyCategory}
              />
            )}
            {route === 'ingresos' && (
              <IncomesPage
                onRegister={() => setIncomeDialog({})}
                onEdit={(income) => setIncomeDialog({ income })}
                onNotify={notify}
              />
            )}
            {route === 'panel' && <DashboardPage onRegister={() => setExpenseDialog({})} />}
            {route === 'presupuestos' && <BudgetsPage />}
            {route === 'categorias' && (
              <CategoriesPage
                onNotify={(message, type) => notify({ kind: type, message })}
                onNavigateToHistory={(categoryId) => {
                  setHistoryCategory(categoryId)
                  window.location.hash = '#gastos'
                }}
              />
            )}
            {route === 'ajustes' && <SettingsPage onNotify={notify} />}
          </AppShell>

          {expenseDialog && (
            <ExpenseFormDialog
              expense={expenseDialog.expense}
              onClose={() => setExpenseDialog(null)}
              onSaved={handleSaved}
            />
          )}

          {incomeDialog && (
            <IncomeFormDialog
              income={incomeDialog.income}
              onClose={() => setIncomeDialog(null)}
              onSaved={handleIncomeSaved}
            />
          )}
        </DatabaseGate>
      </AuthGate>
    </AuthProvider>
  )
}

export default App
