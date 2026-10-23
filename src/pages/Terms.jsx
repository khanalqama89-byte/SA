import React, { useEffect } from 'react';
import { FileText, Shield, AlertCircle } from 'lucide-react';

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms of Service — Aalq Converter';
  }, []);

  return (
    <div className="sa-page" style={{ padding: '3rem 1rem 5rem' }}>
      <div className="sa-container" style={{ maxWidth: '820px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(79, 70, 229, 0.08)',
            border: '1px solid rgba(79, 70, 229, 0.18)',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            <FileText size={16} />
            <span>Legal Agreement</span>
          </div>
          <h1 className="sa-title-hero" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            Terms of Service
          </h1>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.95rem' }}>
            Last updated: October 2026 • Aalq Converter (aalqconverter.shop)
          </p>
        </div>

        <div className="sa-card" style={{ padding: '2.5rem', lineHeight: 1.7, fontSize: '0.95rem', color: '#334155' }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using <strong>Aalq Converter</strong> (aalqconverter.shop), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use our services.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              2. Permitted Use & User Content
            </h2>
            <p>
              You may use Aalq Converter for lawful personal, academic, and business file conversion purposes. You agree not to upload files containing malicious software, copyrighted materials for which you do not possess the necessary distribution rights, or illegal content.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              3. Service Availability and Disclaimers
            </h2>
            <p>
              Our conversion tools are provided on an "as is" and "as available" basis without warranties of any kind. While we strive for 100% layout preservation and high uptime, Aalq Converter is not liable for data loss or discrepancies resulting from complex document formatting.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              4. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the platform following any modifications constitutes your acceptance of the new terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
