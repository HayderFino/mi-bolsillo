import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { db } from '../../src/db/database'
import { IncomesPage } from '../../src/pages/Incomes'
import { createIncomeCategory } from '../../src/services/incomeCategoryService'

const onRegister = vi.fn()
const onEdit = vi.fn()
const onNotify = vi.fn()

let salaryId: number
let giftId: number

beforeEach(async () => {
  onRegister.mockClear()
  onEdit.mockClear()
  onNotify.mockClear()
  await db.incomes.clear()
  await db.incomeCategories.clear()

  const salary = await createIncomeCategory({ name: 'Salario', icon: 'briefcase', color: '#2F7D5B' })
  const gift = await createIncomeCategory({ name: 'Regalo', icon: 'gift', color: '#C27C2C' })
  salaryId = salary.id
  giftId = gift.id

  await db.incomes.add({
    id: 1,
    amount: 2500000,
    description: 'Salario de marzo',
    date: '2023-10-01',
    incomeCategoryId: salaryId,
    paymentMethod: 'transferencia',
    createdAt: '',
    updatedAt: '',
  })
  await db.incomes.add({
    id: 2,
    amount: 100000,
    description: 'Regalo cumpleaños',
    date: '2023-10-08',
    incomeCategoryId: giftId,
    paymentMethod: 'efectivo',
    createdAt: '',
    updatedAt: '',
  })
})

vi.mock('../../src/utils/dates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/dates')>()
  return { ...actual, todayLocal: () => '2023-10-15' }
})

it('lists incomes with the total of the visible records', async () => {
  render(<IncomesPage onRegister={onRegister} onEdit={onEdit} onNotify={onNotify} />)

  expect(await screen.findByText('Salario de marzo')).toBeInTheDocument()
  expect(screen.getByText('Regalo cumpleaños')).toBeInTheDocument()
  expect(screen.getByText(/2 ingresos/)).toBeInTheDocument()
  expect(screen.getByText(/\$ 2\.600\.000/)).toBeInTheDocument()
})

it('searches by description', async () => {
  const user = userEvent.setup()
  render(<IncomesPage onRegister={onRegister} onEdit={onEdit} onNotify={onNotify} />)
  await screen.findByText('Salario de marzo')

  await user.type(screen.getByLabelText(/buscar por descripción/i), 'regalo')

  await waitFor(() => expect(screen.queryByText('Salario de marzo')).not.toBeInTheDocument())
  expect(screen.getByText('Regalo cumpleaños')).toBeInTheDocument()
})

it('filters by income category', async () => {
  const user = userEvent.setup()
  render(<IncomesPage onRegister={onRegister} onEdit={onEdit} onNotify={onNotify} />)
  await screen.findByText('Salario de marzo')

  await user.selectOptions(screen.getByLabelText('Categoría'), String(giftId))

  await waitFor(() => expect(screen.queryByText('Salario de marzo')).not.toBeInTheDocument())
  expect(screen.getByText('Regalo cumpleaños')).toBeInTheDocument()
})

it('shows a filtered empty state and can clear the filters', async () => {
  const user = userEvent.setup()
  await db.incomes.clear()
  render(<IncomesPage onRegister={onRegister} onEdit={onEdit} onNotify={onNotify} />)

  await user.type(await screen.findByLabelText(/buscar por descripción/i), 'nada coincide')
  await waitFor(() =>
    expect(screen.getByText('Ningún ingreso coincide con los filtros')).toBeInTheDocument(),
  )

  await user.click(screen.getByRole('button', { name: /limpiar filtros/i }))
  await waitFor(() =>
    expect(screen.getByText('Aún no has registrado ingresos')).toBeInTheDocument(),
  )
})

it('asks for confirmation and deletes an income', async () => {
  const user = userEvent.setup()
  render(<IncomesPage onRegister={onRegister} onEdit={onEdit} onNotify={onNotify} />)
  await screen.findByText('Salario de marzo')

  await user.click(screen.getByRole('button', { name: /eliminar ingreso: regalo cumpleaños/i }))
  const dialog = await screen.findByRole('alertdialog', { name: /eliminar este ingreso/i })
  await user.click(within(dialog).getByRole('button', { name: /eliminar/i }))

  await waitFor(() => expect(screen.queryByText('Regalo cumpleaños')).not.toBeInTheDocument())
  expect(onNotify).toHaveBeenCalledWith({ kind: 'success', message: 'Ingreso eliminado.' })
  expect(await db.incomes.count()).toBe(1)
})

it('lets the user cancel the delete confirmation', async () => {
  const user = userEvent.setup()
  render(<IncomesPage onRegister={onRegister} onEdit={onEdit} onNotify={onNotify} />)
  await screen.findByText('Salario de marzo')

  await user.click(screen.getByRole('button', { name: /eliminar ingreso: salario de marzo/i }))
  const dialog = await screen.findByRole('alertdialog')
  await user.click(within(dialog).getByRole('button', { name: /cancelar/i }))

  expect(await db.incomes.count()).toBe(2)
  expect(onNotify).not.toHaveBeenCalled()
})

it('calls onEdit with the selected income', async () => {
  const user = userEvent.setup()
  render(<IncomesPage onRegister={onRegister} onEdit={onEdit} onNotify={onNotify} />)
  await screen.findByText('Salario de marzo')

  await user.click(screen.getByRole('button', { name: /editar ingreso: salario de marzo/i }))
  expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ description: 'Salario de marzo' }))
})

it('offers the register action from the empty state', async () => {
  const user = userEvent.setup()
  await db.incomes.clear()
  render(<IncomesPage onRegister={onRegister} onEdit={onEdit} onNotify={onNotify} />)

  const button = await screen.findByRole('button', { name: 'Registrar ingreso' })
  await user.click(button)
  expect(onRegister).toHaveBeenCalledTimes(1)
})
