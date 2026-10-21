import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// Firebase configuration provided for "finanzas-77a26"
const firebaseConfig = {
  apiKey: "AIzaSyDDZM_rQBbM9WtZaykMqi_IftVG8kUU8Yk",
  authDomain: "finanzas-77a26.firebaseapp.com",
  projectId: "finanzas-77a26",
  storageBucket: "finanzas-77a26.firebasestorage.app",
  messagingSenderId: "62200769381",
  appId: "1:62200769381:web:a4dc0c352f218212458f8c",
  measurementId: "G-P2FWPEW4Q1"
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const googleAuthProvider = new GoogleAuthProvider()
googleAuthProvider.setCustomParameters({ prompt: 'select_account' })

export const firestore = initializeFirestore(firebaseApp, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})
