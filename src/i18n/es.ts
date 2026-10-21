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
    incomes: 'Ingresos',
  },

  settings: {
    pageTitle: 'Ajustes',
    account: {
      title: 'Cuenta y sincronización',
      signedInAs: (name: string, email: string) => `Sesión iniciada como ${name} (${email})`,
      signOut: 'Cerrar sesión',
      signingOut: 'Cerrando sesión…',
      description:
        'Tus datos se guardan localmente en este navegador (IndexedDB) y se sincronizan automáticamente con tu cuenta de Google en Firebase.',
      stats: (expenses: number, categories: number, budgets: number, incomes: number, incomeCategories: number) =>
        `${expenses} ${expenses === 1 ? 'gasto' : 'gastos'} · ${
          categories === 1 ? '1 categoría' : `${categories} categorías`
        } · ${budgets} ${budgets === 1 ? 'presupuesto' : 'presupuestos'} · ${incomes} ${
          incomes === 1 ? 'ingreso' : 'ingresos'
        } · ${incomeCategories} ${
          incomeCategories === 1 ? 'categoría de ingreso' : 'categorías de ingreso'
        }`,
      statsLabel: 'Datos guardados localmente',
    },
    backup: {
      title: 'Copia de seguridad local',
      warning:
        'Aunque tus datos se sincronizan con Firebase, exportar un archivo JSON periódicamente es una buena práctica adicional de seguridad.',
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
      importSuccess: (expenses: number, categories: number, budgets: number, incomes: number) =>
        `Copia restaurada: ${expenses} ${expenses === 1 ? 'gasto' : 'gastos'}, ${
          categories === 1 ? '1 categoría' : `${categories} categorías`
        }, ${budgets} ${budgets === 1 ? 'presupuesto' : 'presupuestos'} y ${incomes} ${
          incomes === 1 ? 'ingreso' : 'ingresos'
        }.`,
      confirmTitle: '¿Reemplazar todos los datos?',
      confirmText: (fileName: string) =>
        `Se eliminarán los datos actuales de este navegador y se cargarán los del archivo «${fileName}». Esta acción no se puede deshacer.`,
      confirmButton: 'Restaurar copia',
    },
    privacy: {
      title: 'Privacidad y almacenamiento',
      local: 'Tus datos se almacenan localmente (IndexedDB) y en tu cuenta privada de Firebase. Solo tú tienes acceso a ellos.',
      encryption:
        'El almacenamiento local del navegador no está cifrado automáticamente. Asegúrate de proteger tu sesión de navegador.',
    },
  },

  notice: {
    dismiss: 'Cerrar aviso',
    created: 'Gasto registrado.',
    updated: 'Gasto actualizado.',
    deleted: 'Gasto eliminado.',
    incomeCreated: 'Ingreso registrado.',
    incomeUpdated: 'Ingreso actualizado.',
    incomeDeleted: 'Ingreso eliminado.',
  },

  dashboard: {
    pageTitle: 'Panel principal',
    totalSpentThisMonth: 'Gastado este mes',
    topCategories: 'Top Categorías',
    budgetStatus: 'Presupuestos',
    noExpenses: 'Aún no hay gastos este mes.',
    noBudgets: 'No has definido presupuestos este mes.',
    spentOf: (spent: string, total: string) => `${spent} de ${total}`,
    totalIncome: 'Ingresado este mes',
    balance: 'Balance',
    balancePositiveLabel: 'A favor',
    balanceNegativeLabel: 'En contra',
  },

  incomes: {
    pageTitle: 'Ingresos',
    register: 'Registrar ingreso',
    loading: 'Cargando ingresos…',
    noCategory: 'Sin categoría',
    categoryLabel: 'Categoría',
    count: (n: number) => (n === 1 ? '1 ingreso' : `${n} ingresos`),
    total: 'Total',
    tableCaption: 'Historial de ingresos',
    columns: {
      date: 'Fecha',
      description: 'Descripción',
      category: 'Categoría',
      method: 'Método',
      amount: 'Importe',
      actions: 'Acciones',
    },
    editLabel: (description: string) => `Editar ingreso: ${description}`,
    deleteLabel: (description: string) => `Eliminar ingreso: ${description}`,
    empty: {
      noneTitle: 'Aún no has registrado ingresos',
      noneText: 'Registra tu primer ingreso para llevar el balance del mes.',
      filteredTitle: 'Ningún ingreso coincide con los filtros',
      filteredText: 'Prueba con otra búsqueda o limpia los filtros.',
    },
    confirmDelete: {
      title: '¿Eliminar este ingreso?',
      text: (description: string, amount: string) =>
        `Se eliminará «${description}» por ${amount}. Esta acción no se puede deshacer.`,
      confirm: 'Eliminar',
    },
  },

  incomeForm: {
    createTitle: 'Registrar ingreso',
    editTitle: 'Editar ingreso',
    amount: 'Importe (COP)',
    description: 'Descripción',
    date: 'Fecha',
    category: 'Categoría',
    categoryPlaceholder: 'Selecciona una categoría',
    inactiveSuffix: ' (desactivada)',
    paymentMethod: 'Método de recepción',
    submitCreate: 'Registrar ingreso',
    submitEdit: 'Guardar cambios',
    saving: 'Guardando…',
    errors: {
      amountRequired: 'Ingresa el importe.',
      dateRequired: 'Ingresa una fecha válida.',
      categoryRequired: 'Selecciona una categoría.',
    },
  },

  incomeFilters: {
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
    paymentMethod: 'Método',
    allPaymentMethods: 'Todos los métodos',
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
