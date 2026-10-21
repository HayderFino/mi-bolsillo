import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { db } from '../../src/db/database'
import { seedDefaultCategories } from '../../src/db/seed'
import { SettingsPage } from '../../src/pages/Settings'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { collectBackup, serializeBackup } from '../../src/services/backupService'
import { MESSAGES } from '../../src/services/messages'
import type { Notice } from '../../src/components/ui/NoticeHost'

const onNotify = vi.fn()

function notifyOfCall(index: number): Notice {
  return onNotify.mock.calls[index][0] as Notice
}

beforeEach(async () => {
  onNotify.mockClear()
  await db.categories.clear()
  await db.expenses.clear()
  await db.budgets.clear()
  await db.meta.clear()
  await seedDefaultCategories()
  await db.expenses.add({
    id: 1,
    amount: 15000,
    description: 'Almuerzo',
    date: '2025-03-15',
    categoryId: 1,
    paymentMethod: 'efectivo',
    createdAt: '2025-03-15T12:00:00.000Z',
    updatedAt: '2025-03-15T12:00:00.000Z',
  })
})

it('shows the local-account summary, backup warning and privacy notices', async () => {
  render(
    <AuthProvider>
      <SettingsPage onNotify={onNotify} />
    </AuthProvider>,
  )

  expect(await screen.findByRole('heading', { name: 'Ajustes', level: 1 })).toBeInTheDocument()
  expect(await screen.findByText('1 gasto · 8 categorías · 0 presupuestos · 0 ingresos · 0 categorías de ingreso')).toBeInTheDocument()
  expect(screen.getByText(/exportar un archivo json periódicamente/i)).toBeInTheDocument()
  expect(screen.getByText(/no está cifrado automáticamente/i)).toBeInTheDocument()
  expect(screen.getByText(/tus datos se almacenan localmente/i)).toBeInTheDocument()
})

it('exports a JSON file and reports success', async () => {
  const user = userEvent.setup()
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:mock')
  const revokeObjectURL = vi.fn()
  // jsdom does not implement object URLs; the page only needs these two.
  URL.createObjectURL = createObjectURL
  URL.revokeObjectURL = revokeObjectURL
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

  render(
    <AuthProvider>
      <SettingsPage onNotify={onNotify} />
    </AuthProvider>,
  )
  await user.click(await screen.findByRole('button', { name: /exportar copia/i }))

  await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1))
  const blob = createObjectURL.mock.calls[0][0] as Blob
  expect(blob.type).toBe('application/json')
  expect(clickSpy).toHaveBeenCalledTimes(1)
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')

  expect(onNotify).toHaveBeenCalledTimes(1)
  expect(notifyOfCall(0)).toMatchObject({ kind: 'success', message: 'Copia de seguridad exportada.' })

  clickSpy.mockRestore()
  delete (URL as { createObjectURL?: unknown }).createObjectURL
  delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL
})

it('rejects a malformed file and leaves the data untouched', async () => {
  const user = userEvent.setup()
  render(
    <AuthProvider>
      <SettingsPage onNotify={onNotify} />
    </AuthProvider>,
  )

  const input = screen.getByLabelText(/elegir archivo/i)
  await user.upload(input, new File(['{esto no es json'], 'roto.json', { type: 'application/json' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.backupInvalidJson)
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(onNotify).not.toHaveBeenCalled()
  expect(await db.expenses.count()).toBe(1)
})

it('rejects a JSON file with an incompatible format version', async () => {
  const user = userEvent.setup()
  render(
    <AuthProvider>
      <SettingsPage onNotify={onNotify} />
    </AuthProvider>,
  )

  const incompatible = JSON.stringify({ app: 'mi-bolsillo', version: 99, exportedAt: 'x', data: { expenses: [], categories: [], budgets: [] } })
  await user.upload(screen.getByLabelText(/elegir archivo/i), new File([incompatible], 'futuro.json', { type: 'application/json' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.backupVersionIncompatible)
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
})

it('asks for confirmation before overwriting and keeps data when cancelled', async () => {
  const user = userEvent.setup()
  render(
    <AuthProvider>
      <SettingsPage onNotify={onNotify} />
    </AuthProvider>,
  )

  const backup = await collectBackup()
  await user.upload(
    screen.getByLabelText(/elegir archivo/i),
    new File([serializeBackup(backup)], 'copia.json', { type: 'application/json' }),
  )

  const dialog = await screen.findByRole('alertdialog', { name: /reemplazar todos los datos/i })
  expect(within(dialog).getByText(/copia\.json/)).toBeInTheDocument()

  await user.click(within(dialog).getByRole('button', { name: /cancelar/i }))
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(await db.expenses.count()).toBe(1)
  expect(await db.categories.count()).toBe(8)
  expect(onNotify).not.toHaveBeenCalled()
})

it('restores the backup on confirmation, replacing current data', async () => {
  const user = userEvent.setup()
  render(
    <AuthProvider>
      <SettingsPage onNotify={onNotify} />
    </AuthProvider>,
  )

  const backup = await collectBackup()

  await db.expenses.add({
    id: 2,
    amount: 9900,
    description: 'Posteriores al respaldo',
    date: '2025-04-01',
    categoryId: 1,
    paymentMethod: 'tarjeta',
    createdAt: '2025-04-01T10:00:00.000Z',
    updatedAt: '2025-04-01T10:00:00.000Z',
  })
  expect(await db.expenses.count()).toBe(2)

  await user.upload(
    screen.getByLabelText(/elegir archivo/i),
    new File([serializeBackup(backup)], 'copia.json', { type: 'application/json' }),
  )

  const dialog = await screen.findByRole('alertdialog', { name: /reemplazar todos los datos/i })
  await user.click(within(dialog).getByRole('button', { name: /restaurar copia/i }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  expect(await db.expenses.count()).toBe(1)
  expect(await db.categories.count()).toBe(8)
  expect(await db.expenses.get(2)).toBeUndefined()

  expect(onNotify).toHaveBeenCalledTimes(1)
  expect(notifyOfCall(0)).toMatchObject({
    kind: 'success',
    message: 'Copia restaurada: 1 gasto, 8 categorías, 0 presupuestos y 0 ingresos.',
  })
})
