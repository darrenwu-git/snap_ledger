import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_CATEGORIES, LEGACY_CATEGORY_ID_MAP } from '../types';
import type { Transaction, Category, BackupData } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface LedgerContextType {
  transactions: Transaction[];
  categories: Category[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<string>;
  updateCategory: (id: string, category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  importData: (data: BackupData) => Promise<void>;
  getCategory: (id: string) => Category | undefined;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

// Helper to map DB row to Transaction
const mapFromDb = (row: any): Transaction => ({
  id: row.id,
  amount: Number(row.amount),
  type: row.type || 'expense',
  // Map legacy IDs to UUIDs if present
  categoryId: LEGACY_CATEGORY_ID_MAP[row.category] || row.category, 
  date: row.date,
  note: row.description,    // DB: description -> App: note
  status: row.status || 'completed',
  updatedAt: row.updated_at
});

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // UNIFIED CATEGORY STATE
  // We initialize with what we have (empty), then populate.
  // "categories" is now just the state, but we ensure defaults are seeded on fetch.

  // FETCH Data
  useEffect(() => {
    if (user) {
      // Cloud Mode
      const fetchData = async () => {
        // Fetch Transactions
        const { data: transData, error: transError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        
        if (transError) {
          console.error('Error fetching transactions:', transError);
        } else if (transData) {
          setTransactions(transData.map(mapFromDb));
        }

        // Fetch Categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*');


        if (catError) {
          console.warn('Error fetching categories (table might not exist yet):', catError);
        } else {
          // Check if we need to seed defaults
          // If no categories exist (or only some?), we should ensure defaults are present
          // For now: if DB is empty, seed defaults.
          // Better: Check if defaults are missing and add them?
          // Simplest migration: If catData is empty, we assume it's a fresh user (or migration needed).
          // BUT, we might have partial data.
          // Strategy: Load what's in DB.
          // If the DB has ZERO categories, we insert DEFAULT_CATEGORIES.

          let loadedCategories: Category[] = [];

          if (catData) {
            loadedCategories = catData.map((c: any) => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
              type: c.type,
              updatedAt: c.updated_at
            }));
          }

          // Check if we need to seed defaults (Merge Strategy)
          // We assume "Default Categories" should always exist for all users.
          // If they are missing (new user or deleted), we restore them.
          const existingIds = new Set(loadedCategories.map(c => c.id));
          const missingDefaults = DEFAULT_CATEGORIES.filter(d => !existingIds.has(d.id));

          if (missingDefaults.length > 0) {
            const defaultsToAdd = missingDefaults.map(d => ({
              ...d,
              updatedAt: new Date().toISOString()
            }));

            // Optimistically update local state
            loadedCategories = [...loadedCategories, ...defaultsToAdd];

            // Fire-and-forget sync to DB
            const payload = defaultsToAdd.map(c => ({
              id: c.id,
              user_id: user.id,
              name: c.name,
              icon: c.icon,
              type: c.type,
              updated_at: c.updatedAt
            }));

            const { error } = await supabase.from('categories').upsert(payload);
            if (error) console.error('Failed to seed default categories:', error);
          }

          setCategories(loadedCategories);
        }
      };
      
      fetchData();
    } else {
      // Local Mode
      const savedTrans = localStorage.getItem('snap_ledger_transactions');
      if (savedTrans) {
        try {
          const parsed = JSON.parse(savedTrans);
          const migrated = parsed.map((t: any) => ({
            ...t,
            // Migrate Category ID if needed
            categoryId: LEGACY_CATEGORY_ID_MAP[t.categoryId] || t.categoryId,
            status: t.status || 'completed'
          }));
          setTransactions(migrated);

          // Save migrated transactions back if there were changes (implied by just doing it)
          // To be safe/clean, we could check for changes, but writing back is cheap here.
          // Wait, if we write back, we should stringify.
          // Let's just do it to ensure consistency.
          const hasLegacyIds = parsed.some((t: any) => LEGACY_CATEGORY_ID_MAP[t.categoryId]);
          if (hasLegacyIds) {
            localStorage.setItem('snap_ledger_transactions', JSON.stringify(migrated));
          }
        } catch (e) {
          console.error("Failed to parse transactions", e);
          setTransactions([]);
        }
      } else {
          setTransactions([]);
      }

      const savedCats = localStorage.getItem('snap_ledger_categories');
      if (savedCats) {
        let parsed: any[] = [];

        try {
          const raw = JSON.parse(savedCats);
          if (Array.isArray(raw)) {
            parsed = raw;
          }
        } catch (e) {
          console.error("Failed to parse categories JSON", e);
        }

        if (parsed.length > 0) {
          // Filter out malformed entries to avoid crashes
          const validParsed = parsed.filter((c: any) => c && typeof c.id === 'string');

          // MIGRATION: Check if we need to merge defaults
          const existingIds = new Set(validParsed.map((c: any) => c.id));
          const missingDefaults = DEFAULT_CATEGORIES.filter(d => !existingIds.has(d.id));

          if (missingDefaults.length > 0) {
            const defaultsToAdd = missingDefaults.map(d => ({
              ...d,
              updatedAt: new Date().toISOString()
            }));
            const merged = [...validParsed, ...defaultsToAdd];
            setCategories(merged);
            localStorage.setItem('snap_ledger_categories', JSON.stringify(merged));
          } else {
            setCategories(validParsed);
          }
        } else {
          // If parsing failed or empty, fallback to defaults ONLY if essentially empty.
          // But if we had a parsing error on a non-empty string, ideally we wouldn't overwrite?
          // For now, if 'savedCats' exists but invalid, we might be risky.
          // But let's assume if it's invalid, it's unsalvageable or empty.
          setCategories([...DEFAULT_CATEGORIES]);
          if (!savedCats) { // Only write if it didn't exist or was truly empty? 
            localStorage.setItem('snap_ledger_categories', JSON.stringify(DEFAULT_CATEGORIES));
          }
        }
      } else {
        // First run or empty: Seed defaults
        setCategories([...DEFAULT_CATEGORIES]);
        localStorage.setItem('snap_ledger_categories', JSON.stringify(DEFAULT_CATEGORIES));
      }
    }
  }, [user]); // Re-run when user changes

  // ADD
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
      status: transaction.status || 'completed',
      updatedAt: new Date().toISOString()
    };

    // Optimistic Update
    const previousTransactions = [...transactions];
    setTransactions(prev => [newTransaction as Transaction, ...prev]);

    if (user) {
      // Prepare DB payload
      const payload = {
        id: newTransaction.id,
        user_id: user.id,
        amount: newTransaction.amount,
        type: newTransaction.type,
        category: newTransaction.categoryId, // Map categoryId -> category
        description: newTransaction.note,    // Map note -> description
        date: newTransaction.date,
        status: newTransaction.status,
        updated_at: newTransaction.updatedAt
      };

      const { error } = await supabase.from('transactions').insert(payload);

      if (error) {
        console.error('Error adding transaction to Supabase:', error);
        // Rollback
        setTransactions(previousTransactions);
        throw new Error(error.message || 'Failed to sync to cloud');
      }
    } else {
      // Local Save
      const updated = [newTransaction as Transaction, ...transactions];
      localStorage.setItem('snap_ledger_transactions', JSON.stringify(updated));
    }
  };

  // UPDATE
  const updateTransaction = async (id: string, updatedT: Omit<Transaction, 'id'>) => {
    // Optimistic Update
    const updatedWithTime = { ...updatedT, updatedAt: new Date().toISOString() };
    const previousTransactions = [...transactions];
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...updatedWithTime, id } : t)));

    if (user) {
      const payload = {
        amount: updatedT.amount,
        type: updatedT.type,
        category: updatedT.categoryId, // Map categoryId -> category
        description: updatedT.note,    // Map note -> description
        date: updatedT.date,
        status: updatedT.status,
        updated_at: updatedWithTime.updatedAt
      };

      const { error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating transaction in Supabase:', error);
        setTransactions(previousTransactions);
        throw new Error(error.message || 'Failed to update in cloud');
      }
    } else {
      const updatedList = transactions.map((t) => (t.id === id ? { ...updatedWithTime, id } : t));
      localStorage.setItem('snap_ledger_transactions', JSON.stringify(updatedList));
    }
  };

  // DELETE
  const deleteTransaction = async (id: string) => {
    // Optimistic Update
    const previousTransactions = [...transactions];
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (user) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction from Supabase:', error);
        setTransactions(previousTransactions);
        throw new Error(error.message || 'Failed to delete from cloud');
      }
    } else {
      const updatedList = transactions.filter((t) => t.id !== id);
      localStorage.setItem('snap_ledger_transactions', JSON.stringify(updatedList));
    }
  };

  // ADD CATEGORY
  const addCategory = async (category: Omit<Category, 'id'>): Promise<string> => {
    const newCategory = {
      ...category,
      id: crypto.randomUUID(), // Valid UUID for both local and Supabase (uuid type)
      updatedAt: new Date().toISOString()
    };

    const prevCategories = [...categories];
    setCategories(prev => [...prev, newCategory]);

    if (user) {
      const { error } = await supabase.from('categories').insert({
        id: newCategory.id,
        user_id: user.id,
        name: newCategory.name,
        icon: newCategory.icon,
        type: newCategory.type,
        updated_at: newCategory.updatedAt
      });

      if (error) {
        console.error('Error adding category to Supabase:', error);
        setCategories(prevCategories);
        throw new Error(error.message || 'Failed to save category');
      }
    } else {
      const updated = [...categories, newCategory];
      localStorage.setItem('snap_ledger_categories', JSON.stringify(updated));
    }

    return newCategory.id;
  };

  // UPDATE CATEGORY
  const updateCategory = async (id: string, category: Omit<Category, 'id'>) => {
    const updatedWithTime = { ...category, updatedAt: new Date().toISOString() };
    const prevCategories = [...categories];
    setCategories(prev => prev.map(c => c.id === id ? { ...updatedWithTime, id } : c));

    if (user) {
      const { error } = await supabase.from('categories').update({
        name: category.name,
        icon: category.icon,
        type: category.type,
        updated_at: updatedWithTime.updatedAt
      }).eq('id', id);

      if (error) {
        console.error('Error updating category:', error);
        setCategories(prevCategories);
        throw new Error(error.message || 'Failed to update category');
      }
    } else {
      const updated = categories.map(c => c.id === id ? { ...updatedWithTime, id } : c);
      localStorage.setItem('snap_ledger_categories', JSON.stringify(updated));
    }
  };

  // DELETE CATEGORY
  const deleteCategory = async (id: string) => {
    const prevCategories = [...categories];
    setCategories(prev => prev.filter(c => c.id !== id));

    if (user) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        console.error('Error deleting category:', error);
        setCategories(prevCategories);
        throw new Error(error.message);
      }
    } else {
      const updated = categories.filter(c => c.id !== id);
      localStorage.setItem('snap_ledger_categories', JSON.stringify(updated));
    }
  };

  // IMPORT DATA
  const importData = async (data: BackupData) => {
    try {
      // 1. Merge Categories (Last Modified Wins)
      const mergedCats = [...categories];
      const incomingCats = data.categories || [];
      const changedCats: Category[] = [];

      incomingCats.forEach(c => {
        const existingIdx = mergedCats.findIndex(ec => ec.id === c.id);
        if (existingIdx === -1) {
          mergedCats.push(c);
          changedCats.push(c);
        } else {
          // Last Modified Wins
          const existing = mergedCats[existingIdx];
          const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          const incomingTime = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;

          if (incomingTime > existingTime) {
            mergedCats[existingIdx] = c;
            changedCats.push(c);
          }
        }
      });

      // 2. Merge Transactions (Last Modified Wins)
      const mergedTx = [...transactions];
      const incomingTx = data.transactions || [];
      const changedTx: Transaction[] = [];

      // Auto-Create Missing Categories from Transactions
      const allCategoryIds = new Set([
        ...mergedCats.map(c => c.id)
      ]);

      incomingTx.forEach(t => {
        if (t.categoryId && !allCategoryIds.has(t.categoryId)) {
          const newId = t.categoryId;
          const newName = newId.charAt(0).toUpperCase() + newId.slice(1);
          const newCat: Category = {
            id: newId,
            name: newName,
            icon: '🏷️',
            type: t.type || 'expense',
            updatedAt: new Date().toISOString()
          };
          mergedCats.push(newCat);
          changedCats.push(newCat);
          allCategoryIds.add(newId);
        }
      });

      incomingTx.forEach(t => {
        const existingIdx = mergedTx.findIndex(et => et.id === t.id);
        if (existingIdx === -1) {
          mergedTx.push(t);
          changedTx.push(t);
        } else {
          const existing = mergedTx[existingIdx];
          const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          const incomingTime = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;

          if (incomingTime > existingTime) {
            mergedTx[existingIdx] = t;
            changedTx.push(t);
          }
        }
      });

      // Sort by date desc
      mergedTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // PERSISTENCE
      if (user) {
        // CLOUD SYNC
        // Upsert changed categories
        if (changedCats.length > 0) {
          const catPayload = changedCats.map(c => ({
            id: c.id,
            user_id: user.id,
            name: c.name,
            icon: c.icon,
            type: c.type,
            updated_at: c.updatedAt
          }));
          const { error: catError } = await supabase.from('categories').upsert(catPayload);
          if (catError) console.error('Import Category Error:', catError);
        }

        // Upsert changed transactions
        if (changedTx.length > 0) {
          const txPayload = changedTx.map(t => ({
            id: t.id,
            user_id: user.id,
            amount: t.amount,
            type: t.type,
            category: t.categoryId,      // map
            description: t.note,         // map
            date: t.date,
            status: t.status,
            updated_at: t.updatedAt
          }));
          const { error: txError } = await supabase.from('transactions').upsert(txPayload);
          if (txError) console.error('Import Transaction Error:', txError);
        }

        // Update local state to reflect merge immediately
        setCategories(mergedCats);
        setTransactions(mergedTx);

      } else {
        // LOCAL SYNC
        setCategories(mergedCats);
        localStorage.setItem('snap_ledger_categories', JSON.stringify(mergedCats));

        setTransactions(mergedTx);
        localStorage.setItem('snap_ledger_transactions', JSON.stringify(mergedTx));
      }

    } catch (e) {
      console.error("Import failed", e);
      throw new Error("Failed to process backup data.");
    }
  };

  const getCategory = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  return (
    <LedgerContext.Provider value={{ transactions, categories, addTransaction, updateTransaction, deleteTransaction, getCategory, addCategory, updateCategory, deleteCategory, importData }}>
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (context === undefined) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
};
