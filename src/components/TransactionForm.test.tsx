// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import TransactionForm from './TransactionForm';
import { LedgerContext } from '../context/LedgerContext'; // We need access to Context Provider or mock the hook directly

// Mock Analytics
vi.mock('../lib/analytics', () => ({
    trackEvent: vi.fn(),
}));

// Mock useLedger
const mockAddTransaction = vi.fn();
const mockUpdateTransaction = vi.fn();
const mockDeleteTransaction = vi.fn();
const mockAddCategory = vi.fn();
const mockUpdateCategory = vi.fn();
const mockDeleteCategory = vi.fn();
const mockCategories = [
    { id: 'food', name: 'Food', icon: '🍔', type: 'expense' },
    { id: 'salary', name: 'Salary', icon: '💰', type: 'income' },
];

// We can mock the hook directly since it's exported
vi.mock('../context/LedgerContext', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual as any,
        useLedger: () => ({
            addTransaction: mockAddTransaction,
            updateTransaction: mockUpdateTransaction,
            deleteTransaction: mockDeleteTransaction,
            categories: mockCategories,
            addCategory: mockAddCategory,
            updateCategory: mockUpdateCategory,
            deleteCategory: mockDeleteCategory,
        }),
    };
});

describe('TransactionForm Component', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('Renders Add Transaction mode by default', () => {
        render(<TransactionForm onClose={mockOnClose} />);
        expect(screen.getByText('Add Transaction')).toBeDefined();
        // Check for Amount input
        expect(screen.getByPlaceholderText('0.00')).toBeDefined();
        // Check for Categories
        expect(screen.getByText('Food')).toBeDefined();
    });

    it('Validates form submission (requires amount and category)', async () => {
        render(<TransactionForm onClose={mockOnClose} />);
        
        const saveBtn = screen.getByText('Save Transaction');
        fireEvent.click(saveBtn);

        // Expect no call
        expect(mockAddTransaction).not.toHaveBeenCalled();
        // UI might not show error explicitly unless handled, but checks logic
        // The component checks `if (!amount || !categoryId) return;`
    });

    it('Submits valid new transaction', async () => {
        render(<TransactionForm onClose={mockOnClose} />);

        // Enter Amount
        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } });
        
        // Select Category (Food)
        fireEvent.click(screen.getByText('Food'));

        // Enter Note
        fireEvent.change(screen.getByPlaceholderText('Note'), { target: { value: 'Lunch' } });

        // Save
        const saveBtn = screen.getByText('Save Transaction');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockAddTransaction).toHaveBeenCalledTimes(1);
        });

        expect(mockAddTransaction).toHaveBeenCalledWith(expect.objectContaining({
            amount: 100,
            categoryId: 'food',
            note: 'Lunch',
            type: 'expense',
            status: 'completed'
        }));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('Renders Edit Transaction mode with initial data', () => {
        const initialData = {
            id: 'tx-1',
            amount: 50,
            categoryId: 'food',
            date: '2026-01-01',
            note: 'Old Lunch',
            type: 'expense' as const,
            status: 'completed' as const,
            updatedAt: '2026-01-01T10:00:00Z'
        };

        render(<TransactionForm onClose={mockOnClose} initialData={initialData} />);
        
        expect(screen.getByText('Edit Transaction')).toBeDefined();
        expect(screen.getByDisplayValue('50')).toBeDefined();
        expect(screen.getByDisplayValue('Old Lunch')).toBeDefined();
    });

    it('Updates existing transaction', async () => {
        const initialData = {
            id: 'tx-1',
            amount: 50,
            categoryId: 'food',
            date: '2026-01-01',
            note: 'Old Lunch',
            type: 'expense' as const,
            status: 'completed' as const,
            updatedAt: '2026-01-01T10:00:00Z'
        };

        render(<TransactionForm onClose={mockOnClose} initialData={initialData} />);

        // Change Amount
        fireEvent.change(screen.getByDisplayValue('50'), { target: { value: '75' } });

        // Save
        const updateBtn = screen.getByText('Update Transaction');
        fireEvent.click(updateBtn);

        await waitFor(() => {
            expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
        });

        expect(mockUpdateTransaction).toHaveBeenCalledWith('tx-1', expect.objectContaining({
            amount: 75,
            note: 'Old Lunch'
        }));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('Deletes transaction after confirmation', async () => {
         const initialData = {
            id: 'tx-1',
            amount: 50,
            categoryId: 'food',
            date: '2026-01-01',
            note: 'To Delete',
            type: 'expense' as const,
            status: 'completed' as const,
            updatedAt: '2026-01-01T10:00:00Z'
        };

        render(<TransactionForm onClose={mockOnClose} initialData={initialData} />);

        // Click Delete (Initial)
        fireEvent.click(screen.getByText('Delete Transaction'));

        // Should show confirmation
        expect(screen.getByText('Are you sure?')).toBeDefined();

        // Click Confirm
        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(mockDeleteTransaction).toHaveBeenCalledWith('tx-1');
        });
        expect(mockOnClose).toHaveBeenCalled();
    });
});
