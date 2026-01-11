// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import TransactionForm from './TransactionForm';
// We don't need LedgerContext import as we mock the hook directly

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
    const actual = await importOriginal<typeof import('../context/LedgerContext')>();
    return {
        ...actual,
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

    it('Toggles transaction type', () => {
        render(<TransactionForm onClose={mockOnClose} />);

        const incomeBtn = screen.getByText('Income');
        fireEvent.click(incomeBtn);

        // Check visual feedback (optional, or just check state implies logic)
        // We can check if categories filtered are income type?
        // Mock categories has 'Salary' (income) and 'Food' (expense).
        expect(screen.getByText('Salary')).toBeDefined();
        // 'Food' might be hidden?
        expect(screen.queryByText('Food')).toBeNull();
    });

    describe('Category Management', () => {
        it('Opens New Category form when clicking "New"', () => {
            render(<TransactionForm onClose={mockOnClose} />);
            fireEvent.click(screen.getByText('New'));
            expect(screen.getByText('New Category')).toBeDefined();
            expect(screen.getByText('Add Category')).toBeDefined();
        });

        it('Adds a new category', async () => {
            mockAddCategory.mockResolvedValue('new-cat-id');

            render(<TransactionForm onClose={mockOnClose} />);

            // Open New Category
            fireEvent.click(screen.getByText('New'));

            // Enter Name
            fireEvent.change(screen.getByPlaceholderText('e.g. Rent'), { target: { value: 'New Stuff' } });

            // Select Icon (first one)
            const iconBtn = screen.getByText('🍔');
            fireEvent.click(iconBtn);

            // Save
            await act(async () => {
                fireEvent.click(screen.getByText('Add Category'));
            });

            expect(mockAddCategory).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New Stuff',
                icon: '🍔',
                type: 'expense'
            }));

            // Verify Telemetry
            const { trackEvent } = await import('../lib/analytics');
            expect(trackEvent).toHaveBeenCalledWith('category_created', expect.objectContaining({
                category_id: 'new-cat-id',
                name: 'New Stuff',
                icon: '🍔',
                type: 'expense',
                source: 'manual'
            }));
        });

        it('Edits an existing category', async () => {
            // Setup: Add a custom category to mockCategories
            const customCat = { id: 'custom-1', name: 'Custom Cat', icon: '🎸', type: 'expense' as const };
            mockCategories.push(customCat);

            render(<TransactionForm onClose={mockOnClose} />);

            // Find category button and hover/click to see edit pencil
            // Since hover via fireEvent.mouseEnter works:
            const catBtn = screen.getByText('Custom Cat').closest('div');
            // The structure is div > button ... and div > edit_pencil
            // We need to trigger mouseEnter on the container div
            if (catBtn) fireEvent.mouseEnter(catBtn);

            // Find pencil (title="Edit Category")
            const pencil = await screen.findByTitle('Edit Category');
            fireEvent.click(pencil);

            // Change Name
            fireEvent.change(screen.getByPlaceholderText('e.g. Rent'), { target: { value: 'Updated Cat' } });

            // Update
            await act(async () => {
                fireEvent.click(screen.getByText('Update Category'));
            });

            expect(mockUpdateCategory).toHaveBeenCalledWith('custom-1', expect.objectContaining({
                name: 'Updated Cat',
                icon: '🎸'
            }));

            // Verify Telemetry
            const { trackEvent } = await import('../lib/analytics');
            expect(trackEvent).toHaveBeenCalledWith('category_updated', expect.objectContaining({
                category_id: 'custom-1',
                name: 'Updated Cat',
                icon: '🎸',
                source: 'manual',
                changes: expect.objectContaining({
                    name: { old: 'Custom Cat', new: 'Updated Cat' }
                    // Icon didn't change in this test step, so it shouldn't be in changes
                })
            }));

            // Cleanup
            const idx = mockCategories.indexOf(customCat);
            if (idx > -1) mockCategories.splice(idx, 1);
        });

        it('Edits a newly created manual category', async () => {
            mockAddCategory.mockResolvedValue('new-cat-id');
            const newCat = { id: 'new-cat-id', name: 'New Stuff', icon: '🍔', type: 'expense' as const };
            // We need to push this to mockCategories AFTER creation so the edit logic can find it

            const { rerender } = render(<TransactionForm onClose={mockOnClose} />);

            // 1. Create New
            fireEvent.click(screen.getByText('New'));
            fireEvent.change(screen.getByPlaceholderText('e.g. Rent'), { target: { value: 'New Stuff' } });
            fireEvent.click(screen.getByText('🍔'));

            await act(async () => {
                fireEvent.click(screen.getByText('Add Category'));
            });

            expect(mockAddCategory).toHaveBeenCalled();

            // Manually add to mock store because the component won't auto-update our mock import
            mockCategories.push(newCat);

            // Force re-render so it sees the new category in the list
            rerender(<TransactionForm onClose={mockOnClose} />);

            // 2. Now Edit that same new category
            const catBtn = await screen.findByText('New Stuff'); // Should appear now
            const catContainer = catBtn.closest('div')?.parentElement;
            if (catContainer) fireEvent.mouseEnter(catContainer);


            const pencil = await screen.findByTitle('Edit Category');
            fireEvent.click(pencil);

            // Change Icon
            fireEvent.click(screen.getByText('🚗'));

            await act(async () => {
                fireEvent.click(screen.getByText('Update Category'));
            });

            // Telemetry Check
            const { trackEvent } = await import('../lib/analytics');
            const calls = (trackEvent as Mock).mock.calls;
            const updateCall = calls.find((c: unknown[]) => c[0] === 'category_updated');

            expect(updateCall).toBeDefined();
            expect(updateCall![1]).toMatchObject({
                category_id: 'new-cat-id',
                changes: {
                    icon: { old: '🍔', new: '🚗' }
                }
            });

            // Cleanup
            const idx = mockCategories.indexOf(newCat);
            if (idx > -1) mockCategories.splice(idx, 1);
        });

        it('Deletes a custom category', async () => {
            // Setup: Add a custom category
            const customCat = { id: 'custom-to-delete', name: 'To Delete', icon: '🗑️', type: 'expense' as const };
            mockCategories.push(customCat);

            render(<TransactionForm onClose={mockOnClose} />);

            // Enter Edit Mode
            const catBlock = screen.getByText('To Delete').closest('div')?.parentElement;
            if (catBlock) fireEvent.mouseEnter(catBlock);

            const pencil = await screen.findByTitle('Edit Category');
            fireEvent.click(pencil);

            // Mock window.confirm
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

            // Click Delete Category
            await act(async () => {
                fireEvent.click(screen.getByText('Delete Category'));
            });

            expect(mockDeleteCategory).toHaveBeenCalledWith('custom-to-delete');

            confirmSpy.mockRestore();
            const idx = mockCategories.indexOf(customCat);
            if (idx > -1) mockCategories.splice(idx, 1);
        });
    });
});
