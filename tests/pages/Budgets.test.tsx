import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi, beforeEach } from 'vitest'
import { BudgetsPage } from '../../src/pages/Budgets'
import { db } from '../../src/db/database'

beforeEach(async () => {
  await db.categories.add({ id: 1, name: 'Comida', icon: '🍔', color: '#ff0000', active: true })
  
  // Set budget for 2023-10
  await db.budgets.add({
    id: '1_2023-10',
    categoryId: 1,
    yearMonth: '2023-10',
    limitAmount: 10000
  })

  // Add expenses to reach warning state (80% of 10000 = 8000)
  await db.expenses.add({
    id: 10,
    amount: 8000,
    description: 'Restaurante',
    date: '2023-10-05',
    categoryId: 1,
    paymentMethod: 'efectivo',
    createdAt: '',
    updatedAt: '',
  })
})

vi.mock('../../src/utils/dates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/dates')>()
  return {
    ...actual,
    todayLocal: () => '2023-10-15',
  }
})

it('renders budgets page with warning state and month selector', async () => {
  const user = userEvent.setup()

  render(<BudgetsPage />)

  // Wait for data to load
  expect(await screen.findByText('Comida')).toBeInTheDocument()

  // Verify warning status and ARIA attributes
  const progressbar = await screen.findByRole('progressbar')
  expect(progressbar).toHaveAttribute('aria-valuenow', '8000')
  expect(progressbar).toHaveAttribute('aria-valuemin', '0')
  expect(progressbar).toHaveAttribute('aria-valuemax', '10000')
  expect(await screen.findByText('Advertencia')).toBeInTheDocument()
  
  // Test month selector (prev month -> 2023-09)
  const prevMonthBtn = screen.getByRole('button', { name: /Mes anterior/i })
  await user.click(prevMonthBtn)

  // Wait for 2023-09 data to load (no budget set for 09)
  expect(await screen.findByText('Sin presupuesto')).toBeInTheDocument()
})

it('asks for confirmation when deleting a budget and handles cancel/confirm', async () => {
  const user = userEvent.setup()
  render(<BudgetsPage />)
  
  expect(await screen.findByText('Comida')).toBeInTheDocument()
  
  // Open edit dialog
  const editBtn = screen.getByRole('button', { name: /Editar presupuesto/i })
  await user.click(editBtn)
  
  // Click delete
  const deleteBtn = await screen.findByRole('button', { name: /Eliminar presupuesto/i })
  await user.click(deleteBtn)
  
  // Dialog opens
  const dialog = screen.getByRole('alertdialog', { name: /¿Eliminar presupuesto\?/i })
  expect(dialog).toBeInTheDocument()
  
  // Cancel deletion
  const cancelBtn = within(dialog).getByRole('button', { name: /Cancelar/i })
  await user.click(cancelBtn)
  
  // Verify dialog is gone but budget still exists
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Eliminar presupuesto/i })).toBeInTheDocument()
  
  // Confirm deletion
  await user.click(screen.getByRole('button', { name: /Eliminar presupuesto/i }))
  const confirmDialog = screen.getByRole('alertdialog')
  const confirmBtn = within(confirmDialog).getByRole('button', { name: /Eliminar/i })
  await user.click(confirmBtn)
  
  // Verify budget is deleted (should say "Sin presupuesto" or "Definir presupuesto" button)
  expect(await screen.findByRole('button', { name: /Definir presupuesto/i })).toBeInTheDocument()
})

it('renders correctly when budget is exceeded and clamps aria-valuenow', async () => {
  // Add another expense to exceed the budget
  await db.expenses.add({
    id: 11,
    amount: 3000, // Total = 11000 > 10000
    description: 'Café',
    date: '2023-10-15',
    categoryId: 1,
    paymentMethod: 'efectivo',
    createdAt: '',
    updatedAt: '',
  })
  
  render(<BudgetsPage />)
  
  expect(await screen.findByText('Comida')).toBeInTheDocument()
  
  const progressbar = await screen.findByRole('progressbar')
  // ARIA should be clamped to max
  expect(progressbar).toHaveAttribute('aria-valuenow', '10000')
  expect(progressbar).toHaveAttribute('aria-valuemax', '10000')
  // The aria-valuetext should reflect the true status and spent amount
  expect(progressbar).toHaveAttribute('aria-valuetext', 'Excedido: $ 11.000 de $ 10.000')
  
  expect(await screen.findByText('Excedido')).toBeInTheDocument()
})

it('shows inactive categories if they have a budget in the selected month', async () => {
  const user = userEvent.setup()
  await db.categories.add({ id: 99, name: 'InactiveCat', icon: '👻', color: '#aaaaaa', active: false })
  await db.budgets.add({ id: '99_2023-10', categoryId: 99, yearMonth: '2023-10', limitAmount: 5000 })

  render(<BudgetsPage />)

  // Selected month is Oct 2023. InactiveCat has a budget, so it should be visible.
  expect(await screen.findByText('InactiveCat')).toBeInTheDocument()

  // Change to November 2023. InactiveCat has no budget in Nov, so it should NOT be visible.
  const nextMonthBtn = await screen.findByRole('button', { name: /Mes siguiente/i })
  await user.click(nextMonthBtn)

  // Wait for new month to load
  await screen.findByText('noviembre de 2023')
  
  // It shouldn't be visible in Nov
  await waitFor(() => {
    expect(screen.queryByText('InactiveCat')).not.toBeInTheDocument()
  })
})
