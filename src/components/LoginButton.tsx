import React from 'react';
import { useAuth } from '../context/AuthContext';
import pkg from '../../package.json';

interface LoginButtonProps {
  onOpenSettings?: () => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ onOpenSettings }) => {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

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

  if (user) {
    return (
      <div className="user-menu-container" style={{ position: 'relative' }}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex-center" 
          style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            backdropFilter: 'blur(8px)',
            padding: '4px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            width: '42px',
            height: '42px'
          }}
        >
          {user.user_metadata.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="User" 
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
          ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
          )}
        </div>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            background: 'hsl(var(--color-surface))',
            border: '1px solid hsl(var(--color-border))',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            minWidth: '180px'
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
  }

  return (
    <div className="flex items-center gap-2">
      {/* If not logged in, we might still want settings? 
           For now, the user request specifically asked to move it to the avatar dropdown, which implies logged-in state.
           However, if logged out, the avatar is replaced by "Sign In".
           If we want settings to be available when logged out, we should keep a separate button or add a menu for guests.
           Given "Cloud Sync Active" context, let's assume this is primarily for logged-in users or we can add a simple gear next to Sign In if needed. 
           But the prompt says "put the gear icon inside the avatar dropdown". 
           So let's stick to that.
       */}
      <button
        onClick={signInWithGoogle}
        style={{
          background: 'none',
          border: 'none',
          color: 'hsl(var(--color-text-muted))',
          fontWeight: 500,
          cursor: 'pointer',
          padding: '8px 16px',
          fontSize: '0.95rem',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--color-text-main))'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--color-text-muted))'}
      >
        Log in
      </button>
      <button
        onClick={signInWithGoogle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'hsl(var(--color-primary))',
          color: 'white',
          border: 'none',
          padding: '8px 20px',
          borderRadius: '20px',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        Sign Up
      </button>
    </div>
  );
};
