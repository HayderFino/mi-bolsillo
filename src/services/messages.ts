/** Centralized user-facing error messages (Spanish). */
export const MESSAGES = {
  amountInvalid: 'El importe debe ser un número entero mayor que 0.',
  descriptionRequired: 'La descripción no puede estar vacía.',
  dateInvalid: 'La fecha no es válida. Usa el formato AAAA-MM-DD.',
  dateRangeInvalid: 'La fecha inicial no puede ser posterior a la fecha final.',
  yearMonthInvalid: 'El mes no es válido. Usa el formato AAAA-MM.',
  searchInvalid: 'El texto de búsqueda no es válido.',
  paymentMethodInvalid: 'El método de pago no es válido.',
  expenseNotFound: 'El gasto no existe.',
  categoryNotFound: 'La categoría no existe.',
  categoryInactive: 'La categoría está desactivada.',
  categoryNameRequired: 'El nombre de la categoría no puede estar vacío.',
  categoryNameDuplicate: 'Ya existe una categoría con ese nombre.',
  categoryIconRequired: 'La categoría necesita un icono.',
  categoryColorInvalid: 'El color debe tener el formato #RRGGBB.',
  categoryActiveInvalid: 'El estado de la categoría no es válido.',
  categoryHasExpenses:
    'No se puede eliminar una categoría que tiene gastos. Desactívala en su lugar.',
  budgetLimitInvalid: 'El límite debe ser un número entero mayor que 0.',
  budgetNotFound: 'El presupuesto no existe.',
} as const
