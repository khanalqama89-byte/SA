import React from 'react';
import { Download, CheckCircle2, RotateCcw, ShieldCheck, Sparkles, FileText } from 'lucide-react';

export default function DownloadButton({
  jobId,
  fileName = 'converted_document',
  targetFormat = 'pdf',
  onDownload,
  onReset
}) {

  // Guarantee that the filename ALWAYS has the exact correct file extension
  const getSafeFileName = () => {
    let name = fileName || 'converted_document';
    const ext = (targetFormat || 'pdf').toLowerCase().replace(/^\./, '');
    if (!name.toLowerCase().endsWith('.' + ext)) {
      const base = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;
      return `${base}.${ext}`;
    }
    return name;
  };

  const safeFileName = getSafeFileName();
  const downloadHref = jobId
    ? `/api/conversions/${jobId}/download/${encodeURIComponent(safeFileName)}`
    : '#';

  const handleDownloadClick = (e) => {
    if (!jobId) {
      e.preventDefault();
      if (onDownload) onDownload();
    }
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid rgba(16, 185, 129, 0.25)',
      borderRadius: 'var(--radius-xl)',
      padding: '3rem 2rem',
      textAlign: 'center',
      boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Radiant Check Icon */}
      <div style={{
        width: '76px',
        height: '76px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
      }}>
        <CheckCircle2 size={42} />
      </div>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.85rem',
        borderRadius: 'var(--radius-full)',
        background: 'var(--success-light)',
        color: 'var(--success)',
        fontSize: '0.8rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '0.85rem'
      }}>
        <Sparkles size={14} />
        <span>Ready for Download</span>
      </div>

      <h3 style={{
        fontSize: '1.75rem',
        fontWeight: 800,
        color: 'var(--text-main)',
        marginBottom: '0.5rem',
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em'
      }}>
        Conversion Completed!
      </h3>

      <p style={{
        fontSize: '1rem',
        color: 'var(--text-muted)',
        marginBottom: '2rem',
        maxWidth: '500px',
        margin: '0 auto 2rem'
      }}>
        Your file <strong style={{ color: 'var(--text-main)' }}>{safeFileName}</strong> was converted with 1:1 layout fidelity.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', maxWidth: '380px', margin: '0 auto' }}>
        <a
          href={downloadHref}
          download={safeFileName}
          onClick={handleDownloadClick}
          className="sa-btn sa-btn-success sa-btn-lg"
          style={{ width: '100%', fontSize: '1.05rem', fontWeight: 800, textDecoration: 'none' }}
        >
          <Download size={20} />
          Download {targetFormat.toUpperCase()} Document
        </a>

        {onReset && (
          <button
            onClick={onReset}
            className="sa-btn sa-btn-secondary"
            style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}
          >
            <RotateCcw size={16} />
            Convert Another Document
          </button>
        )}
      </div>

      {/* Security & Expiry Note */}
      <div style={{
        marginTop: '2rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid rgba(241, 245, 249, 1)',
        fontSize: '0.82rem',
        color: 'var(--text-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <ShieldCheck size={16} color="var(--success)" />
        <span>Bank-grade encryption • Automatically purged in 24 hours</span>
      </div>
    </div>
  );
}
