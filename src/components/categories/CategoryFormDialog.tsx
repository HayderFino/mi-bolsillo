import { useState, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { FormEvent } from 'react'
import { Check } from 'lucide-react'
import type { Category, NewCategory } from '../../types'
import { ALLOWED_COLORS, ALLOWED_ICONS, getContrastColor, ICON_LABELS, COLOR_LABELS } from '../../constants/categoryAppearance'
import { CategoryIcon } from './CategoryIcon'
import { ServiceError } from '../../types'
import { Button } from '../ui/Button'
import styles from './CategoryFormDialog.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (category: NewCategory | Category) => Promise<void>
  category?: Category | null
}

export function CategoryFormDialog({ open, onClose, onSave, category }: Props) {
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState<string>(category?.icon ?? ALLOWED_ICONS[0])
  const [color, setColor] = useState<string>(category?.color ?? ALLOWED_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const iconRefs = useRef<(HTMLButtonElement | null)[]>([])
  const colorRefs = useRef<(HTMLButtonElement | null)[]>([])

  if (!open) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    try {
      setIsSubmitting(true)
      const data: NewCategory = { name: name.trim(), icon, color }
      if (category) {
        await onSave({ ...data, id: category.id, active: category.active })
      } else {
        await onSave(data)
      }
    } catch (err) {
      if (err instanceof ServiceError && (err.code === 'validation' || err.code === 'conflict')) {
        setError(err.message)
      } else {
        setError('Ocurrió un error inesperado al guardar la categoría.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    items: readonly string[],
    currentIndex: number,
    setter: (val: string) => void,
    refs: React.MutableRefObject<(HTMLButtonElement | null)[]>
  ) => {
    let nextIndex = currentIndex
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % items.length
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + items.length) % items.length
      e.preventDefault()
    }

    if (nextIndex !== currentIndex) {
      setter(items[nextIndex])
      refs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="dialog-title"
        aria-modal="true"
      >
        <div className="p-6 border-b border-gray-100 flex flex-col items-center bg-gray-50/50">
          <div
            className={styles.previewWrapper}
            style={{ backgroundColor: color, color: getContrastColor(color) }}
            aria-hidden="true"
          >
            <CategoryIcon iconName={icon} size={24} />
          </div>
          <h3 id="dialog-title" className="font-semibold text-gray-900 mt-3 text-lg">
            {name || (category ? 'Editar Categoría' : 'Nueva Categoría')}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg" role="alert">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="category-name" className="text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ej. Transporte"
              maxLength={30}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label id="icon-group-label" className="text-sm font-medium text-gray-700">
              Icono
            </label>
            <div 
              className={styles.selectorGroup} 
              role="radiogroup" 
              aria-labelledby="icon-group-label"
            >
              {ALLOWED_ICONS.map((i, idx) => {
                const isSelected = icon === i
                return (
                  <button
                    key={i}
                    ref={el => { iconRefs.current[idx] = el }}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setIcon(i)}
                    onKeyDown={(e) => handleKeyDown(e, ALLOWED_ICONS, idx, setIcon, iconRefs)}
                    className={styles.selectorButton}
                    title={ICON_LABELS[i] || i}
                    aria-label={ICON_LABELS[i] || i}
                  >
                    <CategoryIcon iconName={i} size={20} />
                    {isSelected && (
                      <div className={styles.srOnly}>Seleccionado</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label id="color-group-label" className="text-sm font-medium text-gray-700">
              Color
            </label>
            <div 
              className={styles.selectorGroup} 
              role="radiogroup" 
              aria-labelledby="color-group-label"
            >
              {ALLOWED_COLORS.map((c, idx) => {
                const isSelected = color === c
                return (
                  <button
                    key={c}
                    ref={el => { colorRefs.current[idx] = el }}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setColor(c)}
                    onKeyDown={(e) => handleKeyDown(e, ALLOWED_COLORS, idx, setColor, colorRefs)}
                    className={styles.colorButton}
                    style={{ backgroundColor: c }}
                    title={COLOR_LABELS[c] || c}
                    aria-label={COLOR_LABELS[c] || c}
                  >
                    {isSelected && <Check size={16} className={styles.checkIcon} />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
