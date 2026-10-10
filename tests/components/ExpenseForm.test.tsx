import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi, beforeEach } from 'vitest'
import { ExpenseForm } from '../../src/components/expenses/ExpenseForm'
import { db } from '../../src/db/database'
import type { Category } from '../../src/types'
import { todayLocal } from '../../src/utils/dates'

const mockCategories: Category[] = [
  { id: 1, name: 'Comida', icon: '🍔', color: '#ff0000', active: true },
  { id: 2, name: 'Transporte', icon: '🚗', color: '#00ff00', active: true },
  { id: 3, name: 'Inactiva', icon: '🚫', color: '#000000', active: false },
]

beforeEach(async () => {
  await db.categories.bulkAdd(mockCategories)
})

it('renders empty form for new expense', () => {
  render(<ExpenseForm categories={mockCategories} onCancel={vi.fn()} onSaved={vi.fn()} amountRef={{ current: null }} />)
  
  expect(screen.getByLabelText(/Importe/i)).toHaveValue('')
  expect(screen.getByLabelText(/Descripción/i)).toHaveValue('')
  expect(screen.getByLabelText(/Fecha/i)).toHaveValue(todayLocal())
})

it('validates required fields on submit', async () => {
  const user = userEvent.setup()
  render(<ExpenseForm categories={mockCategories} onCancel={vi.fn()} onSaved={vi.fn()} amountRef={{ current: null }} />)
  
  await user.click(screen.getByRole('button', { name: /Registrar gasto/i }))
  
  expect(await screen.findByText('Ingresa el importe.')).toBeInTheDocument()
  expect(await screen.findByText('La descripción no puede estar vacía.')).toBeInTheDocument()
  // Date is populated by default, Category might require selection
  expect(await screen.findByText('Selecciona una categoría.')).toBeInTheDocument()
})

it('submits a valid expense', async () => {
  const user = userEvent.setup()
  const handleSaved = vi.fn()
  
  render(<ExpenseForm categories={mockCategories} onCancel={vi.fn()} onSaved={handleSaved} amountRef={{ current: null }} />)
  
  await user.type(screen.getByLabelText(/Importe/i), '15000')
  await user.type(screen.getByLabelText(/Descripción/i), 'Almuerzo')
  await user.selectOptions(screen.getByLabelText(/Categoría/i), '1')
  await user.click(screen.getByLabelText(/Tarjeta/i))
  
  await user.click(screen.getByRole('button', { name: /Registrar gasto/i }))
  
  await waitFor(() => {
    expect(handleSaved).toHaveBeenCalledWith('created')
  })
})


