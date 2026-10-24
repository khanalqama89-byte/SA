import React, { useRef } from 'react';
import { formatBytes } from '../utils/formatters';
import { FileText, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';

export default function FileSelectedHeader({ file, onReplace, onRemove, disabled = false }) {
  const replaceInputRef = useRef(null);

  if (!file) return null;

  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onReplace) onReplace(e.target.files[0]);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#ffffff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1rem 1.35rem',
      boxShadow: 'var(--shadow-sm)',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <input
        ref={replaceInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <FileText size={22} />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: '0.98rem',
            color: 'var(--text-main)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '380px'
          }}>
            {file.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {formatBytes(file.size)}
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-light)',
              color: 'var(--primary)'
            }}>
              {ext}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.78rem',
              color: 'var(--success)',
              fontWeight: 700
            }}>
              <CheckCircle2 size={13} />
              Ready to convert
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => replaceInputRef.current?.click()}
          disabled={disabled}
          className="sa-btn sa-btn-secondary sa-btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
          title="Choose a different file"
        >
          <RefreshCw size={14} />
          <span>Replace</span>
        </button>

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="sa-btn sa-btn-secondary sa-btn-sm"
          style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
          title="Remove file"
        >
          <Trash2 size={14} />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
}
