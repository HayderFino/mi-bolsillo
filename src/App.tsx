import { useCallback, useRef, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { DatabaseGate } from './components/layout/DatabaseGate'
import { ExpenseFormDialog } from './components/expenses/ExpenseFormDialog'
import type { Notice } from './components/ui/NoticeHost'
import { useHashRoute } from './hooks/useHashRoute'
import { es } from './i18n/es'
import { BudgetsPage } from './pages/Budgets'
import { ComingSoonPage } from './pages/ComingSoon'
import { DashboardPage } from './pages/Dashboard'
import { ExpensesPage } from './pages/Expenses'
import type { Expense } from './types'

/** `null` = closed; `{}` = registering a new expense; `{ expense }` = editing it. */
type ExpenseDialogState = { expense?: Expense } | null

function App() {
  const route = useHashRoute()
  const [expenseDialog, setExpenseDialog] = useState<ExpenseDialogState>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const nextNoticeId = useRef(0)

  const notify = useCallback((next: Omit<Notice, 'id'>) => {
    nextNoticeId.current += 1
    setNotice({ ...next, id: nextNoticeId.current })
  }, [])

  function handleSaved(kind: 'created' | 'updated') {
    setExpenseDialog(null)
    notify({ kind: 'success', message: kind === 'created' ? es.notice.created : es.notice.updated })
  }

  return (
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
          />
        )}
        {route === 'panel' && <DashboardPage />}
        {route === 'presupuestos' && <BudgetsPage />}
        {route === 'categorias' && <ComingSoonPage title={es.nav.categories} />}
        {route === 'ajustes' && <ComingSoonPage title={es.nav.settings} />}
      </AppShell>

      {expenseDialog && (
        <ExpenseFormDialog
          expense={expenseDialog.expense}
          onClose={() => setExpenseDialog(null)}
          onSaved={handleSaved}
        />
      )}
    </DatabaseGate>
  )
}

export default App
