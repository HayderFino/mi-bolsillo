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

  settings: {
    pageTitle: 'Ajustes',
    account: {
      title: 'Cuenta y datos',
      description:
        'No hay cuentas ni servidores: todo se guarda solo en este navegador con el que estás usando ahora.',
      stats: (expenses: number, categories: number, budgets: number) =>
        `${expenses} ${expenses === 1 ? 'gasto' : 'gastos'} · ${categories} ${
          categories === 1 ? 'categoría' : 'categorías'
        } · ${budgets} ${budgets === 1 ? 'presupuesto' : 'presupuestos'}`,
      statsLabel: 'Datos guardados en este navegador',
    },
    backup: {
      title: 'Copia de seguridad',
      warning:
        'IndexedDB no es una copia de seguridad: si borras los datos del navegador o cambias de dispositivo, puedes perder todo. Exporta un archivo JSON periódicamente.',
      exportTitle: 'Exportar',
      exportDescription: 'Descarga un archivo JSON con tus gastos, categorías y presupuestos.',
      exportButton: 'Exportar copia (JSON)',
      exporting: 'Exportando…',
      exportSuccess: 'Copia de seguridad exportada.',
      importTitle: 'Importar',
      importDescription:
        'Restaura una copia exportada antes. Los datos actuales se reemplazarán por los del archivo.',
      importButton: 'Elegir archivo…',
      importHint: 'Archivo JSON exportado desde esta aplicación.',
      importSuccess: (expenses: number, categories: number, budgets: number) =>
        `Copia restaurada: ${expenses} ${expenses === 1 ? 'gasto' : 'gastos'}, ${categories} ${
          categories === 1 ? 'categoría' : 'categorías'
        } y ${budgets} ${budgets === 1 ? 'presupuesto' : 'presupuestos'}.`,
      confirmTitle: '¿Reemplazar todos los datos?',
      confirmText: (fileName: string) =>
        `Se eliminarán los datos actuales de este navegador y se cargarán los del archivo «${fileName}». Esta acción no se puede deshacer.`,
      confirmButton: 'Restaurar copia',
    },
    privacy: {
      title: 'Privacidad y almacenamiento',
      local: 'Tus datos no salen del navegador: no hay analítica ni peticiones externas con tu información.',
      encryption:
        'El almacenamiento local no está cifrado automáticamente; cualquier persona con acceso a tu perfil del navegador podría leerlo.',
    },
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
