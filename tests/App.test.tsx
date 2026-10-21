import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi, beforeEach } from 'vitest'
import App from '../src/App'
import { db } from '../src/db/database'

beforeEach(async () => {
  window.location.hash = '#/panel'
  window.dispatchEvent(new Event('hashchange'))
  await db.categories.clear()
  await db.expenses.clear()
  await db.budgets.clear()
  await db.categories.add({ id: 1, name: 'Comida', icon: 'utensils', color: '#B4493F', active: true })
})

vi.mock('../src/utils/dates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/utils/dates')>()
  return {
    ...actual,
    todayLocal: () => '2023-10-15',
  }
})

it('integration in jsdom: creates an expense from Dashboard FAB and updates total', async () => {
  const user = userEvent.setup()
  render(<App />)

  const fab = await screen.findByRole('button', { name: /registrar gasto/i })
  await user.click(fab)

  const dialog = await screen.findByRole('dialog')
  
  const amountInput = within(dialog).getByLabelText(/importe/i)
  const descInput = within(dialog).getByLabelText(/descripción/i)
  const catSelect = within(dialog).getByLabelText(/categoría/i)
  const saveBtn = within(dialog).getByRole('button', { name: /registrar gasto/i })

  await user.type(amountInput, '15000')
  await user.type(descInput, 'Pizza')
  await user.selectOptions(catSelect, '1')
  
  await user.click(saveBtn)

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  expect((await screen.findAllByText(/15\.000/))[0]).toBeInTheDocument()
})

it('integration in jsdom: Ver historial in Categories navigates to Expenses with filter', async () => {
  const user = userEvent.setup()
  
  await db.expenses.add({
    id: 10,
    amount: 5000,
    description: 'Café',
    date: '2023-10-05',
    categoryId: 1,
    paymentMethod: 'efectivo',
    createdAt: '',
    updatedAt: '',
  })
  
  window.location.hash = '#/categorias'
  window.dispatchEvent(new Event('hashchange'))
  render(<App />)
  
  // Wait for the category to be loaded
  await screen.findByText('Comida')
  
  const btns = await screen.findAllByRole('button')
  const historyBtn = btns.find(b => b.textContent?.includes('Ver historial'))
  if (!historyBtn) throw new Error('Not found')
  
  await user.click(historyBtn)
  
  // Should navigate to Gastos and show the badge
  const badgeBtn = await screen.findByRole('button', { name: /Filtrando por Comida ✕/i })
  expect(badgeBtn).toBeInTheDocument()
})

it('integration in jsdom: Settings route shows the backup panel', async () => {
  const user = userEvent.setup()
  window.location.hash = '#/panel'
  window.dispatchEvent(new Event('hashchange'))
  render(<App />)

  const nav = await screen.findByRole('navigation', { name: /navegación principal/i })
  await user.click(within(nav).getByRole('link', { name: /ajustes/i }))

  expect(await screen.findByRole('heading', { name: 'Ajustes', level: 1 })).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: /exportar copia/i })).toBeInTheDocument()
  expect(screen.getByText(/IndexedDB no es una copia de seguridad/i)).toBeInTheDocument()
})
