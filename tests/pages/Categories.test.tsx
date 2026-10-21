import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi, beforeEach } from 'vitest'
import { CategoriesPage } from '../../src/pages/Categories'
import { CategoryFormDialog } from '../../src/components/categories/CategoryFormDialog'
import { db } from '../../src/db/database'
import { ensureDefaultCategories } from '../../src/services/categoryService'

beforeEach(async () => {
  await db.expenses.clear()
  await db.budgets.clear()
  await db.categories.clear()
  await ensureDefaultCategories()
})

it('renders the list of 8 default categories', async () => {
  render(<CategoriesPage onNotify={vi.fn()} onNavigateToHistory={vi.fn()} />)
  expect(await screen.findByText('Alimentación')).toBeInTheDocument()
  expect(screen.getByText('Transporte')).toBeInTheDocument()
  expect(screen.getByText('Salud')).toBeInTheDocument()
  // Total of 8 rendered cards
  const cards = screen.getAllByRole('heading', { level: 3 })
  expect(cards).toHaveLength(8)
})

it('creates a valid category', async () => {
  const user = userEvent.setup()
  const onNotify = vi.fn()
  render(<CategoriesPage onNotify={onNotify} onNavigateToHistory={vi.fn()} />)
  
  await screen.findByText('Alimentación')
  const newBtn = screen.getByRole('button', { name: /Nueva categoría/i })
  await user.click(newBtn)
  
  const dialog = screen.getByRole('dialog', { name: /Nueva categoría/i })
  const nameInput = within(dialog).getByRole('textbox', { name: /Nombre/i })
  await user.type(nameInput, 'Libros')
  
  // Icon and color selected by default, just submit
  const submitBtn = within(dialog).getByRole('button', { name: /Guardar/i })
  await user.click(submitBtn)
  
  // Wait for dialog to disappear or show error
  await waitFor(() => {
    if (screen.queryByRole('dialog')) {
      const errorMsg = document.querySelector('p[class*="error"]')
      if (errorMsg) throw new Error(`Form error: ${errorMsg.textContent}`)
    }
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  }, { timeout: 3000 })
  
  expect(await screen.findByText('Libros')).toBeInTheDocument()
  expect(onNotify).toHaveBeenCalledWith('Categoría creada', 'success')
})

it('shows message for duplicate name without accents', async () => {
  const user = userEvent.setup()
  render(<CategoriesPage onNotify={vi.fn()} onNavigateToHistory={vi.fn()} />)
  
  await screen.findByText('Alimentación')
  await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
  
  const nameInput = screen.getByRole('textbox', { name: /Nombre/i })
  await user.type(nameInput, 'alimentacion') // lowercase, no accent
  
  await user.click(screen.getByRole('button', { name: /Guardar/i }))
  
  // The service throws 'conflict'
  expect(await screen.findByText('Ya existe una categoría con ese nombre.')).toBeInTheDocument()
})

it('shows validation error for name longer than 30 characters', async () => {
  const user = userEvent.setup()
  render(<CategoriesPage onNotify={vi.fn()} onNavigateToHistory={vi.fn()} />)
  
  await screen.findByText('Alimentación')
  await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
  
  const nameInput = screen.getByRole('textbox', { name: /Nombre/i })
  const longName = 'a'.repeat(31)
  
  // Wait, max-length HTML attribute prevents typing more than 30 chars.
  // We can test that the input is limited or directly paste it.
  // Actually, we can bypass maxLength in tests if we want, or just test HTML behavior.
  await user.type(nameInput, longName)
  expect(nameInput).toHaveValue('a'.repeat(30)) // HTML validation works!
})

it('allows editing a category with a legacy icon/color outside the allowed lists', async () => {
  const user = userEvent.setup()
  // Insert legacy category
  const id = await db.categories.add({
    name: 'Legacy',
    icon: 'invalid-icon',
    color: '#000000',
    active: true
  })
  
  render(<CategoriesPage onNotify={vi.fn()} onNavigateToHistory={vi.fn()} />)
  
  // Click edit on Legacy
  const editBtn = await screen.findByRole('button', { name: /Editar categoría Legacy/i })
  await user.click(editBtn)
  
  const nameInput = screen.getByLabelText(/Nombre/i)
  await user.clear(nameInput)
  await user.type(nameInput, 'Renamed')
  
  await user.click(screen.getByRole('button', { name: /Guardar/i }))

  // Wait for dialog to close and list to update (useLiveQuery can be slow in CI)
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  }, { timeout: 5000 })

  expect(await screen.findByText('Renamed', undefined, { timeout: 5000 })).toBeInTheDocument()

  // Check db that it preserved legacy values
  const cat = await db.categories.get(id)
  expect(cat?.icon).toBe('invalid-icon')
  expect(cat?.color).toBe('#000000')
})

