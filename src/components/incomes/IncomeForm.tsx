import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { es } from '../../i18n/es'
import { MESSAGES } from '../../services/messages'
import { isPositiveInteger } from '../../services/validation'
import { createIncome, updateIncome } from '../../services/incomeService'
import { PAYMENT_METHODS, ServiceError, type Income, type IncomeCategory, type PaymentMethod } from '../../types'
import { formatAmountInput, parseAmountInput } from '../../utils/currency'
import { isValidDate, todayLocal } from '../../utils/dates'
import { Button } from '../ui/Button'
import { controlClassName } from '../ui/controlClassName'
import { Field } from '../ui/Field'
import styles from '../expenses/ExpenseForm.module.css'

type FieldName = 'amount' | 'description' | 'date' | 'category'
type FieldErrors = Partial<Record<FieldName, string>>

interface IncomeFormProps {
  /** When present the form edits this income; otherwise it creates a new one. */
  income?: Income
  categories: IncomeCategory[]
  /** Focused when the form opens (the dialog uses it as its initial focus). */
  amountRef: RefObject<HTMLInputElement | null>
  onSaved: (kind: 'created' | 'updated') => void
  onCancel: () => void
}

export function IncomeForm({ income, categories, amountRef, onSaved, onCancel }: IncomeFormProps) {
  const [amountText, setAmountText] = useState(income ? formatAmountInput(String(income.amount)) : '')
  const [description, setDescription] = useState(income?.description ?? '')
  const [date, setDate] = useState(income?.date ?? todayLocal())
  const [categoryId, setCategoryId] = useState(income ? String(income.incomeCategoryId) : '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(income?.paymentMethod ?? 'efectivo')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const descriptionRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)

  // New incomes need an active category; when editing, keep the current one even if deactivated.
  const selectableCategories = categories.filter((c) => c.active || c.id === income?.incomeCategoryId)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setFormError(null)

    const parsed = parseAmountInput(amountText)
    const nextErrors: FieldErrors = {}
    if (parsed.status === 'empty') nextErrors.amount = es.incomeForm.errors.amountRequired
    else if (parsed.status === 'invalid' || !isPositiveInteger(parsed.value)) {
      nextErrors.amount = MESSAGES.amountInvalid
    }
    if (description.trim() === '') nextErrors.description = MESSAGES.descriptionRequired
    if (!isValidDate(date)) nextErrors.date = es.incomeForm.errors.dateRequired
    if (categoryId === '') nextErrors.category = es.incomeForm.errors.categoryRequired
    setErrors(nextErrors)

    const firstInvalid = (
      [
        ['amount', amountRef],
        ['description', descriptionRef],
        ['date', dateRef],
        ['category', categoryRef],
      ] as const
    ).find(([name]) => nextErrors[name])
    if (firstInvalid || parsed.status !== 'ok') {
      firstInvalid?.[1].current?.focus()
      return
    }

    const data = {
      amount: parsed.value,
      description,
      date,
      incomeCategoryId: Number(categoryId),
      paymentMethod,
    }
    setSaving(true)
    try {
      if (income) await updateIncome(income.id, data)
      else await createIncome(data)
      onSaved(income ? 'updated' : 'created')
    } catch (error) {
      // Services are the source of truth: show their readable message.
      setFormError(error instanceof ServiceError ? error.message : es.common.unexpectedError)
      setSaving(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Field label={es.incomeForm.amount} error={errors.amount}>
        {(control) => (
          <div className={styles.amountWrap}>
            <span className={styles.prefix} aria-hidden="true">
              $
            </span>
            <input
              {...control}
              ref={amountRef}
              className={`${controlClassName} ${styles.amountInput}`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={amountText}
              onChange={(e) => setAmountText(formatAmountInput(e.target.value))}
            />
          </div>
        )}
      </Field>

      <Field label={es.incomeForm.description} error={errors.description}>
        {(control) => (
          <input
            {...control}
            ref={descriptionRef}
            className={controlClassName}
            type="text"
            maxLength={120}
            autoComplete="off"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </Field>

      <Field label={es.incomeForm.date} error={errors.date}>
        {(control) => (
          <input
            {...control}
            ref={dateRef}
            className={controlClassName}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        )}
      </Field>

      <Field label={es.incomeForm.category} error={errors.category}>
        {(control) => (
          <select
            {...control}
            ref={categoryRef}
            className={controlClassName}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">{es.incomeForm.categoryPlaceholder}</option>
            {selectableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.active ? '' : es.incomeForm.inactiveSuffix}
              </option>
            ))}
          </select>
        )}
      </Field>

      <fieldset className={styles.methods}>
        <legend className={styles.legend}>{es.incomeForm.paymentMethod}</legend>
        <div className={styles.segmented}>
          {PAYMENT_METHODS.map((method) => (
            <label key={method} className={styles.method}>
              <input
                className={styles.radio}
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
              />
              <span>{es.expenses.paymentMethods[method]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {formError && (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      )}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel}>
          {es.common.cancel}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? es.incomeForm.saving : income ? es.incomeForm.submitEdit : es.incomeForm.submitCreate}
        </Button>
      </div>
    </form>
  )
}
