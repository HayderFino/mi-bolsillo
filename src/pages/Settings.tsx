import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Database, Download, Lock } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import type { Notice } from '../components/ui/NoticeHost'
import { es } from '../i18n/es'
import {
  backupFileName,
  collectBackup,
  collectStats,
  parseBackup,
  restoreBackup,
  serializeBackup,
  type BackupFile,
} from '../services/backupService'
import { ServiceError } from '../types'
import styles from './Settings.module.css'

interface SettingsPageProps {
  onNotify: (notice: Omit<Notice, 'id'>) => void
}

interface PendingRestore {
  fileName: string
  backup: BackupFile
}

export function SettingsPage({ onNotify }: SettingsPageProps) {
  const stats = useLiveQuery(() => collectStats(), [], { expenses: 0, categories: 0, budgets: 0 })
  const [exporting, setExporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null)
  const [restoring, setRestoring] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const backup = await collectBackup()
      const blob = new Blob([serializeBackup(backup)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = backupFileName()
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      onNotify({ kind: 'success', message: es.settings.backup.exportSuccess })
    } catch {
      onNotify({ kind: 'error', message: es.common.unexpectedError })
    } finally {
      setExporting(false)
    }
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    // Reset so choosing the same file again still fires `change`.
    input.value = ''
    if (!file) return

    setImportError(null)
    try {
      const text = await file.text()
      const backup = parseBackup(text)
      setPendingRestore({ fileName: file.name, backup })
    } catch (error) {
      setImportError(error instanceof ServiceError ? error.message : es.common.unexpectedError)
    }
  }

  async function confirmRestore() {
    if (!pendingRestore) return
    setRestoring(true)
    try {
      const summary = await restoreBackup(pendingRestore.backup)
      onNotify({
        kind: 'success',
        message: es.settings.backup.importSuccess(
          summary.expenses,
          summary.categories,
          summary.budgets,
        ),
      })
      setPendingRestore(null)
    } catch (error) {
      onNotify({
        kind: 'error',
        message: error instanceof ServiceError ? error.message : es.common.unexpectedError,
      })
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{es.settings.pageTitle}</h1>
      </header>

      <section className={styles.card} aria-labelledby="settings-account-title">
        <h2 id="settings-account-title" className={styles.cardTitle}>
          <Database aria-hidden="true" size={20} />
          {es.settings.account.title}
        </h2>
        <p className={styles.text}>{es.settings.account.description}</p>
        <p className={styles.stats} aria-label={es.settings.account.statsLabel}>
          {es.settings.account.stats(stats.expenses, stats.categories, stats.budgets)}
        </p>
      </section>

      <section className={styles.card} aria-labelledby="settings-backup-title">
        <h2 id="settings-backup-title" className={styles.cardTitle}>
          <Download aria-hidden="true" size={20} />
          {es.settings.backup.title}
        </h2>
        <p className={styles.warning} role="note">
          {es.settings.backup.warning}
        </p>

        <div className={styles.block}>
          <h3 className={styles.blockTitle}>{es.settings.backup.exportTitle}</h3>
          <p className={styles.text}>{es.settings.backup.exportDescription}</p>
          <Button onClick={handleExport} disabled={exporting}>
            <Download aria-hidden="true" size={18} />
            {exporting ? es.settings.backup.exporting : es.settings.backup.exportButton}
          </Button>
        </div>

        <div className={styles.block}>
          <h3 className={styles.blockTitle}>{es.settings.backup.importTitle}</h3>
          <p className={styles.text}>{es.settings.backup.importDescription}</p>
          <div className={styles.fileRow}>
            <label htmlFor="backup-file" className={styles.fileLabel}>
              {es.settings.backup.importButton}
            </label>
            <input
              id="backup-file"
              type="file"
              accept=".json,application/json"
              className={styles.fileInput}
              onChange={handleFileSelected}
              aria-invalid={Boolean(importError)}
              aria-describedby={importError ? 'backup-file-error' : 'backup-file-hint'}
            />
          </div>
          {importError ? (
            <p id="backup-file-error" className={styles.error} role="alert">
              {importError}
            </p>
          ) : (
            <p id="backup-file-hint" className={styles.hint}>
              {es.settings.backup.importHint}
            </p>
          )}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="settings-privacy-title">
        <h2 id="settings-privacy-title" className={styles.cardTitle}>
          <Lock aria-hidden="true" size={20} />
          {es.settings.privacy.title}
        </h2>
        <p className={styles.text}>{es.settings.privacy.local}</p>
        <p className={styles.text}>{es.settings.privacy.encryption}</p>
      </section>

      {pendingRestore && (
        <ConfirmDialog
          title={es.settings.backup.confirmTitle}
          confirmLabel={es.settings.backup.confirmButton}
          onConfirm={confirmRestore}
          onCancel={() => setPendingRestore(null)}
          busy={restoring}
        >
          {es.settings.backup.confirmText(pendingRestore.fileName)}
        </ConfirmDialog>
      )}
    </div>
  )
}
