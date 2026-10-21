import { useRef, type ReactNode } from 'react'
import {
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Plus,
  Receipt,
  Settings,
  Tags,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { hrefFor, type Route } from '../../hooks/useHashRoute'
import { es } from '../../i18n/es'
import { NoticeHost, type Notice } from '../ui/NoticeHost'
import styles from './AppShell.module.css'

const NAV_ITEMS: { route: Route; label: string; icon: LucideIcon }[] = [
  { route: 'panel', label: es.nav.dashboard, icon: LayoutDashboard },
  { route: 'gastos', label: es.nav.expenses, icon: Receipt },
  { route: 'presupuestos', label: es.nav.budgets, icon: PiggyBank },
  { route: 'categorias', label: es.nav.categories, icon: Tags },
  { route: 'ajustes', label: es.nav.settings, icon: Settings },
]

interface AppShellProps {
  route: Route
  onRegisterExpense: () => void
  notice: Notice | null
  onDismissNotice: () => void
  children: ReactNode
}

/** Mobile: top bar + bottom navigation. Wide screens: sidebar. The "+" button is always available. */
export function AppShell({ route, onRegisterExpense, notice, onDismissNotice, children }: AppShellProps) {
  const mainRef = useRef<HTMLElement>(null)
  const { user, logout } = useAuth()

  return (
    <div className={styles.shell}>
      <button type="button" className={styles.skip} onClick={() => mainRef.current?.focus()}>
        {es.nav.skipToContent}
      </button>

      <header className={styles.brandBar}>
        <span className={styles.brand}>{es.appName}</span>
        {user && (
          <div className={styles.userSection}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className={styles.userAvatar} />
            ) : (
              <span className={styles.userInitials} aria-hidden="true">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </span>
            )}
            <span className={styles.userName} title={user.email ?? ''}>
              {user.displayName || user.email}
            </span>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={() => void logout()}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </header>

      <nav className={styles.nav} aria-label={es.nav.ariaLabel}>
        <ul className={styles.navList}>
          {NAV_ITEMS.map(({ route: itemRoute, label, icon: Icon }) => (
            <li key={itemRoute} className={styles.navItem}>
              <a
                href={hrefFor(itemRoute)}
                className={styles.link}
                aria-current={itemRoute === route ? 'page' : undefined}
              >
                <Icon aria-hidden="true" size={22} />
                <span>{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main ref={mainRef} className={styles.main} tabIndex={-1}>
        <div className={styles.content}>{children}</div>
      </main>

      <button type="button" className={styles.fab} onClick={onRegisterExpense}>
        <Plus aria-hidden="true" size={26} />
        <span className={styles.fabLabel}>{es.nav.registerExpense}</span>
      </button>

      <NoticeHost notice={notice} onDismiss={onDismissNotice} />
    </div>
  )
}
