import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Contact Support — Aalq Converter';
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="sa-page" style={{ padding: '3rem 1rem 5rem' }}>
      <div className="sa-container" style={{ maxWidth: '680px' }}>
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
            <Mail size={16} />
            <span>Support & Feedback</span>
          </div>
          <h1 className="sa-title-hero" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            Contact Us
          </h1>
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.95rem' }}>
            Have a question, feedback, or need help with a conversion? We are here for you.
          </p>
        </div>

        <div className="sa-card" style={{ padding: '2.5rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Message Sent Successfully!
              </h3>
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto' }}>
                Thank you for contacting Aalq Converter. Our support team will review your message and reply via email within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="sa-label">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="sa-input"
                  style={{ width: '100%', padding: '0.75rem 1rem' }}
                />
              </div>

              <div>
                <label className="sa-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="sa-input"
                  style={{ width: '100%', padding: '0.75rem 1rem' }}
                />
              </div>

              <div>
                <label className="sa-label">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we help you?"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="sa-input"
                  style={{ width: '100%', padding: '0.75rem 1rem', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className="sa-btn sa-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
              >
                <Send size={18} />
                <span>Send Message</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Direct support: <strong style={{ color: '#0f172a' }}>support@aalqconverter.shop</strong>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
