import { useEffect, useState, type ReactNode } from 'react'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth, googleAuthProvider } from '../services/firebase'
import { initUserSync, stopUserSync } from '../services/syncService'
import { AuthContext } from './authContextDef'

const isTestEnv = import.meta.env.MODE === 'test'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(
    isTestEnv
      ? ({ uid: 'test-user', email: 'test@mibolsillo.com', displayName: 'Usuario Test' } as User)
      : null
  )
  const [loading, setLoading] = useState(isTestEnv ? false : true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isTestEnv) return

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      if (currentUser) {
        void initUserSync(currentUser.uid)
      } else {
        stopUserSync()
      }
    })
    return () => {
      unsubscribe()
      stopUserSync()
    }
  }, [])

  const loginWithGoogle = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleAuthProvider)
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string }
      if (
        authError.code === 'auth/popup-closed-by-user' ||
        authError.code === 'auth/cancelled-popup-request'
      ) {
        // User voluntarily closed the popup, not a hard system error
        return
      }
      setError(
        authError.code === 'auth/unauthorized-domain'
          ? 'Este dominio no está autorizado en la consola de Firebase. Agrega tu dominio en Autenticación > Dominios autorizados.'
          : 'Ocurrió un error al iniciar sesión con Google. Intenta nuevamente.'
      )
      throw err
    }
  }

  const logout = async () => {
    setError(null)
    try {
      await signOut(auth)
    } catch (err: unknown) {
      setError('Ocurrió un error al cerrar sesión.')
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
