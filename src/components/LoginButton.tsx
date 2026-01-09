import React from 'react';
import { useAuth } from '../context/AuthContext';
import pkg from '../../package.json';

interface LoginButtonProps {
  onOpenSettings?: () => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ onOpenSettings }) => {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [showInviteInput, setShowInviteInput] = React.useState(false);
  const [inviteCode, setInviteCode] = React.useState('');
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Invite Input handles...
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const VALID_CODE = import.meta.env.VITE_INVITE_CODE || 'snap2026'; // Fallback
    if (inviteCode.toLowerCase().trim() === VALID_CODE) {
      signInWithGoogle();
      setShowInviteInput(false);
      setInviteCode('');
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="user-menu-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {/* Invite Input Overlay */}
      {showInviteInput && (
        <div style={{
          position: 'absolute',
          top: '120%',
          right: 0,
          background: 'hsl(var(--color-surface))',
          border: '1px solid hsl(var(--color-border))',
          padding: '12px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          minWidth: '220px',
          animation: 'fade-in 0.2s ease-out'
        }}>
          <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--color-text-muted))' }}>
              Invitation Code
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                autoFocus
                type="password"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value);
                  setError(false);
                }}
                placeholder="Enter code..."
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: error ? '1px solid #ef4444' : '1px solid hsl(var(--color-border))',
                  background: 'hsl(var(--color-bg-subtle))',
                  color: 'hsl(var(--color-text-main))',
                  fontSize: '0.9rem',
                  outline: 'none',
                  width: '120px'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'hsl(var(--color-primary))',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0 10px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                →
              </button>
            </div>
            {error && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Invalid code</span>}
          </form>
          {/* Close overlay */}
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
            onClick={() => setShowInviteInput(false)}
          />
        </div>
      )}

      {/* Main Trigger (Avatar or User Icon) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex-center" 
        title={user ? user.email || 'User' : 'Guest Menu'}
        style={{ 
          background: user ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
          backdropFilter: user ? 'blur(8px)' : 'none',
          padding: user ? '4px' : '8px',
          borderRadius: '50%',
          border: user ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
          cursor: 'pointer',
          width: user ? '42px' : 'auto',
          height: user ? '42px' : 'auto',
          transition: 'background 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          if (!user) e.currentTarget.style.background = 'hsl(var(--color-bg-subtle))';
        }}
        onMouseLeave={(e) => {
          if (!user) e.currentTarget.style.background = 'transparent';
        }}
      >
        {user ? (
          user.user_metadata.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="User" 
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
          )
        ) : (
          /* Guest Icon (Simple User) */
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '52px',
          right: 0,
          background: 'hsl(var(--color-surface))',
          border: '1px solid hsl(var(--color-border))',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          minWidth: '180px',
          animation: 'fade-in 0.1s ease-out'
        }}>
          {onOpenSettings && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: 'hsl(var(--color-text-main))',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--color-bg-subtle))'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span>⚙️</span>
              Settings
            </button>
          )}

          {user ? (
            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: 'hsl(var(--color-text-main))',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--color-bg-subtle))'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                setShowInviteInput(true);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: 'hsl(var(--color-text-main))',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--color-bg-subtle))'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Access Cloud Mode
            </button>
          )}

          <div style={{
            borderTop: '1px solid hsl(var(--color-border))',
            marginTop: '4px',
            paddingTop: '8px',
            paddingBottom: '4px',
            textAlign: 'center',
            fontSize: '0.7rem',
            color: 'hsl(var(--color-text-muted))',
            letterSpacing: '0.05em',
            opacity: 0.7
          }}>
            v{pkg.version}
          </div>
        </div>
      )}
    </div>
  );
};
