import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { es } from '../../i18n/es'
import styles from './Dialog.module.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface DialogProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** `alertdialog` for confirmations that interrupt the user. */
  role?: 'dialog' | 'alertdialog'
  /** Element to focus on open; defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>
  /** Id of an element inside the dialog that describes it (for `alertdialog`). */
  describedBy?: string
}

/**
 * Accessible modal: labelled, focus moves in and is trapped, Escape closes,
 * focus returns to the trigger on close, and page scroll is locked meanwhile.
 */
export function Dialog({
  title,
  onClose,
  children,
  role = 'dialog',
  initialFocusRef,
  describedBy,
}: DialogProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const target =
      initialFocusRef?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel
    target?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
    // Runs on mount/unmount only: focus must not jump on re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !panelRef.current) return

    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className={styles.overlay} onKeyDown={handleKeyDown}>
      <div
        ref={panelRef}
        className={styles.panel}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={es.common.close}>
            <X aria-hidden="true" size={22} />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  )
}
