import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  type Unsubscribe
} from 'firebase/firestore'
import { firestore, auth } from './firebase'
import { db } from '../db/database'
import type { Expense, Category, Budget } from '../types'

let activeListeners: Unsubscribe[] = []

/**
 * Initializes two-way synchronization between Firestore and local Dexie for the given user.
 * 1. Checks if remote has data; if empty and local has data, pushes local data to cloud.
 * 2. If remote has data, updates local Dexie.
 * 3. Sets up real-time onSnapshot listeners for cross-tab / cross-device synchronization.
 */
export async function initUserSync(uid: string): Promise<() => void> {
  stopUserSync()

  try {
    const categoriesCol = collection(firestore, 'users', uid, 'categories')
    const budgetsCol = collection(firestore, 'users', uid, 'budgets')
    const expensesCol = collection(firestore, 'users', uid, 'expenses')

    const [remoteCategoriesSnap, remoteBudgetsSnap, remoteExpensesSnap] = await Promise.all([
      getDocs(categoriesCol),
      getDocs(budgetsCol),
      getDocs(expensesCol)
    ])

    const isRemoteEmpty =
      remoteCategoriesSnap.empty && remoteBudgetsSnap.empty && remoteExpensesSnap.empty

    if (isRemoteEmpty) {
      // First cloud login: push local Dexie database to Firestore
      const localCategories = await db.categories.toArray()
      const localBudgets = await db.budgets.toArray()
      const localExpenses = await db.expenses.toArray()

      if (localCategories.length > 0 || localBudgets.length > 0 || localExpenses.length > 0) {
        const batch = writeBatch(firestore)

        for (const cat of localCategories) {
          batch.set(doc(categoriesCol, String(cat.id)), cat)
        }
        for (const bgt of localBudgets) {
          batch.set(doc(budgetsCol, bgt.id), bgt)
        }
        for (const exp of localExpenses) {
          batch.set(doc(expensesCol, String(exp.id)), exp)
        }

        await batch.commit()
      }
    } else {
      // Remote has data: sync down to local Dexie
      if (!remoteCategoriesSnap.empty) {
        const cats = remoteCategoriesSnap.docs.map((d) => d.data() as Category)
        await db.categories.bulkPut(cats)
      }
      if (!remoteBudgetsSnap.empty) {
        const bgts = remoteBudgetsSnap.docs.map((d) => d.data() as Budget)
        await db.budgets.bulkPut(bgts)
      }
      if (!remoteExpensesSnap.empty) {
        const exps = remoteExpensesSnap.docs.map((d) => d.data() as Expense)
        await db.expenses.bulkPut(exps)
      }
    }

    // Set up real-time listener for categories
    const unsubCategories = onSnapshot(categoriesCol, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const cat = change.doc.data() as Category
        if (change.type === 'added' || change.type === 'modified') {
          await db.categories.put(cat)
        } else if (change.type === 'removed') {
          await db.categories.delete(Number(change.doc.id))
        }
      }
    })

    // Set up real-time listener for budgets
    const unsubBudgets = onSnapshot(budgetsCol, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const bgt = change.doc.data() as Budget
        if (change.type === 'added' || change.type === 'modified') {
          await db.budgets.put(bgt)
        } else if (change.type === 'removed') {
          await db.budgets.delete(change.doc.id)
        }
      }
    })

    // Set up real-time listener for expenses
    const unsubExpenses = onSnapshot(expensesCol, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const exp = change.doc.data() as Expense
        if (change.type === 'added' || change.type === 'modified') {
          await db.expenses.put(exp)
        } else if (change.type === 'removed') {
          await db.expenses.delete(Number(change.doc.id))
        }
      }
    })

    activeListeners = [unsubCategories, unsubBudgets, unsubExpenses]
  } catch (error) {
    console.error('Error during Firestore synchronization:', error)
  }

  return stopUserSync
}

export function stopUserSync() {
  for (const unsub of activeListeners) {
    unsub()
  }
  activeListeners = []
}

// Helpers to push individual mutation to cloud if user is signed in
export async function syncExpenseToCloud(expense: Expense) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await setDoc(doc(firestore, 'users', uid, 'expenses', String(expense.id)), expense)
  } catch (err) {
    console.warn('Could not sync expense to cloud:', err)
  }
}

export async function deleteExpenseFromCloud(id: number) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await deleteDoc(doc(firestore, 'users', uid, 'expenses', String(id)))
  } catch (err) {
    console.warn('Could not delete expense from cloud:', err)
  }
}

export async function syncCategoryToCloud(category: Category) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await setDoc(doc(firestore, 'users', uid, 'categories', String(category.id)), category)
  } catch (err) {
    console.warn('Could not sync category to cloud:', err)
  }
}

export async function deleteCategoryFromCloud(id: number) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await deleteDoc(doc(firestore, 'users', uid, 'categories', String(id)))
  } catch (err) {
    console.warn('Could not delete category from cloud:', err)
  }
}

export async function syncBudgetToCloud(budget: Budget) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await setDoc(doc(firestore, 'users', uid, 'budgets', budget.id), budget)
  } catch (err) {
    console.warn('Could not sync budget to cloud:', err)
  }
}

export async function deleteBudgetFromCloud(id: string) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await deleteDoc(doc(firestore, 'users', uid, 'budgets', id))
  } catch (err) {
    console.warn('Could not delete budget from cloud:', err)
  }
}
