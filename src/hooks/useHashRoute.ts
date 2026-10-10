import { useSyncExternalStore } from 'react'

export const ROUTES = ['panel', 'gastos', 'presupuestos', 'categorias', 'ajustes'] as const
export type Route = (typeof ROUTES)[number]

/** Until the dashboard exists (Phase 5), the app opens on the expenses page. */
export const DEFAULT_ROUTE: Route = 'gastos'

export function routeFromHash(hash: string): Route {
  const name = hash.replace(/^#\/?/, '')
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : DEFAULT_ROUTE
}

export function hrefFor(route: Route): string {
  return `#/${route}`
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/** Minimal hash router (no extra dependency, works on any static hosting). */
export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return routeFromHash(hash)
}
