// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import MonthlySummary from './MonthlySummary';

// Mock Analytics
vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock LedgerContext
const mockTransactions = [
  { id: 't1', amount: 100, type: 'expense', categoryId: 'food', date: '2026-01-20T12:00:00Z', note: 'Lunch', status: 'completed' },
  { id: 't2', amount: 500, type: 'income', categoryId: 'salary', date: '2026-01-15T12:00:00Z', note: 'Salary', status: 'completed' },
  { id: 't3', amount: 50, type: 'expense', categoryId: 'transport', date: '2025-12-15T12:00:00Z', note: 'Taxi', status: 'completed' }, // Previous month
];

const mockCategories = [
  { id: 'food', name: 'Food', icon: '🍔', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: '💰', type: 'income' },
  { id: 'transport', name: 'Transport', icon: '🚗', type: 'expense' },
];

const mockDeleteTransaction = vi.fn();

vi.mock('../context/LedgerContext', () => ({
  useLedger: () => ({
    transactions: mockTransactions,
    categories: mockCategories,
    deleteTransaction: mockDeleteTransaction,
    currency: 'USD', // Assuming currency is in context or defaulted
  }),
}));

// Mock TransactionForm (since it's used in Edit Modal)
vi.mock('./TransactionForm', () => ({
  default: ({ onClose, initialData }: { onClose: () => void; initialData?: { id: string } }) => (
    <div data-testid="mock-tx-form">
      Mock Transaction Form
      {initialData && <div data-testid="initial-data-id">{initialData.id}</div>}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('MonthlySummary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Date key if necessary, but component has internal state for current date
  });

  afterEach(() => {
    cleanup();
  });

  it('Renders summary stats correctly for current month (Jan 2026)', () => {
    const TestWrapper = () => {
      const [date, setDate] = React.useState(new Date('2026-01-15T10:00:00Z'));
      const [viewMode, setViewMode] = React.useState<'month' | 'year'>('month');
      return <MonthlySummary currentDate={date} setCurrentDate={setDate} viewMode={viewMode} setViewMode={setViewMode} />;
    };

    render(<TestWrapper />);

    // Expense: 100 (t1), Income: 500 (t2). Balance: +400.
    // t3 is Dec 2025, ignored.

    // Check Date Display
    expect(screen.getByText(/January 2026/i)).toBeDefined();

    // Check Expense
    const expElements = screen.getAllByText(/\$100/);
    expect(expElements.length).toBeGreaterThan(0);

    // Check Balance (saved $400)
    expect(screen.getByText(/saved \$400/i)).toBeDefined();



    // Check Category Breakdown
    expect(screen.getByText('Food')).toBeDefined();
    // Transport is in Dec, shouldn't be here
    expect(screen.queryByText('Transport')).toBeNull();
  });

  it('Navigates to previous month and updates stats', () => {
    const TestWrapper = () => {
      const [date, setDate] = React.useState(new Date('2026-01-15T10:00:00Z'));
      const [viewMode, setViewMode] = React.useState<'month' | 'year'>('month');
      return <MonthlySummary currentDate={date} setCurrentDate={setDate} viewMode={viewMode} setViewMode={setViewMode} />;
    };

    render(<TestWrapper />);

    // Click Previuos
    fireEvent.click(screen.getByText('‹'));

    // Should be Dec 2025
    expect(screen.getByText(/December 2025/i)).toBeDefined();

    // Expense: 50 (Transport)
    const prevMonthExp = screen.getAllByText(/\$50/);
    expect(prevMonthExp.length).toBeGreaterThan(0);
    expect(screen.getByText('Transport')).toBeDefined();
    expect(screen.queryByText('Food')).toBeNull();
  });

  it('Switches to Year View', () => {
    const TestWrapper = () => {
      const [date, setDate] = React.useState(new Date('2026-01-15T10:00:00Z'));
      const [viewMode, setViewMode] = React.useState<'month' | 'year'>('month');
      return <MonthlySummary currentDate={date} setCurrentDate={setDate} viewMode={viewMode} setViewMode={setViewMode} />;
    };

    render(<TestWrapper />);

    // Switch to Year
    fireEvent.click(screen.getByText('Year'));

    // Should show '2026'
    expect(screen.getByText(/^2026$/)).toBeDefined();

    // Stats should be same for 2026 (only Jan has data)

    const yearExp = screen.getAllByText(/\$100/);
    expect(yearExp.length).toBeGreaterThan(0);
  });

  it('Handles Date Picker Month Selection', async () => {
    const TestWrapper = () => {
      // Start in Year view to test auto-switch to Month view?
      // Or just standard select
      const [date, setDate] = React.useState(new Date('2026-01-15T10:00:00Z'));
      const [viewMode, setViewMode] = React.useState<'month' | 'year'>('month');
      return <MonthlySummary currentDate={date} setCurrentDate={setDate} viewMode={viewMode} setViewMode={setViewMode} />;
    };

    render(<TestWrapper />);

    // Open Picker (click the date text)
    fireEvent.click(screen.getByText(/January 2026/i));

    // Expect Picker to show
    expect(screen.getByText('2026')).toBeDefined(); // Year in picker header

    // Click 'Feb' (index 1)
    fireEvent.click(screen.getByText('Feb')); // "Feb" short name

    // Should close picker and update date
    expect(screen.getByText(/February 2026/i)).toBeDefined();
    expect(screen.getByText('No expenses for this period')).toBeDefined();
  });

  it('Resets to Today', () => {
    // Mock system time to 2026-06-15
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    const TestWrapper = () => {
      const [date, setDate] = React.useState(new Date('2025-01-01T10:00:00Z')); // Old date
      const [viewMode, setViewMode] = React.useState<'month' | 'year'>('month');
      return <MonthlySummary currentDate={date} setCurrentDate={setDate} viewMode={viewMode} setViewMode={setViewMode} />;
    };

    render(<TestWrapper />);

    expect(screen.getByText(/January 2025/i)).toBeDefined();

    fireEvent.click(screen.getByText('Today'));

    expect(screen.getByText(/June 2026/i)).toBeDefined();

    vi.useRealTimers();
  });
});
