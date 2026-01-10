import React, { useState } from 'react';
import { trackEvent } from '../lib/analytics';
import { useLedger } from '../context/LedgerContext';
import { DEFAULT_CATEGORIES } from '../types';
import type { Transaction, TransactionType, Category } from '../types';

const PRESET_ICONS = [
  '🍔', '🚗', '🛍️', '🎮', '🧾', '💊', '💰', '🎁', '📈',
  '🏠', '📱', '💻', '👗', '✈️', '🛒', '🏋️', '📚', '👶',
  '🐾', '🔧', '🚌', '🚕', '☕', '🍺', '💇', '🎨'
];

interface TransactionFormProps {
  onClose: () => void;
  initialData?: Transaction;
  defaultValues?: Partial<Transaction>;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, initialData, defaultValues }) => {
  const { addTransaction, updateTransaction, deleteTransaction, categories, addCategory, updateCategory, deleteCategory } = useLedger();
  const [type, setType] = useState<TransactionType>(initialData?.type || defaultValues?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || defaultValues?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || defaultValues?.categoryId || '');
  const [note, setNote] = useState(initialData?.note || defaultValues?.note || '');
  const [date, setDate] = useState(() => {
    const val = initialData?.date || defaultValues?.date || new Date().toISOString();
    return val.split('T')[0];
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    setError(null);
    setIsSubmitting(true);

    const transactionData = {
      amount: parseFloat(amount),
      type,
      categoryId,
      date,
      note,
      status: 'completed' as const, // Explicitly set status to completed on save
    };

    try {
      if (initialData) {
        await updateTransaction(initialData.id, transactionData);
      } else {
        await addTransaction(transactionData);
        // Track Manual Transaction
        const catName = categories.find(c => c.id === categoryId)?.name || 'unknown';
        trackEvent('transaction_created', {
          source: 'manual',
          category_id: categoryId,
          category_name: catName,
          auto_saved: false
        });
      }
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to save transaction';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const handleDelete = async () => {
    if (initialData) {
      // Confirmation handled by UI state now

      setError(null);
      setIsSubmitting(true);
      try {
        await deleteTransaction(initialData.id);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to delete');
        setIsSubmitting(false);
        setIsDeleteConfirming(false); // Reset on error
      }
    }
  };

  const handleEditCategory = (e: React.MouseEvent, cat: Category) => {
    e.stopPropagation();
    setEditingCategoryId(cat.id);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
    setIsAddingCategory(true);
    setCategoryId('');
    setError(null);
  };

  const handleSaveCategory = async () => {
    if (!newCatName || !newCatIcon) {
      setError('Please select an icon and enter a name.');
      return;
    }

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, {
          name: newCatName,
          icon: newCatIcon,
          type: type
        });
        setEditingCategoryId(null);
      } else {
        const newId = await addCategory({
          name: newCatName,
          icon: newCatIcon,
          type: type
        });
        setCategoryId(newId);
      }

      setIsAddingCategory(false);
      setNewCatName('');
      setNewCatIcon('');
      setError(null);

      // Track Event
      trackEvent('category_created', {
        name: newCatName,
        source: 'manual',
        icon: newCatIcon,
        type: type
      });

    } catch (e: any) {
      setError(e.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent selecting the category when deleting
    if (!window.confirm('Delete this category?')) return;

    try {
      await deleteCategory(id);
      if (categoryId === id) setCategoryId('');
      if (editingCategoryId === id) {
        setIsAddingCategory(false);
        setEditingCategoryId(null);
      }
    } catch (e: any) {
      console.error(e);
      setError('Failed to delete category');
    }
  };

  const isCustomCategory = (id: string) => !DEFAULT_CATEGORIES.some(c => c.id === id);

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <h2 className="text-gradient">
          {initialData ? 'Edit Transaction' : (defaultValues ? 'Review & Save' : 'Add Transaction')}
        </h2>
        <button onClick={onClose} style={{ fontSize: '1.5rem', color: 'hsl(var(--color-text-muted))' }}>×</button>
      </div>

      <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '20px' }}>
        {/* Error Message */}
        {error && (
          <div style={{ color: 'red', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(255,0,0,0.1)', padding: '8px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {/* Type Toggle */}
        <div style={{ display: 'flex', background: 'hsl(var(--color-bg))', padding: '4px', borderRadius: 'var(--radius-full)' }}>
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); setCategoryId(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-full)',
                background: type === t ? (t === 'expense' ? 'hsl(var(--color-expense))' : 'hsl(var(--color-income))') : 'transparent',
                color: type === t ? 'white' : 'hsl(var(--color-text-muted))',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Amount Input */}
        <div>
          <label style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input-field" // Using global utility
            style={{ fontSize: '2rem', textAlign: 'center', fontWeight: 700, color: type === 'expense' ? 'hsl(var(--color-expense))' : 'hsl(var(--color-income))' }}
            autoFocus
          />
        </div>

        {/* Category Grid */}
        <div>
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <label style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.9rem' }}>Category</label>
            {isAddingCategory && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(false);
                  setEditingCategoryId(null);
                  setNewCatName('');
                  setNewCatIcon('');
                }}
                style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}
              >
                Cancel
              </button>
            )}
          </div>

          {isAddingCategory ? (
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>
                {editingCategoryId ? 'Edit Category' : 'New Category'}
              </div>

              {/* Icon Picker */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginBottom: '8px', display: 'block' }}>Select Icon</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '8px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  padding: '4px'
                }}>
                  {PRESET_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCatIcon(icon)}
                      style={{
                        fontSize: '1.5rem',
                        padding: '8px',
                        borderRadius: '8px',
                        background: newCatIcon === icon ? 'hsl(var(--color-primary-glow))' : 'hsl(var(--color-surface))',
                        border: newCatIcon === icon ? '1px solid hsl(var(--color-primary))' : '1px solid transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginBottom: '8px', display: 'block' }}>Category Name</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    fontSize: '2rem',
                    background: 'hsl(var(--color-bg))',
                    borderRadius: '8px',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {newCatIcon || '?'}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Rent"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="input-field"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveCategory}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {editingCategoryId ? 'Update Category' : 'Add Category'}
              </button>

              {editingCategoryId && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteCategory(e, editingCategoryId)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    color: 'hsl(var(--color-expense))',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid hsl(var(--color-expense))',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}
                >
                  Delete Category
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setHoveredCategoryId(cat.id)}
                  onMouseLeave={() => setHoveredCategoryId(null)}
                >
                  <button
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className="flex-col flex-center"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: categoryId === cat.id ? 'hsl(var(--color-primary-glow))' : 'hsl(var(--color-surface))',
                      border: categoryId === cat.id ? '1px solid hsl(var(--color-primary))' : '1px solid transparent',
                      transition: 'all 0.2s',
                      gap: '8px'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem' }}>{cat.icon}</div>
                    <div style={{ fontSize: '0.75rem', color: categoryId === cat.id ? 'white' : 'hsl(var(--color-text-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{cat.name}</div>
                  </button>

                  {isCustomCategory(cat.id) && (hoveredCategoryId === cat.id || categoryId === cat.id) && (
                    <div
                      onClick={(e) => handleEditCategory(e, cat)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: 'hsl(var(--color-primary))',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 10,
                        cursor: 'pointer',
                        opacity: 0.9
                      }}
                      title="Edit Category"
                    >
                      ✎
                    </div>
                  )}
                </div>
              ))}

                {/* Add New Category Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(null);
                    setNewCatName('');
                    setNewCatIcon('');
                    setIsAddingCategory(true);
                  }}
                  className="flex-col flex-center"
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'hsl(var(--color-surface))',
                    border: '2px dashed hsl(var(--color-text-muted))',
                    opacity: 0.6,
                    transition: 'all 0.2s',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>➕</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>New</div>
                </button>
              </div>
          )}
        </div>

        {/* Date & Note */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className="input-field"
          />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '12px', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Transaction' : 'Save Transaction')}
        </button>

        {initialData && (
          <div style={{ marginTop: '8px' }}>
            {!isDeleteConfirming ? (
              <button
                type="button"
                onClick={() => setIsDeleteConfirming(true)}
                disabled={isSubmitting}
                style={{
                  padding: '12px',
                  color: 'hsl(var(--color-expense))',
                  fontWeight: 600,
                  width: '100%',
                  opacity: isSubmitting ? 0.5 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  background: 'transparent',
                  border: '1px solid hsl(var(--color-expense))',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                Delete Transaction
              </button>
            ) : (
              <div className="animate-fade-in" style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ textAlign: 'center', color: 'hsl(var(--color-expense))', fontWeight: 600 }}>
                  Are you sure?
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirming(false)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      color: 'hsl(var(--color-text-muted))',
                      background: 'transparent',
                      border: '1px solid hsl(var(--color-border))',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: '8px',
                      color: 'white',
                      background: 'hsl(var(--color-expense))',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSubmitting ? 'Deleting...' : 'Confirm'}
                    </button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default TransactionForm;
