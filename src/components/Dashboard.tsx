import React, { useState, useEffect } from 'react';
import { useLedger } from '../context/LedgerContext';
import { useSettings } from '../context/SettingsContext';
import MonthlySummary from './MonthlySummary';
import TransactionForm from './TransactionForm';
import VoiceInput from './VoiceInput';
import { parseVoiceInput } from '../services/VoiceParser';
import { LoginButton } from './LoginButton';
import type { Transaction } from '../types';





const Dashboard: React.FC = () => {
  const { transactions, categories, getCategory, addTransaction } = useLedger(); // Need addTransaction here
  const { apiKey } = useSettings();
  const [isAdding, setIsAdding] = useState(false);


  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [voiceDraft, setVoiceDraft] = useState<Partial<Transaction> | undefined>(undefined);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Group by date
  // Sort descending by date
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const pendingTransactions = sortedTransactions.filter(t => t.status === 'draft');
  const completedTransactions = sortedTransactions.filter(t => t.status !== 'draft');

  // Voice Input Handler
  const handleVoiceResult = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    setToast(null);

    try {
      const result = await parseVoiceInput(audioBlob, categories, apiKey);

      if (result.type === 'transaction') {
        const txData = result.data;
        // CONFIDENCE CHECK: If high confidence (>= 0.9) AND has category, AUTO-SAVE
        if ((txData.confidence || 0) >= 0.9 && txData.categoryId && txData.amount) {
          addTransaction({
            amount: txData.amount,
            categoryId: txData.categoryId,
            type: txData.type || 'expense',
            date: txData.date || new Date().toISOString().split('T')[0],
            note: txData.note || '',
            status: 'completed'
          } as any);
          setToast({ message: "Saved!", type: 'success' });
        } else {
          // Low confidence or missing info -> Open Edit Modal
          setIsAdding(true);
          setVoiceDraft(txData);
          setToast({ message: "Please review details", type: 'info' });
        }
      } else if (result.type === 'uncategorized') {
        setToast({ message: "I heard you, but need help categorizing.", type: 'info' });
        setIsAdding(true);
        setVoiceDraft(result.data);
      } else if (result.type === 'non_accounting') {
        setToast({ message: result.message, type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: "Error processing voice input", type: 'error' });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleTransactionClick = (tx: Transaction) => {
    setEditingTransaction(tx);
  };

  const handleModalClose = () => {
    // If we have a voice draft and user is closing WITHOUT saving (since save closes via form),
    // we should save as DRAFT.
    // NOTE: This handler is called when user clicks X or background.
    // TransactionForm's onSubmit handles the actual "Save" completion.

    if (voiceDraft && isAdding) {
      // User cancelled a voice draft -> Save as Draft
      // We need to ensure we have minimal fields.
      if (voiceDraft.amount) {
        addTransaction({
          amount: voiceDraft.amount,
          categoryId: voiceDraft.categoryId || categories[0]?.id || 'unknown',
          type: voiceDraft.type || 'expense',
          date: voiceDraft.date || new Date().toISOString().split('T')[0],
          note: voiceDraft.note || '(Draft)',
          status: 'draft'
        } as any);
        setToast({ message: "Saved to Pending Review", type: 'info' });
      }
    }

    setIsAdding(false);
    setEditingTransaction(null);
    setVoiceDraft(undefined);
    setToast(null);
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <header className="flex-between" style={{ padding: '24px 0' }}>
        <div className="flex-col">
          <h1 className="text-gradient" style={{ fontSize: '1.75rem' }}>Snap Ledger</h1>
          <span style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.9rem' }}>Smart Accounting</span>
        </div>
        <div className="flex items-center gap-3">
          <LoginButton />
        </div>
      </header>

      <MonthlySummary />

      {/* Pending Reviews Section */}
      {pendingTransactions.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: 'hsl(var(--color-primary))' }}>Pending Review ({pendingTransactions.length})</h3>
          <div className="flex-col" style={{ gap: '12px' }}>
            {pendingTransactions.map(tx => (
              <div key={tx.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderLeft: '4px solid hsl(var(--color-primary))'
                }}
                onClick={() => handleTransactionClick(tx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🕒</span>
                  <div className="flex-col">
                    <span style={{ fontWeight: 500 }}>{tx.note || 'Draft Transaction'}</span>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>{tx.date}</span>
                  </div>
                </div>
                <span style={{ fontWeight: 600 }}>${tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3>Recent Transactions</h3>
          <button style={{ color: 'hsl(var(--color-primary))', fontSize: '0.9rem' }}>View All</button>
        </div>

        {completedTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'hsl(var(--color-text-muted))' }}>
            No transactions yet. Start snapping!
          </div>
        ) : (
          <div className="flex-col" style={{ gap: '12px' }}>
            {completedTransactions.slice(0, 5).map(tx => {
              const category = getCategory(tx.categoryId);
              return (
                <div key={tx.id}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleTransactionClick(tx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{category?.icon || '📝'}</span>
                    <div className="flex-col">
                      <span style={{ fontWeight: 500 }}>{category?.name || 'Uncategorized'}</span>
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>{tx.note || tx.date}</span>
                    </div>
                  </div>
                  <span style={{
                    color: tx.type === 'income' ? 'hsl(var(--color-income))' : 'hsl(var(--color-text-main))',
                    fontWeight: 600
                  }}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div style={{ position: 'fixed', bottom: '32px', left: '0', right: '0', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 }}>
        {/* Main Voice Button (Centered) */}
        <div style={{ pointerEvents: 'auto', transform: 'scale(1.1)' }}>
          <VoiceInput onResult={handleVoiceResult} isProcessing={isProcessingVoice} />
        </div>

        {/* Secondary Manual Add (Right) */}
        <button
          onClick={() => {
            setEditingTransaction(null);
            setVoiceDraft(undefined);
            setIsAdding(true);
          }}
          className="btn-secondary"
          style={{
            pointerEvents: 'auto',
            position: 'absolute',
            right: '24px',
            bottom: '8px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            background: 'hsl(var(--color-surface))',
            border: '1px solid hsl(var(--color-border))',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            padding: 0
          }}
        >
          +
        </button>
      </div>



      {/* Toast Notification */}
      {toast && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'hsl(var(--color-surface))',
            color: 'hsl(var(--color-text-main))',
            padding: '12px 24px',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 300,
            border: '1px solid hsl(var(--color-border))',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => setToast(null)}
        >
          <span>{toast.type === 'error' ? '❌' : (toast.type === 'success' ? '✅' : 'ℹ️')}</span> {toast.message}
        </div>
      )}

      {/* Modal for Add or Edit */}
      {
        (isAdding || editingTransaction) && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'end', // Sheet-like animation from bottom
            justifyContent: 'center',
          }}
            onClick={(e) => {
              // Close if clicking background
              if (e.target === e.currentTarget) handleModalClose();
            }}
          >
            <div style={{ width: '100%', maxWidth: '480px' }}>
              <TransactionForm
                onClose={handleModalClose}
                initialData={editingTransaction || undefined}
                defaultValues={voiceDraft}
              />
            </div>
          </div>
        )
      }    </div >
  );
};

export default Dashboard;
