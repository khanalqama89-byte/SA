import React, { useEffect } from 'react';
import { ShieldCheck, Lock, Cookie, Eye, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy — Aalq Converter';
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
            <ShieldCheck size={16} />
            <span>Privacy & Data Protection</span>
          </div>
          <h1 className="sa-title-hero" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.95rem' }}>
            Last updated: October 2026 • Official Privacy Policy of Aalq Converter (aalqconverter.shop)
          </p>
        </div>

        <div className="sa-card" style={{ padding: '2.5rem', lineHeight: 1.7, fontSize: '0.95rem', color: '#334155' }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              1. Document Security & Zero Data Retention
            </h2>
            <p>
              At <strong>Aalq Converter</strong> (accessible at <a href="https://aalqconverter.shop" style={{ color: 'var(--primary)', fontWeight: 600 }}>aalqconverter.shop</a>), our top priority is the security and confidentiality of your documents.
            </p>
            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Temporary Storage:</strong> Files you upload are processed securely in temporary server memory and isolated scratch storage solely to perform your requested conversion.</li>
              <li><strong>Automatic Purge:</strong> Uploaded and converted files are permanently deleted automatically within 24 hours. We never read, view, parse, copy, or share your document contents.</li>
              <li><strong>Encryption:</strong> All transmissions between your browser and our servers are encrypted via industry-standard SSL (HTTPS).</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              2. Google AdSense & Third-Party Advertising
            </h2>
            <p>
              Aalq Converter uses Google AdSense and third-party advertising partners to serve advertisements when you visit our website. These companies may use cookies, web beacons, and similar tracking technologies to serve ads based on your visits to this and other websites on the Internet:
            </p>
            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>DoubleClick DART Cookie:</strong> Google, as a third-party vendor, uses DART cookies to serve ads to users based on their visits to our site and other sites on the Internet.</li>
              <li><strong>Opting Out:</strong> Users may opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Google Ads Settings</a> or <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>aboutads.info</a>.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              3. Cookies and Analytics
            </h2>
            <p>
              Aalq Converter uses standard technical cookies to maintain user session state and improve website performance. We do not sell, rent, or trade your personal information to third parties.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              4. Contacting Us
            </h2>
            <p>
              If you have any questions regarding this Privacy Policy or file protection practices, you can contact us at: <a href="mailto:support@aalqconverter.shop" style={{ color: 'var(--primary)', fontWeight: 600 }}>support@aalqconverter.shop</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
