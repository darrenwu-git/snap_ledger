// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { LedgerProvider, useLedger } from './LedgerContext';
import testBackup from '../../test_backup.json';
import { supabase } from '../lib/supabase';

// Mock Supabase
// We need to verify calls to supabase, so we'll store the mock functions
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockUpsert = vi.fn();

// Initial mock setup
const setupSupabaseMocks = () => {
  mockSelect.mockReturnValue({ data: [], error: null });
  mockInsert.mockReturnValue({ error: null });
  mockUpdate.mockReturnValue({ error: null });
  mockDelete.mockReturnValue({ error: null });
  mockUpsert.mockReturnValue({ error: null });

  // Chaining
  mockEq.mockReturnValue({
    data: [],
    error: null,
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete
  });
  mockOrder.mockReturnValue({ data: [], error: null });

  mockSelect.mockImplementation(() => ({
    data: [],
    error: null,
    order: mockOrder
  }));

  mockUpdate.mockImplementation(() => ({
    error: null,
    eq: mockEq
  }));

  mockDelete.mockImplementation(() => ({
    error: null,
    eq: mockEq
  }));
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      upsert: mockUpsert,
    })),
  },
}));

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('./AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock crypto
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'generated-uuid-' + Math.random().toString(36).substring(7)
  }
});

