import { useState } from 'react'
import { Edit2, Archive, ArchiveRestore, Trash2, Activity } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Category, NewCategory } from '../types'
import { listCategories, updateCategory, createCategory, deleteCategory, getCategoryExpenseCount } from '../services/categoryService'
import { CategoryIcon } from '../components/categories/CategoryIcon'
import { CategoryFormDialog } from '../components/categories/CategoryFormDialog'
import { getContrastColor } from '../constants/categoryAppearance'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import styles from './Categories.module.css'

interface CategoryWithState extends Category {
  expenseCount: number
}

interface CategoriesPageProps {
  onNotify: (message: string, kind: 'success' | 'error' | 'warning') => void
  onNavigateToHistory: (categoryId: number) => void
}

export function CategoriesPage({ onNotify, onNavigateToHistory }: CategoriesPageProps) {
  const categoriesWithCounts = useLiveQuery(async () => {
    const data = await listCategories({ includeInactive: true })
    return Promise.all(
      data.map(async (c) => {
        const count = await getCategoryExpenseCount(c.id)
        return { ...c, expenseCount: count }
      })
    )
  }, [])

  const categories = categoriesWithCounts ?? []
  const isLoading = categoriesWithCounts === undefined
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // Confirm dialog state
  const [pendingDelete, setPendingDelete] = useState<CategoryWithState | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async (categoryData: NewCategory | Category) => {
    if ('id' in categoryData) {
      await updateCategory(categoryData.id, categoryData)
      onNotify('Categoría actualizada', 'success')
    } else {
      await createCategory(categoryData)
      onNotify('Categoría creada', 'success')
    }
    setDialogOpen(false)
  }

  const handleToggleActive = async (category: CategoryWithState) => {
    try {
      await updateCategory(category.id, { active: !category.active })
      onNotify(category.active ? 'Categoría desactivada' : 'Categoría activada', 'success')
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Error al cambiar estado', 'error')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteCategory(pendingDelete.id)
      onNotify('Categoría eliminada', 'success')
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Error al eliminar la categoría', 'error')
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  if (isLoading && categories.length === 0) {
    return <div>Cargando...</div>
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Categorías</h1>
        <Button onClick={handleNew}>
          Nueva categoría
        </Button>
      </header>

      <div className={styles.grid}>
        {categories.map((category) => (
          <div key={category.id} className={styles.card} style={{ opacity: category.active ? 1 : 0.6 }}>
            <div className={styles.cardHeader}>
              <div className={styles.cardInfo}>
                <div
                  className={styles.iconWrapper}
                  style={{ backgroundColor: category.color, color: getContrastColor(category.color) }}
                >
                  <CategoryIcon iconName={category.icon} size={24} />
                </div>
                <div>
                  <h3 className={styles.categoryName}>{category.name}</h3>
                  <div className={styles.statusWrapper}>
                    {category.active ? (
                      <span className={`${styles.badge} ${styles.badgeActive}`}>Activa</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeInactive}`}>Inactiva</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleEdit(category)}
                className={styles.iconButton}
                title="Editar"
                aria-label={`Editar categoría ${category.name}`}
              >
                <Edit2 size={18} />
              </button>
            </div>

            <div className={styles.cardFooter}>
              <button
                onClick={() => onNavigateToHistory(category.id)}
                className={styles.historyButton}
              >
                <Activity size={16} />
                Ver historial
              </button>
              
              <div className={styles.footerActions}>
                {category.active ? (
                  <button
                    onClick={() => handleToggleActive(category)}
                    className={`${styles.actionButton} ${styles.deactivateButton}`}
                    title="Desactivar"
                  >
                    <Archive size={16} />
                    <span className={styles.srOnly}>Desactivar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleActive(category)}
                    className={`${styles.actionButton} ${styles.activateButton}`}
                    title="Activar"
                  >
                    <ArchiveRestore size={16} />
                    <span className={styles.srOnly}>Activar</span>
                  </button>
                )}
                
                {category.expenseCount > 0 ? (
                  <span className={styles.warningText}>
                    Tiene {category.expenseCount} gastos. Desactívala en su lugar.
                  </span>
                ) : (
                  <button
                    onClick={() => setPendingDelete(category)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    title="Eliminar"
                    aria-label={`Eliminar categoría ${category.name}`}
                  >
                    <Trash2 size={16} />
                    <span className={styles.srOnly}>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CategoryFormDialog
        key={editingCategory?.id ?? (dialogOpen ? 'new' : 'closed')}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        category={editingCategory}
      />

      {pendingDelete && (
        <ConfirmDialog
          title="¿Eliminar categoría?"
          confirmLabel="Eliminar"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
          busy={deleting}
        >
          ¿Estás seguro de que quieres eliminar la categoría "{pendingDelete.name}"? Esta acción no se puede deshacer.
        </ConfirmDialog>
      )}
    </div>
  )
}
