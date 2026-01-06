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
  getCategory: (id: string) => Category | undefined;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES);

  // FETCH Transactions
  useEffect(() => {
    if (user) {
      // Cloud Mode
      const fetchTransactions = async () => {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          console.error('Error fetching transactions:', error);
        } else if (data) {
          setTransactions(data as Transaction[]);
        }
      };
      
      fetchTransactions();
    } else {
      // Local Mode
      const saved = localStorage.getItem('snap_ledger_transactions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
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
    setTransactions(prev => [newTransaction as Transaction, ...prev]);

    if (user) {
      const { error } = await supabase.from('transactions').insert({
        ...newTransaction,
        user_id: user.id
      });
      if (error) {
        console.error('Error adding transaction to Supabase:', error);
        // Rollback? For now just log.
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
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...updatedT, id } : t)));

    if (user) {
      const { error } = await supabase
        .from('transactions')
        .update({ ...updatedT })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating transaction in Supabase:', error);
      }
    } else {
      const updatedList = transactions.map((t) => (t.id === id ? { ...updatedT, id } : t));
      localStorage.setItem('snap_ledger_transactions', JSON.stringify(updatedList));
    }
  };

  // DELETE
  const deleteTransaction = async (id: string) => {
    // Optimistic Update
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (user) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction from Supabase:', error);
      }
    } else {
      const updatedList = transactions.filter((t) => t.id !== id);
      localStorage.setItem('snap_ledger_transactions', JSON.stringify(updatedList));
    }
  };

  const getCategory = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  return (
    <LedgerContext.Provider value={{ transactions, categories, addTransaction, updateTransaction, deleteTransaction, getCategory }}>
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
