import { useEffect } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { es } from '../../i18n/es'
import styles from './NoticeHost.module.css'

export interface Notice {
  /** Changes on every new notice so the auto-dismiss timer restarts. */
  id: number
  kind: 'success' | 'error'
  message: string
}

const AUTO_DISMISS_MS = 6000

interface NoticeHostProps {
  notice: Notice | null
  onDismiss: () => void
}

/**
 * Live region for success/error messages. The region itself is always mounted so screen
 * readers announce messages added later.
 */
export function NoticeHost({ notice, onDismiss }: NoticeHostProps) {
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
    // The timer must restart only for a new notice, not when `onDismiss` changes identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice?.id])

  const Icon = notice?.kind === 'error' ? CircleAlert : CircleCheck
  return (
    <div className={styles.host} role={notice?.kind === 'error' ? 'alert' : 'status'}>
      {notice && (
        <div className={`${styles.notice} ${notice.kind === 'error' ? styles.error : styles.success}`}>
          <Icon aria-hidden="true" size={20} />
          <span className={styles.message}>{notice.message}</span>
          <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label={es.notice.dismiss}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