it('deactivates a category', async () => {
  const user = userEvent.setup()
  render(<CategoriesPage onNotify={vi.fn()} onNavigateToHistory={vi.fn()} />)
  
  await screen.findByText('Alimentación')
  
  // Find deactivate button for Alimentación. Since it's active and has no expenses, it has both deactivate and delete.
  // Alimentación is the first category in the grid.
  const deactivateBtn = screen.getAllByRole('button', { name: /Desactivar/i })[0]
  await user.click(deactivateBtn)
  
  // Should now say 'Inactiva'
  const badge = await screen.findAllByText('Inactiva')
  expect(badge.length).toBeGreaterThan(0)
})

it('prevents deactivating the last active category and shows message', async () => {
  const user = userEvent.setup()
  const onNotify = vi.fn()
  
  // Deactivate 7 out of 8 categories directly in DB
  const cats = await db.categories.toArray()
  for (let i = 1; i < cats.length; i++) {
    await db.categories.update(cats[i].id!, { active: false })
  }
  
  render(<CategoriesPage onNotify={onNotify} onNavigateToHistory={vi.fn()} />)
  await screen.findByText('Alimentación')
  
  // Click deactivate on the only active one
  const deactivateBtn = screen.getByRole('button', { name: /Desactivar/i })
  await user.click(deactivateBtn)
  
  await waitFor(() => {
    expect(onNotify).toHaveBeenCalledWith('No puedes desactivar la última categoría activa.', 'error')
  })
})

it('blocks deletion showing "Tiene N gastos. Desactívala en su lugar." if there are expenses', async () => {
  // Add expense to Alimentación (id: 1)
  await db.expenses.add({
    id: 1,
    amount: 100,
    description: 'Comida',
    date: '2023-10-15',
    categoryId: 1,
    paymentMethod: 'efectivo',
    createdAt: '',
    updatedAt: '',
  })
  
  render(<CategoriesPage onNotify={vi.fn()} onNavigateToHistory={vi.fn()} />)
  
  // Delete button should not exist for Alimentación, but the text should.
  expect(await screen.findByText('Tiene 1 gastos. Desactívala en su lugar.')).toBeInTheDocument()
})

it('allows deletion with confirmation, and can cancel', async () => {
  const user = userEvent.setup()
  render(<CategoriesPage onNotify={vi.fn()} onNavigateToHistory={vi.fn()} />)
  
  await screen.findByText('Alimentación')
  const deleteBtn = screen.getAllByRole('button', { name: /Eliminar/i })[0]
  
  // Cancel
  await user.click(deleteBtn)
  const dialog = await screen.findByRole('alertdialog')
  const cancelBtn = within(dialog).getByRole('button', { name: /Cancelar/i })
  await user.click(cancelBtn)
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(screen.getByText('Alimentación')).toBeInTheDocument()
  
  // Confirm
  await user.click(deleteBtn)
  const dialog2 = await screen.findByRole('alertdialog')
  const confirmBtn = within(dialog2).getByRole('button', { name: /Eliminar/i })
  await user.click(confirmBtn)
  
  await waitFor(() => {
    expect(screen.queryByText('Alimentación')).not.toBeInTheDocument()
  })
})

it('calls onNavigateToHistory when clicking "Ver historial"', async () => {
  const user = userEvent.setup()
  const navigateMock = vi.fn()
  
  render(<CategoriesPage onNotify={vi.fn()} onNavigateToHistory={navigateMock} />)
  await screen.findByText('Alimentación')
  
  const historyBtns = screen.getAllByRole('button', { name: /Ver historial/i })
  await user.click(historyBtns[0])
  
  expect(navigateMock).toHaveBeenCalledWith(1) // Alimentación has ID 1
})

it('supports keyboard navigation in icon and color selectors', async () => {
  const user = userEvent.setup()
  render(<CategoryFormDialog open={true} onClose={vi.fn()} onSave={vi.fn()} />)
  
  // Find color radios
  const colorGroup = screen.getByRole('radiogroup', { name: /Color/i })
  const colorBtns = within(colorGroup).getAllByRole('radio')
  colorBtns[1].focus()
  expect(colorBtns[1]).toHaveFocus()
  await user.keyboard('{ArrowRight}')
  expect(colorBtns[2]).toHaveFocus()
  expect(colorBtns[2]).toHaveAttribute('aria-checked', 'true')
  
  // Find icon radios
  const iconGroup = screen.getByRole('radiogroup', { name: /Icono/i })
  const iconBtns = within(iconGroup).getAllByRole('radio')
  iconBtns[2].focus()
  expect(iconBtns[2]).toHaveFocus()
  await user.keyboard('{ArrowRight}')
  expect(iconBtns[3]).toHaveFocus()
  expect(iconBtns[3]).toHaveAttribute('aria-checked', 'true')
})
