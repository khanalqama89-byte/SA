import React, { useState } from 'react';
import { formatBytes } from '../utils/formatters';
import {
  Download,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Copy,
  Check,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DocumentPreview from './DocumentPreview';

export default function ConversionResult({
  jobId,
  originalFileName,
  originalSize,
  outputFileName = 'converted_document',
  targetFormat = 'pdf',
  fileSize,
  fileBase64,
  mimeType,
  onDownload,
  onReset
}) {
  const [copied, setCopied] = useState(false);

  // Guarantee proper extension
  const getSafeFileName = () => {
    let name = outputFileName || 'converted_document';
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
    if (onDownload) {
      e.preventDefault();
      onDownload();
    }
  };

  const handleCopyText = () => {
    if (!fileBase64) return;
    try {
      const text = atob(fileBase64);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const isTextOutput = targetFormat === 'txt' || (mimeType && mimeType.includes('text/plain'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Result Status Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        boxShadow: '0 20px 40px -15px rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)'
        }}>
          <CheckCircle2 size={40} />
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--success-light)',
          color: 'var(--success)',
          fontSize: '0.82rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.85rem'
        }}>
          <Sparkles size={14} />
          <span>Conversion Successful</span>
        </div>

        <h2 style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
          fontWeight: 800,
          color: 'var(--text-main)',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-display)'
        }}>
          Your {targetFormat.toUpperCase()} document is ready!
        </h2>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-muted)',
          maxWidth: '560px',
          margin: '0 auto 2rem',
          lineHeight: 1.55
        }}>
          The document has been formatted and finished with high fidelity. You can inspect the preview below or download it immediately.
        </p>

        {/* Primary Download CTA */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.85rem',
          maxWidth: '420px',
          margin: '0 auto'
        }}>
          <a
            href={downloadHref}
            download={safeFileName}
            onClick={handleDownloadClick}
            className="sa-btn sa-btn-success sa-btn-lg"
            style={{
              width: '100%',
              fontSize: '1.1rem',
              fontWeight: 800,
              textDecoration: 'none',
              padding: '1.1rem 1.75rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Download size={22} />
            <span>Download {targetFormat.toUpperCase()} File ({formatBytes(fileSize || 0)})</span>
          </a>

          {isTextOutput && (
            <button
              onClick={handleCopyText}
              className="sa-btn sa-btn-secondary"
              style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {copied ? <Check size={18} color="var(--success)" /> : <Copy size={18} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Extracted Text'}</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="sa-btn sa-btn-secondary"
            style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} />
            <span>Convert Another File</span>
          </button>
        </div>
      </div>

      {/* Document Details Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
          File Summary
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Original File
            </span>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.2rem', wordBreak: 'break-all' }}>
              {originalFileName || 'Uploaded Document'}
            </div>
            {originalSize && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {formatBytes(originalSize)}
              </span>
            )}
          </div>

          <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Converted File
            </span>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.2rem', wordBreak: 'break-all' }}>
              {safeFileName}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {formatBytes(fileSize || 0)}
            </span>
          </div>

          <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Output Format
            </span>
            <div style={{ marginTop: '0.35rem' }}>
              <span className="sa-badge sa-badge-primary" style={{ fontSize: '0.85rem', padding: '0.25rem 0.65rem' }}>
                {targetFormat.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Status
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', color: 'var(--success)', fontWeight: 700, fontSize: '0.92rem' }}>
              <CheckCircle2 size={16} />
              <span>Ready for download</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Result Preview */}
      {fileBase64 && (
        <DocumentPreview
          file={{ name: safeFileName, size: fileSize || 0 }}
          fileBase64={fileBase64}
          mimeType={mimeType}
          isOutput={true}
        />
      )}

      {/* Security note & Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem',
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={18} color="var(--success)" />
          <span>Files are automatically deleted from server memory within 24 hours.</span>
        </div>

        <Link
          to="/tools"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--primary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            textDecoration: 'none'
          }}
        >
          <span>Explore All 15 Tools</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
