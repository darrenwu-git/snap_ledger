export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO date string
  note?: string;
  status: 'completed' | 'draft';
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', icon: '🍔', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: '🚗', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', type: 'expense' },
  { id: 'entertainment', name: 'Fun', icon: '🎮', type: 'expense' },
  { id: 'bills', name: 'Bills', icon: '🧾', type: 'expense' },
  { id: 'health', name: 'Health', icon: '💊', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: '💰', type: 'income' },
  { id: 'bonus', name: 'Bonus', icon: '🎁', type: 'income' },
  { id: 'investment', name: 'Invest', icon: '📈', type: 'income' },
];

export interface BackupData {
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[]; // Custom categories only
}
