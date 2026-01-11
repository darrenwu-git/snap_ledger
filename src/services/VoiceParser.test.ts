import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { parseVoiceInput } from './VoiceParser';
import type { Category } from '../types';

// Mock Category Data
const mockCategories: Category[] = [
  { id: '1', name: 'Food', type: 'expense', icon: '🍔' },
  { id: '2', name: 'Salary', type: 'income', icon: '💰' },
];

const mockBlob = new Blob(['mock audio'], { type: 'audio/webm' });

describe('VoiceParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return error message if API key is missing', async () => {
    const result = await parseVoiceInput(mockBlob, mockCategories, '');

    expect(result).toEqual({
      type: 'non_accounting',
      message: "⚠️ Missing API Key. Please click the Gear icon to set up your AI Builder Space API Key."
    });
  });

  it('should handle transcription API failure', async () => {
    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Transcription failed'),
        statusText: 'Internal Server Error'
      });

    const result = await parseVoiceInput(mockBlob, mockCategories, 'valid-key');

    expect(result).toEqual({
      type: 'non_accounting',
      message: "❌ AI processing failed. Please check your API Key."
    });
  });

  it('should handle empty transcription', async () => {
    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: '' })
      });

    const result = await parseVoiceInput(mockBlob, mockCategories, 'valid-key');

    expect(result).toEqual({
      type: 'non_accounting',
      message: "I didn't hear anything clearly."
    });
  });

  it('should successfully parse a standard expense transaction', async () => {
    // Mock Transcription
    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Spent 500 on dinner' })
      });

    // Mock Chat Completion
    const mockChatResponse = {
      is_transaction: true,
      amount: 500,
      categoryId: '1',
      type: 'expense',
      date: '2023-10-27',
      note: 'Dinner',
      confidence: 1.0
    };

    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(mockChatResponse) } }]
        })
      });

    const result = await parseVoiceInput(mockBlob, mockCategories, 'valid-key');

    expect(result).toEqual({
      type: 'transaction',
      data: {
        amount: 500,
        categoryId: '1',
        type: 'expense',
        date: '2023-10-27',
        note: 'Dinner',
        confidence: 1.0, // Should stay 1.0
        newCategory: undefined,
      }
    });
  });

  it('should successfully parse a standard income transaction', async () => {
    // Mock Transcription
    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Received 50000 salary' })
      });

    // Mock Chat Completion
    const mockChatResponse = {
      is_transaction: true,
      amount: 50000,
      categoryId: '2',
      type: 'income',
      date: '2023-11-01',
      note: 'Salary',
      confidence: 1.0
    };

    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(mockChatResponse) } }]
        })
      });

    const result = await parseVoiceInput(mockBlob, mockCategories, 'valid-key');

    expect(result).toEqual({
      type: 'transaction',
      data: {
        amount: 50000,
        categoryId: '2',
        type: 'income',
        date: '2023-11-01',
        note: 'Salary',
        confidence: 1.0,
        newCategory: undefined,
      }
    });
  });

  it('should handle auto-category creation when enabled', async () => {
    // Mock Transcription
    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Spent 100 on gaming' })
      });

    // Mock Chat Completion
    const mockChatResponse = {
      is_transaction: true,
      amount: 100,
      categoryId: null,
      type: 'expense',
      date: '2023-10-27',
      note: 'Gaming',
      confidence: 0.8,
      new_category: {
        name: 'Gaming',
        icon: '🎮',
        type: 'expense'
      }
    };

    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(mockChatResponse) } }]
        })
      });

    const result = await parseVoiceInput(mockBlob, mockCategories, 'valid-key', { allowAutoCategoryCreation: true });

    expect(result).toEqual({
      type: 'transaction',
      data: {
        amount: 100,
        categoryId: '',
        type: 'expense',
        date: '2023-10-27',
        note: 'Gaming',
        confidence: 0.9, // Bumps to 0.9 for valid new category
        newCategory: {
          name: 'Gaming',
          icon: '🎮',
          type: 'expense'
        }
      }
    });
  });

  it('should NOT suggest new category if disabled', async () => {
    // Mock Chat Response
    const mockChatResponse = {
      is_transaction: true,
      amount: 100,
      categoryId: null,
      type: 'expense',
      date: '2023-10-27',
      note: 'Unknown',
      confidence: 0.5
    };

    let capturedBody: { messages: { content: string }[] } | undefined;

    // 1. Transcription Mock
    (globalThis.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: 'Spent 100 on unknown' })
    });

    // 2. Chat Mock
    (globalThis.fetch as Mock).mockImplementationOnce(async (_url: string, options: { body: string }) => {
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(mockChatResponse) } }]
        })
      };
    });

    await parseVoiceInput(mockBlob, mockCategories, 'valid-key', { allowAutoCategoryCreation: false });

    // Verify
    expect(capturedBody).toBeDefined();
    const systemPrompt = capturedBody!.messages[0].content;
    expect(systemPrompt).toContain('Do NOT suggest new categories');
  });

  it('should handle non-accounting intent', async () => {
    // Mock Transcription
    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Hello world' })
      });

    // Mock Chat Completion
    const mockChatResponse = {
      is_transaction: false,
      message: "Greeting detected"
    };

    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(mockChatResponse) } }]
        })
      });

    const result = await parseVoiceInput(mockBlob, mockCategories, 'valid-key');

    expect(result).toEqual({
      type: 'non_accounting',
      message: "Greeting detected"
    });
  });

  it('should handle chat API failure', async () => {
    // Mock Transcription
    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Spend 100' })
      });

    // Mock Chat Failure
    (globalThis.fetch as Mock)
      .mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('OOM'),
        statusText: 'Service Unavailable'
      });

    const result = await parseVoiceInput(mockBlob, mockCategories, 'valid-key');

    expect(result).toEqual({
      type: 'non_accounting',
      message: "❌ AI processing failed. Please check your API Key."
    });
  });
});
