import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../types';
import type { Transaction, Category } from '../types';
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
  getCategory: (id: string) => Category | undefined;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

// Helper to map DB row to Transaction
const mapFromDb = (row: any): Transaction => ({
  id: row.id,
  amount: Number(row.amount),
  type: row.type || 'expense',
  categoryId: row.category, // DB: category -> App: categoryId
  date: row.date,
  note: row.description,    // DB: description -> App: note
  status: row.status || 'completed'
});

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  const categories = [...DEFAULT_CATEGORIES, ...customCategories];

  // FETCH Transactions
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
        } else if (catData) {
          setCustomCategories(catData.map((c: any) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            type: c.type
          })));
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
            status: t.status || 'completed'
          }));
          setTransactions(migrated);
        } catch (e) {
          console.error("Failed to parse transactions", e);
          setTransactions([]);
        }
      } else {
          setTransactions([]);
      }

      const savedCats = localStorage.getItem('snap_ledger_categories');
      if (savedCats) {
        try {
          setCustomCategories(JSON.parse(savedCats));
        } catch (e) {
          console.error("Failed to parse categories", e);
          setCustomCategories([]);
        }
      } else {
        setCustomCategories([]);
      }
    }
  }, [user]); // Re-run when user changes

  // ADD
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
      status: transaction.status || 'completed'
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
        status: newTransaction.status
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
    const previousTransactions = [...transactions];
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...updatedT, id } : t)));

    if (user) {
      const payload = {
        amount: updatedT.amount,
        type: updatedT.type,
        category: updatedT.categoryId, // Map categoryId -> category
        description: updatedT.note,    // Map note -> description
        date: updatedT.date,
        status: updatedT.status
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
      const updatedList = transactions.map((t) => (t.id === id ? { ...updatedT, id } : t));
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
      id: crypto.randomUUID() // Valid UUID for both local and Supabase (uuid type)
    };

    const prevCategories = [...customCategories];
    setCustomCategories(prev => [...prev, newCategory]);

    if (user) {
      const { error } = await supabase.from('categories').insert({
        id: newCategory.id,
        user_id: user.id,
        name: newCategory.name,
        icon: newCategory.icon,
        type: newCategory.type
      });

      if (error) {
        console.error('Error adding category to Supabase:', error);
        setCustomCategories(prevCategories);
        throw new Error(error.message || 'Failed to save category');
      }
    } else {
      const updated = [...customCategories, newCategory];
      localStorage.setItem('snap_ledger_categories', JSON.stringify(updated));
    }

    return newCategory.id;
  };

  // UPDATE CATEGORY
  const updateCategory = async (id: string, category: Omit<Category, 'id'>) => {
    const prevCategories = [...customCategories];
    setCustomCategories(prev => prev.map(c => c.id === id ? { ...category, id } : c));

    if (user) {
      const { error } = await supabase.from('categories').update({
        name: category.name,
        icon: category.icon,
        type: category.type
      }).eq('id', id);

      if (error) {
        console.error('Error updating category:', error);
        setCustomCategories(prevCategories);
        throw new Error(error.message || 'Failed to update category');
      }
    } else {
      const updated = customCategories.map(c => c.id === id ? { ...category, id } : c);
      localStorage.setItem('snap_ledger_categories', JSON.stringify(updated));
    }
  };

  // DELETE CATEGORY
  const deleteCategory = async (id: string) => {
    const prevCategories = [...customCategories];
    setCustomCategories(prev => prev.filter(c => c.id !== id));

    if (user) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        console.error('Error deleting category:', error);
        setCustomCategories(prevCategories);
        throw new Error(error.message);
      }
    } else {
      const updated = customCategories.filter(c => c.id !== id);
      localStorage.setItem('snap_ledger_categories', JSON.stringify(updated));
    }
  };

  const getCategory = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  return (
    <LedgerContext.Provider value={{ transactions, categories, addTransaction, updateTransaction, deleteTransaction, getCategory, addCategory, updateCategory, deleteCategory }}>
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
