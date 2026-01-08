import React from 'react';
import { useSettings } from '../context/SettingsContext';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { autoCreateCategories, setAutoCreateCategories } = useSettings();

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
        gap: '24px' 
      }}>
        <div className="flex-between">
          <h3>Settings</h3>
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

        <div className="flex-col" style={{ gap: '16px' }}>
          
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

        </div>

        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', textAlign: 'center', marginTop: '16px' }}>
          Snap Ledger v1.0
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
