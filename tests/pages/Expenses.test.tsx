import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi, beforeEach } from 'vitest'
import { ExpenseFormDialog } from '../../src/components/expenses/ExpenseFormDialog'
import { ExpensesPage } from '../../src/pages/Expenses'
import { db } from '../../src/db/database'

beforeEach(async () => {
  await db.categories.add({ id: 1, name: 'Comida', icon: '🍔', color: '#ff0000', active: true })
  await db.categories.add({ id: 2, name: 'Transporte', icon: '🚗', color: '#00ff00', active: true })
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

it('renders expenses', async () => {
  render(<ExpensesPage onRegister={vi.fn()} onEdit={vi.fn()} onNotify={vi.fn()} />)
  expect(await screen.findByText('Café')).toBeInTheDocument()
})

it('filters by search text', async () => {
  const user = userEvent.setup()
  render(<ExpensesPage onRegister={vi.fn()} onEdit={vi.fn()} onNotify={vi.fn()} />)
  expect(await screen.findByText('Café')).toBeInTheDocument()
  
  await user.click(screen.getByRole('button', { name: /Filtros/i }))
  const searchInput = screen.getByRole('searchbox', { name: /Buscar por descripción/i })
  await user.type(searchInput, 'NO EXISTE')
  
  expect(await screen.findByText(/Ningún gasto coincide con los filtros/i)).toBeInTheDocument()
  
  await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }))
  expect(await screen.findByText('Café')).toBeInTheDocument()
})

it('filters by category and payment method', async () => {
  const user = userEvent.setup()
  render(<ExpensesPage onRegister={vi.fn()} onEdit={vi.fn()} onNotify={vi.fn()} />)
  expect(await screen.findByText('Café')).toBeInTheDocument()
  
  await user.click(screen.getByRole('button', { name: /Filtros/i }))
  
  const categorySelect = screen.getByLabelText(/Categoría/i, { selector: 'select' })
  await user.selectOptions(categorySelect, '2')
  
  expect(await screen.findByText(/Ningún gasto coincide con los filtros/i)).toBeInTheDocument()
  
  await user.selectOptions(categorySelect, '1')
  expect(await screen.findByText('Café')).toBeInTheDocument()

  const methodSelect = screen.getByLabelText(/Método de pago/i, { selector: 'select' })
  await user.selectOptions(methodSelect, 'tarjeta')
  expect(await screen.findByText(/Ningún gasto coincide con los filtros/i)).toBeInTheDocument()
})

it('shows "Filtrando por X" badge and allows clearing it', async () => {
  const user = userEvent.setup()
  
  render(<ExpensesPage onRegister={vi.fn()} onEdit={vi.fn()} onNotify={vi.fn()} initialCategoryId={1} />)
  
  const badgeBtn = await screen.findByRole('button', { name: /Filtrando por Comida ✕/i })
  expect(badgeBtn).toBeInTheDocument()
  expect(screen.getByText('Café')).toBeInTheDocument()
  
  // Clicking badge clears it
  await user.click(badgeBtn)
  expect(screen.queryByRole('button', { name: /Filtrando por Comida ✕/i })).not.toBeInTheDocument()
})

it('shows empty state for a category without expenses', async () => {
  // initialCategoryId = 2 (Transporte), which has no expenses
  render(<ExpensesPage onRegister={vi.fn()} onEdit={vi.fn()} onNotify={vi.fn()} initialCategoryId={2} />)
  
  expect(await screen.findByText(/Ningún gasto coincide con los filtros/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Limpiar filtros/i })).toBeInTheDocument()
})

it('edits an expense and reflects the change in the list', async () => {
  const user = userEvent.setup()
  
  function TestIntegration() {
    const [editing, setEditing] = React.useState<import('../../src/types').Expense | null>(null)
    return (
      <>
        <ExpensesPage onRegister={vi.fn()} onEdit={setEditing} onNotify={vi.fn()} />
        {editing && (
          <ExpenseFormDialog
            expense={editing}
            onClose={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        )}
      </>
    )
  }

  render(<TestIntegration />)
  
  expect(await screen.findByText('Café')).toBeInTheDocument()
  expect(screen.getAllByText('$ 5.000').length).toBeGreaterThan(0)
  
  const editBtn = screen.getByRole('button', { name: /Editar gasto: Café/i })
  await user.click(editBtn)
  
  const dialog = await screen.findByRole('dialog', { name: /Editar gasto/i })
  
  const descInput = within(dialog).getByLabelText(/Descripción/i)
  await user.clear(descInput)
  await user.type(descInput, 'Café Grande')
  
  const amountInput = within(dialog).getByLabelText(/Importe/i)
  await user.clear(amountInput)
  await user.type(amountInput, '6000')
  
  const saveBtn = within(dialog).getByRole('button', { name: /Guardar cambios/i })
  await user.click(saveBtn)
  
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  
  expect(await screen.findByText('Café Grande')).toBeInTheDocument()
  expect(screen.getAllByText('$ 6.000').length).toBeGreaterThan(0)
  expect(screen.queryByText('Café')).not.toBeInTheDocument()
})

it('cancels deletion when clicking cancel', async () => {
  const user = userEvent.setup()
  render(<ExpensesPage onRegister={vi.fn()} onEdit={vi.fn()} onNotify={vi.fn()} />)
  
  expect(await screen.findByText('Café')).toBeInTheDocument()
  const deleteBtn = screen.getByRole('button', { name: /Eliminar gasto: Café/i })
  await user.click(deleteBtn)
  
  const dialog = screen.getByRole('alertdialog', { name: /¿Eliminar este gasto\?/i })
  const cancelBtn = within(dialog).getByRole('button', { name: /Cancelar/i })
  await user.click(cancelBtn)
  
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(screen.getByText('Café')).toBeInTheDocument()
})

it('deletes an expense with confirmation', async () => {
  const user = userEvent.setup()
  const onNotify = vi.fn()
  render(<ExpensesPage onRegister={vi.fn()} onEdit={vi.fn()} onNotify={onNotify} />)
  
  expect(await screen.findByText('Café')).toBeInTheDocument()
  
  const deleteBtn = screen.getByRole('button', { name: /Eliminar gasto: Café/i })
  await user.click(deleteBtn)
  
  const dialog = screen.getByRole('alertdialog', { name: /¿Eliminar este gasto\?/i })
  const confirmBtn = within(dialog).getByRole('button', { name: /Eliminar/i })
  await user.click(confirmBtn)
  
  await waitFor(() => {
    expect(screen.queryByText('Café')).not.toBeInTheDocument()
  })
  expect(onNotify).toHaveBeenCalledWith({ kind: 'success', message: 'Gasto eliminado.' })
})
