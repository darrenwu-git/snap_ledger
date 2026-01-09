// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import { LedgerProvider, useLedger } from './LedgerContext';
import testBackup from '../../test_backup.json';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
    })),
  },
}));

// Mock AuthContext
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'generated-uuid-' + Math.random().toString(36).substring(7)
  }
});

const ResultDisplay = ({ importPayload }: { importPayload?: any }) => {
  const { transactions, categories, importData } = useLedger();

  return (
    <div>
      <div data-testid="tx-count">{transactions.length}</div>
      <div data-testid="cat-count">{categories.length}</div>
      <button
        data-testid="btn-import"
        onClick={() => importData(importPayload || testBackup)}
      >
        Import
      </button>
      <ul>
        {transactions.map(t => (
          <li key={t.id} data-testid={`tx-${t.id}`}>
            {t.note} - {t.amount}
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
  });

  afterEach(() => {
    cleanup();
  });

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
