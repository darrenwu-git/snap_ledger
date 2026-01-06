import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../types';
import type { Transaction, Category } from '../types';

interface LedgerContextType {
  transactions: Transaction[];
  categories: Category[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  getCategory: (id: string) => Category | undefined;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Initialize as empty, load in useEffect

  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES);

  // Load from LocalStorage and migrate old data
  useEffect(() => {
    const saved = localStorage.getItem('snap_ledger_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Ensure all transactions have a 'status' field, defaulting to 'completed'
        const migrated = parsed.map((t: any) => ({
          ...t,
          status: t.status || 'completed'
        }));
        setTransactions(migrated);
      } catch (e) {
        console.error("Failed to parse transactions from localStorage", e);
        // Optionally clear invalid data or set to default
        setTransactions([]);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('snap_ledger_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => { // Updated parameter type
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      status: transaction.status || 'completed' // Default status to 'completed' if not provided
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, updated: Omit<Transaction, 'id'>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...updated, id } : t)));
  };

  const deleteTransaction = (id: string) => {
    console.log("LedgerContext: Deleting transaction", id);
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      console.log("LedgerContext: Remaining transactions", next.length);
      return next;
    });
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
