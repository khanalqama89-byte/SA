import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ProgressBar({ progress = 0, statusText = 'Processing...', error = false }) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {!error && clamped < 100 && (
            <Loader2 size={18} className="sa-animate-spin" color="var(--primary)" />
          )}
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: error ? 'var(--danger)' : 'var(--text-main)' }}>
            {statusText}
          </span>
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: error ? 'var(--danger)' : 'var(--primary)' }}>
          {clamped}%
        </span>
      </div>

      <div style={{
        width: '100%',
        height: '10px',
        background: '#e2e8f0',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden'
      }}>
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background: error
              ? 'var(--danger)'
              : 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.3s ease'
          }}
        />
      </div>
    </div>
  );
}
