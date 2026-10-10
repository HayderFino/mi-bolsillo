import { APP_NAME } from '../types'

/** Centralized UI texts (Spanish). Every user-facing string lives here. */
export const es = {
  appName: APP_NAME,

  common: {
    cancel: 'Cancelar',
    close: 'Cerrar',
    retry: 'Reintentar',
    clearFilters: 'Limpiar filtros',
    unexpectedError: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    selectMonth: 'Seleccionar mes',
    prevMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
  },

  boot: {
    loading: 'Preparando tus datos…',
    errorTitle: 'No se pudo abrir el almacenamiento local',
    errorText: `${APP_NAME} guarda tus datos en este navegador (IndexedDB). Comprueba que el navegador permita el almacenamiento local y que no estés en una ventana privada.`,
  },

  nav: {
    ariaLabel: 'Navegación principal',
    skipToContent: 'Ir al contenido',
    dashboard: 'Panel',
    expenses: 'Gastos',
    budgets: 'Presupuestos',
    categories: 'Categorías',
    settings: 'Ajustes',
    registerExpense: 'Registrar gasto',
  },

  comingSoon: {
    title: 'Próximamente',
    text: 'Esta sección todavía no está disponible.',
  },

  notice: {
    dismiss: 'Cerrar aviso',
    created: 'Gasto registrado.',
    updated: 'Gasto actualizado.',
    deleted: 'Gasto eliminado.',
  },

  dashboard: {
    pageTitle: 'Panel principal',
    totalSpentThisMonth: 'Gastado este mes',
    topCategories: 'Top Categorías',
    budgetStatus: 'Presupuestos',
    noExpenses: 'Aún no hay gastos este mes.',
    noBudgets: 'No has definido presupuestos este mes.',
    spentOf: (spent: string, total: string) => `${spent} de ${total}`,
  },

  expenses: {
    pageTitle: 'Gastos',
    register: 'Registrar gasto',
    loading: 'Cargando gastos…',
    noCategory: 'Sin categoría',
    count: (n: number) => (n === 1 ? '1 gasto' : `${n} gastos`),
    total: 'Total',
    tableCaption: 'Historial de gastos',
    columns: {
      date: 'Fecha',
      description: 'Descripción',
      category: 'Categoría',
      method: 'Método',
      amount: 'Importe',
      actions: 'Acciones',
    },
    editLabel: (description: string) => `Editar gasto: ${description}`,
    deleteLabel: (description: string) => `Eliminar gasto: ${description}`,
    paymentMethods: {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
    },
    empty: {
      noneTitle: 'Aún no has registrado gastos',
      noneText: 'Registra tu primer gasto para empezar a ver cuánto gastas.',
      filteredTitle: 'Ningún gasto coincide con los filtros',
      filteredText: 'Prueba con otra búsqueda o limpia los filtros.',
    },
    confirmDelete: {
      title: '¿Eliminar este gasto?',
      text: (description: string, amount: string) =>
        `Se eliminará «${description}» por ${amount}. Esta acción no se puede deshacer.`,
      confirm: 'Eliminar',
    },
  },

  budgets: {
    pageTitle: 'Presupuestos',
    setBudget: 'Definir presupuesto',
    editBudget: 'Editar presupuesto',
    noCategoryAvailable: 'No hay categorías disponibles.',
    form: {
      limitAmount: 'Límite (COP)',
      submitCreate: 'Guardar',
      submitEdit: 'Actualizar',
      delete: 'Eliminar presupuesto',
    },
    confirmDelete: {
      title: '¿Eliminar presupuesto?',
      text: (categoryName: string) => `Se eliminará el límite de presupuesto para «${categoryName}» en este mes.`,
      confirm: 'Eliminar',
    },
    notSet: 'Sin presupuesto',
    status: {
      ok: 'Normal',
      warning: 'Advertencia',
      exceeded: 'Excedido',
    }
  },

  form: {
    createTitle: 'Registrar gasto',
    editTitle: 'Editar gasto',
    amount: 'Importe (COP)',
    description: 'Descripción',
    date: 'Fecha',
    category: 'Categoría',
    categoryPlaceholder: 'Selecciona una categoría',
    inactiveSuffix: ' (desactivada)',
    paymentMethod: 'Método de pago',
    submitCreate: 'Registrar gasto',
    submitEdit: 'Guardar cambios',
    saving: 'Guardando…',
    errors: {
      amountRequired: 'Ingresa el importe.',
      dateRequired: 'Ingresa una fecha válida.',
      categoryRequired: 'Selecciona una categoría.',
    },
  },

  filters: {
    search: 'Buscar por descripción',
    toggle: 'Filtros',
    period: 'Periodo',
    periods: {
      all: 'Todo el historial',
      month: 'Este mes',
      prevMonth: 'Mes anterior',
      custom: 'Rango personalizado',
    },
    from: 'Desde',
    to: 'Hasta',
    category: 'Categoría',
    allCategories: 'Todas las categorías',
    paymentMethod: 'Método de pago',
    allPaymentMethods: 'Todos los métodos',
  },
}
