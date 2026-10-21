import { useState } from 'react'
import { Wallet, ShieldCheck, Cloud, Smartphone } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { APP_NAME } from '../../types'
import styles from './LoginView.module.css'

export function LoginView() {
  const { loginWithGoogle, error } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleLogin = async () => {
    setSubmitting(true)
    setLocalError(null)
    try {
      await loginWithGoogle()
    } catch (err: unknown) {
      const e = err as { message?: string }
      if (e?.message) {
        setLocalError(e.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const displayedError = error || localError

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brandIcon} aria-hidden="true">
          <Wallet size={34} />
        </div>

        <h1 className={styles.title}>{APP_NAME}</h1>
        <p className={styles.tagline}>
          Control inteligente y privado de tus gastos personales, sincronizado en la nube.
        </p>

        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleLogin}
          disabled={submitting}
          aria-label="Continuar con Google"
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {submitting ? 'Iniciando sesión...' : 'Continuar con Google'}
        </button>

        {displayedError && (
          <div className={styles.errorBanner} role="alert">
            {displayedError}
          </div>
        )}

        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <ShieldCheck className={styles.featureIcon} size={18} />
            <span>Autenticación oficial y segura con Google</span>
          </div>
          <div className={styles.featureItem}>
            <Cloud className={styles.featureIcon} size={18} />
            <span>Sincronización automática de tus finanzas en Firestore</span>
          </div>
          <div className={styles.featureItem}>
            <Smartphone className={styles.featureIcon} size={18} />
            <span>Acceso sin interrupciones desde tu teléfono o computador</span>
          </div>
        </div>

        <p className={styles.footerNote}>
          Tus datos financieros te pertenecen exclusivamente a ti.
        </p>
      </div>
    </div>
  )
}
