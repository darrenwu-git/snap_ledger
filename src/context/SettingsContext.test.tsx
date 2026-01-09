import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from './SettingsContext';

describe('SettingsContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide default values', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

    expect(result.current.language).toBe('en-US'); // Default valid fallbacks
    expect(result.current.autoCreateCategories).toBe(false);
  });

  it('should read initial values from localStorage', () => {
    localStorage.setItem('snap_ledger_language', 'zh-TW');
    localStorage.setItem('snap_ledger_auto_create_categories', 'true');

    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

    expect(result.current.language).toBe('zh-TW');
    expect(result.current.autoCreateCategories).toBe(true);
  });

  it('should update language and persist to localStorage', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

    act(() => {
      result.current.setLanguage('ja-JP');
    });

    expect(result.current.language).toBe('ja-JP');
    expect(localStorage.getItem('snap_ledger_language')).toBe('ja-JP');
  });

  it('should update autoCreateCategories and persist to localStorage', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

    act(() => {
      result.current.setAutoCreateCategories(true);
    });

    expect(result.current.autoCreateCategories).toBe(true);
    expect(localStorage.getItem('snap_ledger_auto_create_categories')).toBe('true');
  });

  it('should throw error if used outside provider', () => {
    // Suppress console.error for this test case to keep output clean
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useSettings());
    }).toThrow('useSettings must be used within a SettingsProvider');

    consoleSpy.mockRestore();
  });
});
