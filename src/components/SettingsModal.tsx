import React, { useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useLedger } from '../context/LedgerContext';


import type { BackupData } from '../types';
import pkg from '../../package.json';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { autoCreateCategories, setAutoCreateCategories } = useSettings();
  const { transactions, categories, importData } = useLedger();


  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error' | 'loading', msg: string }>({ type: 'idle', msg: '' });

  const handleExport = () => {
    try {
      const backup: BackupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        transactions: transactions,
        categories: categories
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snap_ledger_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({ type: 'success', msg: 'Backup downloaded successfully.' });
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', msg: 'Failed to generate backup.' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus({ type: 'loading', msg: 'Importing...' });

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      if (!Array.isArray(data.transactions)) {
        throw new Error("Invalid file format: transactions missing.");
      }

      await importData(data);
      setStatus({ type: 'success', msg: `Import successful! Merged ${data.transactions.length} transactions.` });
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Failed to import file.";
      setStatus({ type: 'error', msg: message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
    >
      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '24px',
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px',
        maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        <div className="flex-between">
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Settings</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.2rem', 
              cursor: 'pointer',
              color: 'hsl(var(--color-text-muted))'
            }}
          >
            ✕
          </button>
        </div>

        <div className="flex-col" style={{ gap: '20px' }}>
          
          {/* AI Settings Section */}
          <section>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--color-text-muted))', marginBottom: '12px' }}>
              Automation
            </h3>
            <div className="flex-between" style={{ padding: '8px 0' }}>
              <div className="flex-col" style={{ gap: '4px' }}>
                <span style={{ fontWeight: 500 }}>AI Auto-Create Categories</span>
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                  Allow AI to create new categories automatically
                </span>
              </div>

              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={autoCreateCategories}
                  onChange={(e) => setAutoCreateCategories(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider round" style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: autoCreateCategories ? 'hsl(var(--color-primary))' : '#ccc',
                  transition: '.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: autoCreateCategories ? '26px' : '4px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%'
                  }}></span>
                </span>
              </label>
            </div>
          </section>

          {/* Data Management Section */}
          <section style={{
            background: 'hsl(var(--color-bg-subtle))',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid hsl(var(--color-border))'
          }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--color-text-muted))', marginBottom: '16px' }}>
              Data Backup
            </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={handleExport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--color-border))',
                    background: 'hsl(var(--color-surface))',
                    cursor: 'pointer',
                    color: 'hsl(var(--color-text-main))',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  <span>📥</span> Export
                </button>

                <button
                  onClick={handleImportClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--color-border))',
                    background: 'hsl(var(--color-surface))',
                    cursor: 'pointer',
                    color: 'hsl(var(--color-text-main))',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  <span>📤</span> Import
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  style={{ display: 'none' }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginTop: '12px', lineHeight: 1.4 }}>
                Save your data locally to prevent loss when clearing browser cache.
              </p>

              {status.msg && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: status.type === 'error' ? '#ef4444' : '#22c55e',
                  border: `1px solid ${status.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                }}>
                  {status.msg}
                </div>
              )}
          </section>

        </div>

        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', textAlign: 'center', marginTop: '8px' }}>
          Snap Ledger v{pkg.version}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
