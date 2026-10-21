import { type ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { LoginView } from './LoginView'
import { es } from '../../i18n/es'
import styles from './LoginView.module.css'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ minHeight: '160px', justifyContent: 'center' }}>
          <p role="status" style={{ color: '#64748b', fontSize: '0.9375rem', margin: 0 }}>
            {es.boot.loading}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginView />
  }

  return <>{children}</>
}
