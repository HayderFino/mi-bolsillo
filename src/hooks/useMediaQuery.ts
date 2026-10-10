import { useSyncExternalStore } from 'react'

/** Subscribes to a CSS media query. Without `matchMedia` (e.g. jsdom) it reports `false`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
  )
}

/** Breakpoint where the sidebar and the table layout replace the mobile layout. */
export const DESKTOP_QUERY = '(min-width: 900px)'
