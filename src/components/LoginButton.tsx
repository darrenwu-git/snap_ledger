import React from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginButton: React.FC = () => {
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
          className="flex items-center gap-2" 
          style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            backdropFilter: 'blur(8px)',
            padding: '4px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            cursor: 'pointer'
          }}
        >
          {user.user_metadata.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="User" 
                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
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
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid hsl(var(--color-border))',
              marginBottom: '4px',
              fontSize: '0.75rem',
              color: 'hsl(var(--color-text-muted))',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.9rem' }}>☁️</span>
              <span>Cloud Sync Active</span>
            </div>
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
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      style={{
        display: 'flex',
        alignItems: 'center', 
        gap: '8px',
        background: '#fff',
        color: '#3c4043',
        border: '1px solid #dadce0',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease'
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      Sign in
    </button>
  );
};
