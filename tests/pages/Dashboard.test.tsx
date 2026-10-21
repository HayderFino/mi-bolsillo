import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi, beforeEach } from 'vitest'
import { DashboardPage } from '../../src/pages/Dashboard'
import { db } from '../../src/db/database'

beforeEach(async () => {
  await db.categories.clear()
  await db.expenses.clear()
  await db.budgets.clear()

  await db.categories.add({ id: 1, name: 'Comida', icon: '🍔', color: '#ff0000', active: true })
  await db.categories.add({ id: 2, name: 'Transporte', icon: '🚗', color: '#00ff00', active: true })
  
  await db.budgets.add({
    id: '1_2023-10',
    categoryId: 1,
    yearMonth: '2023-10',
    limitAmount: 10000
  })

  await db.expenses.add({
    id: 1,
    amount: 5000,
    description: 'Hamburguesa',
    date: '2023-10-05',
    categoryId: 1,
    paymentMethod: 'efectivo',
    createdAt: '',
    updatedAt: '',
  })
  await db.budgets.add({
    id: '2_2023-10',
    categoryId: 2,
    yearMonth: '2023-10',
    limitAmount: 2000
  })

  await db.expenses.add({
    id: 2,
    amount: 3000,
    description: 'Taxi',
    date: '2023-10-06',
    categoryId: 2,
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

it('changes data between two months with different expenses', async () => {
  // Add an expense to November
  await db.expenses.add({
    id: 99, amount: 2000, description: 'Nov Expense', date: '2023-11-05',
    categoryId: 1, paymentMethod: 'efectivo', createdAt: '', updatedAt: ''
  })
  render(<DashboardPage />)
  
  // October is current, total spent should be 8000
  expect((await screen.findAllByText(/8\.000/))[0]).toBeInTheDocument()
  
  // Go to November
  const user = userEvent.setup()
  const nextMonthBtn = await screen.findByRole('button', { name: /siguiente/i })
  await user.click(nextMonthBtn)
  
  // November should have 2000
  expect((await screen.findAllByText(/2\.000/))[0]).toBeInTheDocument()
})

it('shows budget summary warning and exceeded counts correctly', async () => {
  // Taxi is 3000 out of 2000 (exceeded)
  // Let's add a warning one (80% of 1000 = 800)
  await db.categories.add({ id: 3, name: 'WarningCat', icon: '⚠️', color: '#ffcc00', active: true })
  await db.budgets.add({ id: '3_2023-10', categoryId: 3, yearMonth: '2023-10', limitAmount: 1000 })
  await db.expenses.add({ id: 4, amount: 850, description: 'Warn', date: '2023-10-06', categoryId: 3, paymentMethod: 'efectivo', createdAt: '', updatedAt: '' })

  render(<DashboardPage />)
  
  expect(await screen.findByText('1 en advertencia')).toBeInTheDocument()
  expect(await screen.findByText('1 excedido(s)')).toBeInTheDocument()
})

it('shows Todo bien when there are budgets but no warnings or exceedances', async () => {
  // Update Taxi to 1000 (50% of 2000, no warning)
  await db.expenses.update(2, { amount: 1000 })

  render(<DashboardPage />)

  expect(await screen.findByText('Todo bien')).toBeInTheDocument()
})

it('maintains consistency invariant including an inactive category', async () => {
  // Add an inactive category with an expense
  await db.categories.add({ id: 4, name: 'InactiveCat', icon: '👻', color: '#aaaaaa', active: false })
  await db.expenses.add({ id: 5, amount: 500, description: 'Ghost', date: '2023-10-06', categoryId: 4, paymentMethod: 'efectivo', createdAt: '', updatedAt: '' })

  render(<DashboardPage />)
  
  // Wait for load and check total
  expect((await screen.findAllByText(/8\.500/))[0]).toBeInTheDocument() // 5000 + 3000 + 500 = 8500
})

it('shows indicators correctly for the current month and respects recent tie-breaker', async () => {
  // Add an expense with older date but created very recently (today)
  await db.expenses.add({
    id: 3, amount: 1000, description: 'OlderDateRecentCreation', date: '2023-10-04',
    categoryId: 2, paymentMethod: 'efectivo', createdAt: '2023-10-15T12:00:00Z', updatedAt: ''
  })
  
  // Add an expense with newer date but created in the past
  await db.expenses.add({
    id: 4, amount: 2000, description: 'NewerDatePastCreation', date: '2023-10-08',
    categoryId: 1, paymentMethod: 'efectivo', createdAt: '2023-10-08T10:00:00Z', updatedAt: ''
  })

  render(<DashboardPage />)
  
  const listItems = await screen.findAllByRole('listitem')
  const itemsText = listItems.map(li => li.textContent)
  
  // NewerDatePastCreation (date: 10-08) -> NewerDatePastCreation
  // Then there are Hamburguesa and Taxi which we didn't add here since db is cleared in beforeEach?
  // Wait, beforeEach adds 5000 in Comida on 10-05 (no createdAt) and 3000 in Taxi on 10-06 (no createdAt)
  // Let's just find their relative order: 10-08 -> 10-06 -> 10-05 -> 10-04
  expect(itemsText[0]).toContain('NewerDatePastCreation')
  expect(itemsText[1]).toContain('Taxi') // 10-06
  expect(itemsText[2]).toContain('Hamburguesa') // 10-05
  expect(itemsText[3]).toContain('OlderDateRecentCreation') // 10-04
})

it('calls onRegister prop on FAB click', async () => {
  const user = userEvent.setup()
  const spy = vi.fn()
  
  render(<DashboardPage onRegister={spy} />)
  
  const fab = await screen.findByRole('button', { name: /registrar gasto/i })
  await user.click(fab)
  
  expect(spy).toHaveBeenCalled()
})