const ResultDisplay = ({ importPayload }: { importPayload?: any }) => {
  const { transactions, categories, importData, addTransaction, updateTransaction, deleteTransaction } = useLedger();

  return (
    <div>
      <div data-testid="tx-count">{transactions.length}</div>
      <div data-testid="cat-count">{categories.length}</div>
      <button
        data-testid="btn-import"
        onClick={() => importData(importPayload || testBackup).catch(e => console.error(e))}
      >
        Import
      </button>
      <button
        data-testid="btn-add"
        onClick={() => addTransaction({
          amount: 100,
          categoryId: 'food',
          date: '2026-01-01',
          note: 'Test Add',
          type: 'expense',
          status: 'completed'
        })}
      >
        Add
      </button>
      <ul>
        {transactions.map(t => (
          <li key={t.id} data-testid={`tx-${t.id}`}>
            {t.note} - {t.amount}
            <button data-testid={`btn-update-${t.id}`} onClick={() => updateTransaction(t.id, { ...t, amount: 999 })}>Update</button>
            <button data-testid={`btn-delete-${t.id}`} onClick={() => deleteTransaction(t.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <div data-testid="categories-list">
        {categories.map(c => c.id).join(',')}
      </div>
    </div>
  );
};

describe('LedgerContext Logic Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setupSupabaseMocks();
    mockUseAuth.mockReturnValue({ user: null }); // Default to Local Mode
  });

  afterEach(() => {
    cleanup();
  });

  describe('Local Mode', () => {
    it('Basic Import: loads data from file', async () => {
      render(
        <LedgerProvider>
          <ResultDisplay />
        </LedgerProvider>
      );

      // Initial check
      expect(screen.getByTestId('tx-count').textContent).toBe('0');

      // Import
      await act(async () => {
        screen.getByTestId('btn-import').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('tx-count').textContent).toBe('2');
      });
      expect(screen.getByText(/Agent Test: Coffee/)).toBeDefined();
    });

    it('Conflict Resolution (Last Modified Wins)', async () => {
      // Scenario 1: Local is NEWER -> Local Wins
      const localTxNewer = {
        id: 'tx-conflict-1',
        amount: 50,
        type: 'expense' as const,
        categoryId: 'food',
        date: '2026-01-01',
        note: 'Local Newer',
        status: 'completed' as const,
        updatedAt: '2026-01-02T12:00:00Z'
      };

      // Scenario 2: Incoming is NEWER -> Incoming Wins
      const localTxOlder = {
        id: 'tx-conflict-2',
        amount: 10,
        type: 'expense' as const,
        categoryId: 'food',
        date: '2026-01-01',
        note: 'Local Older',
        status: 'completed' as const,
        updatedAt: '2026-01-01T10:00:00Z'
      };

      localStorage.setItem('snap_ledger_transactions', JSON.stringify([localTxNewer, localTxOlder]));

      // Backup Data
      const backupPayload = {
        transactions: [
          {
            ...localTxNewer,
            amount: 100, // Old value
            note: 'Backup Older',
            updatedAt: '2026-01-01T10:00:00Z' // Older than local
          },
          {
            ...localTxOlder,
            amount: 500, // New value
            note: 'Backup Newer',
            updatedAt: '2026-01-02T12:00:00Z' // Newer than local
          }
        ],
        categories: []
      };

      render(
        <LedgerProvider>
          <ResultDisplay importPayload={backupPayload} />
        </LedgerProvider>
      );

      // Initial check
      await waitFor(() => {
        expect(screen.getByTestId('tx-count').textContent).toBe('2');
      });

      // Run Import
      await act(async () => {
        screen.getByTestId('btn-import').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('tx-count').textContent).toBe('2');
      });

      // Check Scenario 1: Local should win
      const tx1 = screen.getByTestId('tx-tx-conflict-1');
      expect(tx1.textContent).toContain('50');
      expect(tx1.textContent).toContain('Local Newer');

      // Check Scenario 2: Incoming should win
      const tx2 = screen.getByTestId('tx-tx-conflict-2');
      expect(tx2.textContent).toContain('500');
      expect(tx2.textContent).toContain('Backup Newer');
    });

    it('New Data Only: Merges new transactions while keeping local', async () => {
      // Setup Local
      localStorage.setItem('snap_ledger_transactions', JSON.stringify([{
        id: 'existing-1', amount: 50, categoryId: 'food', date: '2026-01-01', note: 'Existing', type: 'expense'
      }]));

      // Backup has Existing (old value) AND New
      const backupPayload = {
        transactions: [
          { id: 'existing-1', amount: 999, categoryId: 'food', date: '2026-01-01', note: 'Backup Old', type: 'expense' },
          { id: 'new-1', amount: 200, categoryId: 'food', date: '2026-01-02', note: 'New Item', type: 'expense' }
        ],
        categories: []
      };

      render(
        <LedgerProvider>
          <ResultDisplay importPayload={backupPayload} />
        </LedgerProvider>
      );

      await waitFor(() => expect(screen.getByTestId('tx-count').textContent).toBe('1'));

      await act(async () => {
        screen.getByTestId('btn-import').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('tx-count').textContent).toBe('2');
      });

      // Existing keeps local value
      expect(screen.getByTestId('tx-existing-1').textContent).toContain('50');
      // New is added
      expect(screen.getByTestId('tx-new-1').textContent).toContain('200');
    });

    it('Auto-Create Categories: Creates missing category from transaction', async () => {
      // Backup has a transaction using 'gym' category, which doesn't exist locally
      const backupPayload = {
        transactions: [
          { id: 'tx-gym', amount: 50, categoryId: 'gym', date: '2026-01-01', note: 'Gym Membership', type: 'expense' }
        ],
        categories: [] // Empty categories in backup
      };

      render(
        <LedgerProvider>
          <ResultDisplay importPayload={backupPayload} />
        </LedgerProvider>
      );

      await act(async () => {
        screen.getByTestId('btn-import').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('tx-count').textContent).toBe('1');
      });

      // Check if 'gym' category was created
      // Default categories usually exist, so count should be > 0.
      // Check if 'gym' is in the id list
      expect(screen.getByTestId('categories-list').textContent).toContain('gym');
    });
  });

  describe('Cloud Mode', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: 'test-user-id', email: 'test@example.com' } });
    });

    it('Fetches data from Supabase on mount', async () => {
      // Mock data
      // We need separate return values for transactions vs categories if possible, or just merge them
      // Current implementation calls .select('*') for both.
      // We can use mockReturnValueOnce for strict ordering if we know the order of calls in component:
      // 1. Transactions (with order)
      // 2. Categories

      mockSelect.mockReset(); // clear default implementation
      // 1. Transactions call
      mockSelect.mockReturnValueOnce({
        order: mockOrder.mockReturnValue({ // order call
          data: [{ id: 'cloud-tx-1', amount: 100, category: 'food', description: 'Cloud Tx', date: '2026-01-01' }],
          error: null
        })
      });
      // 2. Categories call
      mockSelect.mockReturnValueOnce({
        data: [],
        error: null
      });

      render(
        <LedgerProvider>
          <ResultDisplay />
        </LedgerProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tx-count').textContent).toBe('1');
      });

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(supabase.from).toHaveBeenCalledWith('categories');
    });

    it('Add Transaction: syncs to Supabase', async () => {
      // Mock data (Empty initially)
      mockSelect.mockReturnValue({
        order: mockOrder.mockReturnValue({ data: [], error: null }),
        data: [], error: null
      });

      render(
        <LedgerProvider>
          <ResultDisplay />
        </LedgerProvider>
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      await act(async () => {
        screen.getByTestId('btn-add').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('tx-count').textContent).toBe('1');
      });

      expect(mockInsert).toHaveBeenCalled();
      // Check payload
      const insertCall = mockInsert.mock.calls[0]?.[0];
      expect(insertCall).toMatchObject({
        user_id: 'test-user-id',
        amount: 100,
        description: 'Test Add'
      });
    });

    it('Update Transaction: updates Supabase', async () => {
      // transactions
      mockSelect.mockReturnValueOnce({
        order: mockOrder.mockReturnValue({
          data: [{ id: 'cloud-tx-1', amount: 100, category: 'food', description: 'Original', date: '2026-01-01' }],
          error: null
        })
      });
      // categories
      mockSelect.mockReturnValueOnce({ data: [], error: null });

      render(
        <LedgerProvider>
          <ResultDisplay />
        </LedgerProvider>
      );

      // Wait for load
      await waitFor(() => {
        expect(screen.getByTestId('tx-count').textContent).toBe('1');
      });

      // Update
      await act(async () => {
        screen.getByTestId('btn-update-cloud-tx-1').click();
      });

      expect(mockUpdate).toHaveBeenCalled();
      const updateCall = mockUpdate.mock.calls[0]?.[0];
      expect(updateCall).toMatchObject({
        amount: 999
      });
      expect(mockEq).toHaveBeenCalledWith('id', 'cloud-tx-1');
    });

    it('Delete Transaction: deletes from Supabase', async () => {
      // transactions
      mockSelect.mockReturnValueOnce({
        order: mockOrder.mockReturnValue({
          data: [{ id: 'cloud-tx-1', amount: 100, category: 'food', description: 'Original', date: '2026-01-01' }],
          error: null
        })
      });
      // categories
      mockSelect.mockReturnValueOnce({ data: [], error: null });

      render(
        <LedgerProvider>
          <ResultDisplay />
        </LedgerProvider>
      );

      // Wait for load
      await waitFor(() => {
        expect(screen.getByTestId('tx-count').textContent).toBe('1');
      });

      // Delete
      await act(async () => {
        screen.getByTestId('btn-delete-cloud-tx-1').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('tx-count').textContent).toBe('0');
      });

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'cloud-tx-1');
    });
    it('Import Data: Syncs to Supabase (Cloud Mode)', async () => {
      // Setup: User is logged in (from beforeEach)

      const backupPayload = {
        transactions: [
          { id: 'import-tx-1', amount: 50, categoryId: 'food', date: '2026-01-01', note: 'Imported', type: 'expense', updatedAt: '2026-01-02T12:00:00Z' }
        ],
        categories: [
          { id: 'import-cat-1', name: 'New Cat', icon: '🐱', type: 'expense', updatedAt: '2026-01-02T12:00:00Z' }
        ]
      };

      render(
        <LedgerProvider>
          <ResultDisplay importPayload={backupPayload} />
        </LedgerProvider>
      );

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      await act(async () => {
        screen.getByTestId('btn-import').click();
      });

      // Verify Upsert Calls
      // We expect at least 2 calls (categories + transactions). 
      // Seeding might have triggered an extra call on mount, so we check we have the *imported* ones.
      expect(mockUpsert.mock.calls.length).toBeGreaterThanOrEqual(2);
      // We can't easily check the order without inspecting calls, but we know both should be called.
      // Check Categories Upsert
      const categoryUpsertCall = mockUpsert.mock.calls.find(call => call[0][0]?.name === 'New Cat');
      expect(categoryUpsertCall).toBeDefined();
      expect(categoryUpsertCall![0][0]).toMatchObject({
        id: 'import-cat-1',
        user_id: 'test-user-id',
        name: 'New Cat'
      });

      // Check Transactions Upsert
      const txUpsertCall = mockUpsert.mock.calls.find(call => call[0][0]?.description === 'Imported');
      expect(txUpsertCall).toBeDefined();
      expect(txUpsertCall![0][0]).toMatchObject({
        id: 'import-tx-1',
        user_id: 'test-user-id',
        description: 'Imported'
      });
    });
  });

  describe('Edge Cases & Errors', () => {
    it('useLedger throws error if used outside provider', () => {
      // Suppress console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      expect(() => render(<ResultDisplay />)).toThrow('useLedger must be used within a LedgerProvider');
      consoleSpy.mockRestore();
    });

    it('Import Data handles errors gracefully', async () => {
      render(
        <LedgerProvider>
          <ResultDisplay importPayload={{ transactions: [], categories: [] }} />
        </LedgerProvider>
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage Error');
      });

      await act(async () => {
        screen.getByTestId('btn-import').click();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Import failed', expect.anything());

      consoleSpy.mockRestore();
      setItemSpy.mockRestore();
    });

    it('getCategory utility works', async () => {
      const TestComponent = () => {
        const { getCategory, addCategory } = useLedger();
        const [foundName, setFoundName] = React.useState('Init');
        const [createdId, setCreatedId] = React.useState<string | null>(null);

        React.useEffect(() => {
          addCategory({ name: 'FoundIt', icon: 'F', type: 'expense' }).then(id => {
            setCreatedId(id);
          });
        }, []);

        // Reactive check
        React.useEffect(() => {
          if (createdId) {
            const cat = getCategory(createdId);
            setFoundName(cat?.name || 'Not Found');
          }
        }, [createdId, getCategory]);

        return <div data-testid="cat-name">{foundName}</div>;
      };

      render(
        <LedgerProvider>
          <TestComponent />
        </LedgerProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cat-name').textContent).toBe('FoundIt');
      });
    });
  });
});
