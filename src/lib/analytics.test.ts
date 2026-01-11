// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackEvent, submitFeedback, getAnonymousId } from './analytics';

const { mockInsert, mockFrom, mockGetUser } = vi.hoisted(() => {
  const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
  const mockFrom = vi.fn(() => ({
    insert: mockInsert
  }));
  const mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null }, error: null }));

  return { mockInsert, mockFrom, mockGetUser };
});

vi.mock('./supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: mockGetUser
    }
  }
}));

// Mock LocalStorage
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock Crypto
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-anon-id'
  }
});

describe('Analytics Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null } as any);
    mockInsert.mockResolvedValue({ data: null, error: null } as any);
  });

  describe('getAnonymousId', () => {
    it('generates a new ID if none exists', () => {
      const id = getAnonymousId();
      expect(id).toBe('test-anon-id');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('snap_ledger_anonymous_id', 'test-anon-id');
    });

    it('returns existing ID from local storage', () => {
      localStorageMock.setItem('snap_ledger_anonymous_id', 'existing-id');
      const id = getAnonymousId();
      expect(id).toBe('existing-id');
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('trackEvent', () => {
    it('sends event to supabase with anonymous ID (Guest)', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null } as any);

      await trackEvent('app_opened', { source: 'test' });

      expect(mockFrom).toHaveBeenCalledWith('analytics_events');
      expect(mockInsert).toHaveBeenCalledWith({
        anonymous_id: 'test-anon-id',
        user_id: null,
        event_name: 'app_opened',
        properties: { source: 'test' }
      });
    });

    it('sends event with User ID if logged in', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u123' } }, error: null } as any);
      localStorageMock.setItem('snap_ledger_anonymous_id', 'anon-123');

      await trackEvent('transaction_created');

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        anonymous_id: 'anon-123',
        user_id: 'u123',
        event_name: 'transaction_created'
      }));
    });
  });

  describe('submitFeedback', () => {
    it('submits feedback payload correctly', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u999' } }, error: null } as any);

      await submitFeedback('feature', 'Great app!', 'test@example.com');

      expect(mockFrom).toHaveBeenCalledWith('feedback');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        type: 'feature',
        message: 'Great app!',
        contact_email: 'test@example.com',
        user_id: 'u999',
        metadata: expect.objectContaining({
          version: '0.2.6'
        })
      }));
    });
  });
});
