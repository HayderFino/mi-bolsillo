import { render, screen, waitFor } from '@testing-library/react'
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

  // Verify warning status
  expect(await screen.findByText('Advertencia')).toBeInTheDocument()
  
  // Test month selector (prev month -> 2023-09)
  const prevMonthBtn = screen.getByRole('button', { name: /Mes anterior/i })
  await user.click(prevMonthBtn)

  // Wait for 2023-09 data to load (no budget set for 09)
  expect(await screen.findByText('Sin presupuesto')).toBeInTheDocument()
})
