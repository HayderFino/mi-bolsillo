// Must be the first import: installs the in-memory IndexedDB before Dexie is loaded.
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { db } from '../src/db/database'

// Every test starts with a brand-new, empty database.
beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterEach(() => {
  cleanup()
  window.location.hash = ''
})
