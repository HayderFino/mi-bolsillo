import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi, beforeEach } from 'vitest'
import { ExpensesPage } from '../../src/pages/Expenses'
import { db } from '../../src/db/database'

beforeEach(async () => {
  await db.categories.add({ id: 1, name: 'Comida', icon: '🍔', color: '#ff0000', active: true })
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
})

it('renders expenses, filters, and handles delete confirmation', async () => {
  const user = userEvent.setup()
  const onNotify = vi.fn()
  
  render(<ExpensesPage onRegister={vi.fn()} onEdit={vi.fn()} onNotify={onNotify} />)
  
  // Wait for data to load
  expect(await screen.findByText('Café')).toBeInTheDocument()
  
  // Test filters
  const toggleBtn = screen.getByRole('button', { name: /Filtros/i })
  await user.click(toggleBtn)
  
  const searchInput = screen.getByRole('searchbox', { name: /Buscar por descripción/i })
  await user.type(searchInput, 'NO EXISTE')
  
  expect(await screen.findByText(/Ningún gasto coincide con los filtros/i)).toBeInTheDocument()
  
  const clearBtn = screen.getByRole('button', { name: /Limpiar filtros/i })
  await user.click(clearBtn)
  
  expect(await screen.findByText('Café')).toBeInTheDocument()
  
  // Test delete with confirmation
  const deleteBtn = screen.getByRole('button', { name: /Eliminar gasto: Café/i })
  await user.click(deleteBtn)
  
  const dialog = screen.getByRole('alertdialog', { name: /¿Eliminar este gasto\?/i })
  expect(dialog).toBeInTheDocument()
  
  const confirmBtn = within(dialog).getByRole('button', { name: /Eliminar/i })
  await user.click(confirmBtn)
  
  await waitFor(() => {
    expect(screen.queryByText('Café')).not.toBeInTheDocument()
  })
  expect(onNotify).toHaveBeenCalledWith({ kind: 'success', message: 'Gasto eliminado.' })
})
