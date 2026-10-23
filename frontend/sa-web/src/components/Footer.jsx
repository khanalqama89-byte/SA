import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, Zap, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: '#0f172a',
      color: '#94a3b8',
      padding: '4rem 0 2rem',
      marginTop: 'auto',
      borderTop: '1px solid #1e293b'
    }}>
      <div className="sa-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: '1.1rem'
              }}>
                SA
              </div>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>
                SA Platform
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              High-performance, secure online document processing suite. Convert, merge, split, compress, and edit documents with absolute privacy.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#10b981' }}>
              <ShieldCheck size={16} />
              <span>Zero data retention: 24h automatic purge</span>
            </div>
          </div>

          {/* Popular PDF Tools */}
          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Popular Tools
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <li><Link to="/pdf-to-word" style={{ color: '#cbd5e1' }}>PDF to Word</Link></li>
              <li><Link to="/word-to-pdf" style={{ color: '#cbd5e1' }}>Word to PDF</Link></li>
              <li><Link to="/merge-pdf" style={{ color: '#cbd5e1' }}>Merge PDF</Link></li>
              <li><Link to="/split-pdf" style={{ color: '#cbd5e1' }}>Split PDF</Link></li>
              <li><Link to="/compress-pdf" style={{ color: '#cbd5e1' }}>Compress PDF</Link></li>
            </ul>
          </div>

          {/* More Converters */}
          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Image & Text
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <li><Link to="/pdf-to-jpg" style={{ color: '#cbd5e1' }}>PDF to JPG</Link></li>
              <li><Link to="/jpg-to-pdf" style={{ color: '#cbd5e1' }}>JPG to PDF</Link></li>
              <li><Link to="/pdf-to-png" style={{ color: '#cbd5e1' }}>PDF to PNG</Link></li>
              <li><Link to="/pdf-to-text" style={{ color: '#cbd5e1' }}>PDF to Text</Link></li>
              <li><Link to="/html-to-pdf" style={{ color: '#cbd5e1' }}>HTML to PDF</Link></li>
            </ul>
          </div>

          {/* Security & Reliability */}
          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Security & Privacy
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <Clock size={18} style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
                <span>Files are automatically removed permanently 24 hours after conversion.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <Zap size={18} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
                <span>Async job queues provide enterprise-grade processing speed.</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          gap: '1rem'
        }}>
          <div>
            © {new Date().getFullYear()} SA Document Converter. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/tools" style={{ color: '#cbd5e1' }}>Tools Directory</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
