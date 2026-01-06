import React, { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import type { Transaction, TransactionType } from '../types';

interface TransactionFormProps {
  onClose: () => void;
  initialData?: Transaction;
  defaultValues?: Partial<Transaction>;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, initialData, defaultValues }) => {
  const { addTransaction, updateTransaction, deleteTransaction, categories } = useLedger();
  const [type, setType] = useState<TransactionType>(initialData?.type || defaultValues?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || defaultValues?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || defaultValues?.categoryId || '');
  const [note, setNote] = useState(initialData?.note || defaultValues?.note || '');
  const [date, setDate] = useState(initialData?.date || defaultValues?.date || new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    const transactionData = {
      amount: parseFloat(amount),
      type,
      categoryId,
      date,
      note,
      status: 'completed' as const, // Explicitly set status to completed on save
    };

    if (initialData) {
      updateTransaction(initialData.id, transactionData);
    } else {
      addTransaction(transactionData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (initialData) {
      deleteTransaction(initialData.id);
      onClose();
    }
  };

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
          <label style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Category</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className="flex-col flex-center"
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: categoryId === cat.id ? 'hsl(var(--color-primary-glow))' : 'hsl(var(--color-surface))',
                  border: categoryId === cat.id ? '1px solid hsl(var(--color-primary))' : '1px solid transparent',
                  transition: 'all 0.2s',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>{cat.icon}</div>
                <div style={{ fontSize: '0.75rem', color: categoryId === cat.id ? 'white' : 'hsl(var(--color-text-muted))' }}>{cat.name}</div>
              </button>
            ))}
          </div>
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

        <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
          {initialData ? 'Update Transaction' : 'Save Transaction'}
        </button>

        {initialData && (
          <button
            type="button"
            onClick={handleDelete}
            style={{
              marginTop: '8px',
              padding: '12px',
              color: 'hsl(var(--color-expense))',
              fontWeight: 600,
              width: '100%'
            }}
          >
            Delete Transaction
          </button>
        )}
      </form>
    </div>
  );
};

export default TransactionForm;
