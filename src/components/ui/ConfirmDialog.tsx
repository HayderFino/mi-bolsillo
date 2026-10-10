import { useId, useRef, type ReactNode } from 'react'
import { es } from '../../i18n/es'
import { Button } from './Button'
import { Dialog } from './Dialog'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

/** Destructive confirmation. Focus starts on "Cancelar" so Enter never deletes by accident. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const textId = useId()
  return (
    <Dialog
      title={title}
      onClose={onCancel}
      role="alertdialog"
      initialFocusRef={cancelRef}
      describedBy={textId}
    >
      <p id={textId} className={styles.text}>
        {children}
      </p>
      <div className={styles.actions}>
        <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
          {es.common.cancel}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
