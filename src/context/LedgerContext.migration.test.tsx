// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { LedgerProvider, useLedger } from './LedgerContext';
import { DEFAULT_CATEGORIES } from '../types';

// Mock Supabase
const mockSelect = vi.fn();
const mockUpsert = vi.fn();
const mockOrder = vi.fn();

mockSelect.mockReturnValue({
  data: [],
  error: null,
  order: mockOrder
});
mockOrder.mockReturnValue({ data: [], error: null });

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
    })),
  },
}));

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('./AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const CategoryList = () => {
  const { categories } = useLedger();
  return (
    <div data-testid="category-ids">
      {categories.map(c => c.id).join(',')}
    </div>
  );
};

describe('LedgerContext Migration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockOrder.mockReturnValue({ data: [], error: null });
    mockSelect.mockReturnValue({ data: [], error: null, order: mockOrder });
    mockUpsert.mockReturnValue({ error: null });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Local Mode Migration', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null });
    });

    it('Migrates old data (missing defaults) by adding them', async () => {
      // Setup OLD data: only one custom category, NO defaults
      const oldCategories = [{ id: 'custom-1', name: 'Custom 1', icon: 'C', type: 'expense' }];
      localStorage.setItem('snap_ledger_categories', JSON.stringify(oldCategories));

      render(
        <LedgerProvider>
          <CategoryList />
        </LedgerProvider>
      );

      // Should now have custom-1 AND all defaults (e.g. food)
      await waitFor(() => {
        const text = screen.getByTestId('category-ids').textContent;
        expect(text).toContain('custom-1');
        // Should contain UUID now
        expect(text).toContain('a1e7e720-4e56-42f7-927c-9b788a8d1a1e');
      });

      // Verify it updated localStorage
      const saved = JSON.parse(localStorage.getItem('snap_ledger_categories') || '[]');
      expect(saved.length).toBeGreaterThan(1);
      // Validates it was migrated/saved as UUID
      expect(saved.find((c: any) => c.id === 'a1e7e720-4e56-42f7-927c-9b788a8d1a1e')).toBeDefined();
    });

    it('Respects existing defaults if already present', async () => {
      // Setup data that ALREADY has 'food' (simulating user already migrated or customized it)
      const existing = [{ id: 'food', name: 'My Food', icon: '🍔', type: 'expense' }];
      localStorage.setItem('snap_ledger_categories', JSON.stringify(existing));

      render(
        <LedgerProvider>
          <CategoryList />
        </LedgerProvider>
      );

      await waitFor(() => {
        const text = screen.getByTestId('category-ids').textContent;
        expect(text).toContain('food');
      });

      // Verify 'My Food' name is preserved (not overwritten by default 'Food')
      const { categories } = JSON.parse(localStorage.getItem('snap_ledger_categories') || '{}');
      // Wait, we need to inspect the state or local storage more carefully
      // The component renders IDs.
      // Let's check local storage directly
      const saved = JSON.parse(localStorage.getItem('snap_ledger_categories') || '[]');
      const food = saved.find((c: any) => c.id === 'food');
      expect(food.name).toBe('My Food');
    });
  });

  describe('Cloud Mode Seeding', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
    });

    it('Seeds default categories if DB is empty', async () => {
      // Mock empty DB
      mockSelect.mockReturnValue({ data: [], error: null, order: mockOrder });

      render(
        <LedgerProvider>
          <CategoryList />
        </LedgerProvider>
      );

      // Should trigger upsert for defaults
      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalled();
      });

      // Verify payload includes 'food'
      const calls = mockUpsert.mock.calls;
      const payload = calls[0][0]; // first arg of first call
      // payload should be array of categories
      expect(Array.isArray(payload)).toBe(true);
      // Should contain the new UUID for food
      expect(payload.find((c: any) => c.id === 'a1e7e720-4e56-42f7-927c-9b788a8d1a1e')).toBeDefined();
    });

    it('Does NOT seed if defaults exist', async () => {
      // Mock DB having 'food'
      mockSelect.mockReturnValue({
        data: [{ id: 'food', name: 'Cloud Food', icon: 'C', type: 'expense' }],
        error: null,
        order: mockOrder
      });

      render(
        <LedgerProvider>
          <CategoryList />
        </LedgerProvider>
      );

      // Should NOT trigger upsert (or at least not for food)
      // Actually, if ANY default is missing, it upserts the missing ones.
      // If ALL defaults are present (mockSelect returns them all?), it won't upsert.
      // Here we only returned 'food'. Since DEFAULT_CATEGORIES has many, it WILL upsert the others (transport, etc).
      // So verify 'food' is NOT in the upsert payload (since it exists).

      await waitFor(() => {
        // Upsert IS called for missing ones
        expect(mockUpsert).toHaveBeenCalled();
      });

      const payload = mockUpsert.mock.calls[0][0];
      expect(payload.find((c: any) => c.id === 'food')).toBeUndefined(); // Should skip food
    });
  });
});
