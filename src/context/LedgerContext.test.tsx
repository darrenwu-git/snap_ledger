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

  it('Local Wins Strategy: Does NOT overwrite modified local data', async () => {
    // 1. Setup Local Data (User modified amount to 10)
    const localTx = [{
      id: 'tx-conflict',
      amount: 10,
      type: 'expense',
      categoryId: 'food',
      date: '2026-01-01',
      note: 'Local Version',
      status: 'completed'
    }];
    localStorage.setItem('snap_ledger_transactions', JSON.stringify(localTx));

    // 2. Prepare Backup Data (Old version with amount 100)
    const backupPayload = {
      transactions: [{
        id: 'tx-conflict',
        amount: 100, // Should be ignored
        type: 'expense',
        categoryId: 'food',
        date: '2026-01-01',
        note: 'Backup Version',
        status: 'completed'
      }],
      categories: []
    };

    render(
      <LedgerProvider>
        <ResultDisplay importPayload={backupPayload} />
      </LedgerProvider>
    );

    // Verify Local is loaded first
    await waitFor(() => {
      expect(screen.getByTestId('tx-count').textContent).toBe('1');
    });
    expect(screen.getByTestId('tx-tx-conflict').textContent).toContain('10');
    expect(screen.getByTestId('tx-tx-conflict').textContent).toContain('Local Version');

    // 3. Perform Import
    await act(async () => {
      screen.getByTestId('btn-import').click();
    });

    // 4. Result Assertion: Should REMAIN 10 (Local Version)
    await waitFor(() => {
      // Still 1 transaction implies no duplicate added
      expect(screen.getByTestId('tx-count').textContent).toBe('1');
    });

    // Check specific content
    const txElement = screen.getByTestId('tx-tx-conflict');
    expect(txElement.textContent).toContain('10'); // NOT 100
    expect(txElement.textContent).toContain('Local Version'); // NOT Backup Version
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
