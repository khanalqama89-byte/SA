import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function FileUploader({
  acceptedFormat = '*',
  toolName = 'Document',
  onFileSelected,
  disabled = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const getCompatibleExtensions = (fmt) => {
    if (!fmt || fmt === '*') return [];
    const clean = fmt.toLowerCase().replace(/^\./, '').trim();
    if (clean === 'docx' || clean === 'doc') return ['docx', 'doc'];
    if (clean === 'jpg' || clean === 'jpeg') return ['jpg', 'jpeg'];
    if (clean === 'png') return ['png'];
    if (clean === 'pdf') return ['pdf'];
    if (clean === 'txt' || clean === 'text') return ['txt', 'text'];
    if (clean === 'html' || clean === 'htm') return ['html', 'htm'];
    return [clean];
  };

  const getAcceptAttribute = (fmt) => {
    if (!fmt || fmt === '*') return undefined;
    const compatible = getCompatibleExtensions(fmt);
    return compatible.map(ext => `.${ext}`).join(',');
  };

  const validateAndProcess = (file) => {
    setError(null);

    // Max 50 MB check
    if (file.size > 50 * 1024 * 1024) {
      setError('File exceeds maximum upload limit of 50 MB.');
      return;
    }

    if (file.size === 0) {
      setError('Selected file is empty.');
      return;
    }

    // Check extension if specific format required
    if (acceptedFormat !== '*' && acceptedFormat) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const compatible = getCompatibleExtensions(acceptedFormat);
      if (compatible.length > 0 && !compatible.includes(ext)) {
        setError(`Please select a valid .${(acceptedFormat || 'DOCUMENT').toUpperCase()} document.`);
        return;
      }
    }

    onFileSelected(file);
  };

  return (
    <div>
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.95rem 1.35rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--danger-light)',
          color: 'var(--danger)',
          marginBottom: '1.5rem',
          fontSize: '0.92rem',
          fontWeight: 600,
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Luxury Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`sa-dropzone ${isDragging ? 'dragging' : ''}`}
        style={{
          boxShadow: isDragging
            ? '0 20px 40px -10px rgba(6, 182, 212, 0.3)'
            : '0 8px 30px -6px rgba(0, 0, 0, 0.05)',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptAttribute(acceptedFormat)}
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        {/* Floating Animated Cloud Icon */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '88px',
          height: '88px',
          borderRadius: '26px',
          background: isDragging
            ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
            : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          boxShadow: isDragging
            ? '0 12px 28px rgba(6, 182, 212, 0.4)'
            : '0 12px 28px var(--primary-glow)',
          marginBottom: '1.75rem',
          transition: 'var(--transition)'
        }}>
          <UploadCloud size={44} className={isDragging ? 'sa-animate-pulse' : 'sa-animate-float'} />
        </div>

        {/* Main Prompt */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
          fontWeight: 800,
          color: 'var(--text-main)',
          marginBottom: '0.65rem',
          letterSpacing: '-0.02em'
        }}>
          {isDragging ? 'Release to upload your document' : `Choose a ${acceptedFormat !== '*' ? acceptedFormat.toUpperCase() : 'document'} or drop it here`}
        </h2>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1rem',
          marginBottom: '2rem',
          maxWidth: '500px',
          margin: '0 auto 2rem'
        }}>
          Click anywhere to browse from your device or drop files directly. Fast, private, and 100% free.
        </p>

        {/* Primary Action Button */}
        <div style={{ display: 'inline-block', marginBottom: '1.75rem' }}>
          <button
            type="button"
            className="sa-btn sa-btn-primary sa-btn-lg"
            style={{
              pointerEvents: 'none',
              boxShadow: '0 8px 24px var(--primary-glow)'
            }}
          >
            <Sparkles size={18} />
            Browse from Device
          </button>
        </div>

        {/* Format & Privacy Badges */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.82rem',
          color: 'var(--text-subtle)',
          fontWeight: 600
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={15} color="#10b981" />
            Max file size: 50 MB
          </span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={15} color="#10b981" />
            Zero-Loss 1:1 Layout
          </span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={15} color="#10b981" />
            Auto-deleted in 24h
          </span>
        </div>
      </div>
    </div>
  );
}
