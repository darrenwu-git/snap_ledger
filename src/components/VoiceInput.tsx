import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface VoiceInputProps {
  onResult: (audioBlob: Blob) => void;
  isProcessing?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null); // To keep track of the stream for stopping tracks

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; // Store the stream
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onResult(blob);

        // Stop all tracks to release microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null; // Clear the stream reference
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup effect to stop recording if component unmounts while listening
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <>
      <button
        onClick={toggleListening}
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: isListening ? 'hsl(var(--color-expense))' : (isProcessing ? 'hsl(var(--color-primary))' : 'hsl(var(--color-surface))'),
          color: (isListening || isProcessing) ? 'white' : 'hsl(var(--color-text-main))',
          border: '1px solid hsl(var(--color-border))',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          cursor: 'pointer',
          position: 'relative',
        }}
        title="Voice Input"
      >
        {isProcessing ? (
          <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <img 
            src="/voice_ledger_icon_v3.png" 
            alt="Voice Input" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              borderRadius: '50%' 
            }} 
          />
        )}

        {isListening && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: '12px',
            height: '12px',
            background: 'red',
            borderRadius: '50%',
            border: '2px solid white'
          }} />
        )}
      </button>

      {isListening && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9999, // High z-index to cover everything
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(2px)',
          cursor: 'pointer'
        }} onClick={toggleListening}>
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'hsl(var(--color-text-main))' }}>Say your expense...</p>
          </div>
        </div>,
        document.body
      )}

      {error && (
        <div className="animate-fade-in" style={{
          position: 'fixed',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'hsl(var(--color-expense))',
          color: 'white',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.875rem',
          zIndex: 100,
          whiteSpace: 'nowrap'
        }}>
          {error}
        </div>
      )}
    </>
  );
};

export default VoiceInput;
