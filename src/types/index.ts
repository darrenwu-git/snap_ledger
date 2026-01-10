export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO date string
  note?: string;
  status: 'completed' | 'draft';
  updatedAt?: string;
}

// Deterministic UUIDs for default categories to support Cloud Sync
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'a1e7e720-4e56-42f7-927c-9b788a8d1a1e', name: 'Food', icon: '🍔', type: 'expense' },
  { id: 'b2e7e720-4e56-42f7-927c-9b788a8d1b2e', name: 'Transport', icon: '🚗', type: 'expense' },
  { id: 'c3e7e720-4e56-42f7-927c-9b788a8d1c3e', name: 'Shopping', icon: '🛍️', type: 'expense' },
  { id: 'd4e7e720-4e56-42f7-927c-9b788a8d1d4e', name: 'Fun', icon: '🎮', type: 'expense' },
  { id: 'e5e7e720-4e56-42f7-927c-9b788a8d1e5e', name: 'Bills', icon: '🧾', type: 'expense' },
  { id: 'f6e7e720-4e56-42f7-927c-9b788a8d1f6e', name: 'Health', icon: '💊', type: 'expense' },
  { id: '10e7e720-4e56-42f7-927c-9b788a8d101e', name: 'Salary', icon: '💰', type: 'income' },
  { id: '20e7e720-4e56-42f7-927c-9b788a8d202e', name: 'Bonus', icon: '🎁', type: 'income' },
  { id: '30e7e720-4e56-42f7-927c-9b788a8d303e', name: 'Invest', icon: '📈', type: 'income' },
];

export const LEGACY_CATEGORY_ID_MAP: Record<string, string> = {
  'food': 'a1e7e720-4e56-42f7-927c-9b788a8d1a1e',
  'transport': 'b2e7e720-4e56-42f7-927c-9b788a8d1b2e',
  'shopping': 'c3e7e720-4e56-42f7-927c-9b788a8d1c3e',
  'entertainment': 'd4e7e720-4e56-42f7-927c-9b788a8d1d4e',
  'bills': 'e5e7e720-4e56-42f7-927c-9b788a8d1e5e',
  'health': 'f6e7e720-4e56-42f7-927c-9b788a8d1f6e',
  'salary': '10e7e720-4e56-42f7-927c-9b788a8d101e',
  'bonus': '20e7e720-4e56-42f7-927c-9b788a8d202e',
  'investment': '30e7e720-4e56-42f7-927c-9b788a8d303e',
};

export interface BackupData {
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[]; // Custom categories only
}
