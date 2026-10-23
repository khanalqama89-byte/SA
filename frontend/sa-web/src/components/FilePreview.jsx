import React from 'react';
import { formatBytes } from '../utils/formatters';
import { FileText, X } from 'lucide-react';

export default function FilePreview({ file, onRemove, disabled = false }) {
  if (!file) return null;

  const ext = file.name.split('.').pop().toUpperCase();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          flexShrink: 0
        }}>
          <FileText size={24} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontWeight: 600,
            fontSize: '1rem',
            color: 'var(--text-main)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {file.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {formatBytes(file.size)}
            </span>
            <span className="sa-badge sa-badge-primary">
              {ext}
            </span>
          </div>
        </div>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          disabled={disabled}
          className="sa-btn sa-btn-secondary sa-btn-sm"
          style={{
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            padding: 0,
            flexShrink: 0
          }}
          title="Remove selected file"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
