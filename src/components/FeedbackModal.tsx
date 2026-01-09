import React, { useState } from 'react';
import { submitFeedback } from '../lib/analytics';

interface FeedbackModalProps {
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [type, setType] = useState<'bug' | 'feature' | 'like' | 'other'>('feature');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('submitting');
    try {
      await submitFeedback(type, message, email);
      setStatus('success');
      setTimeout(onClose, 2000);
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="glass-panel animate-fade-in" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
        <h3 style={{ marginBottom: '8px' }}>Thank you!</h3>
        <p style={{ color: 'hsl(var(--color-text-muted))' }}>Your feedback helps us improve.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Send Feedback</h2>
        <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'hsl(var(--color-text-muted))' }}>×</button>
      </div>

      <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '16px' }}>
        {/* Type Selection */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'bug', label: '🐛 Bug', color: '#ef4444' },
            { id: 'feature', label: '💡 Feature', color: '#eab308' },
            { id: 'like', label: '❤️ Like', color: '#ec4899' },
            { id: 'other', label: '📝 Other', color: '#64748b' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id as any)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: type === t.id ? `1px solid ${t.color}` : '1px solid hsl(var(--color-border))',
                background: type === t.id ? `${t.color}20` : 'transparent',
                color: type === t.id ? t.color : 'hsl(var(--color-text-muted))',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Message */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginBottom: '6px' }}>
            What's on your mind?
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you like or what we should improve..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--color-border))',
              background: 'hsl(var(--color-bg-subtle))',
              color: 'hsl(var(--color-text-main))',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            required
            autoFocus
          />
        </div>

        {/* Email (Optional) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginBottom: '6px' }}>
            Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="If you'd like a reply..."
            className="input-field"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting' || !message.trim()}
          className="btn-primary"
          style={{ marginTop: '8px' }}
        >
          {status === 'submitting' ? 'Sending...' : 'Send Feedback'}
        </button>

        {status === 'error' && (
          <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
            Failed to send feedback. Please try again.
          </p>
        )}
      </form>
    </div>
  );
};

export default FeedbackModal;
