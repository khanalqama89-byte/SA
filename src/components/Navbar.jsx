import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles, Layers, ShieldCheck, Zap } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'var(--transition)'
    }}>
      <div className="sa-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px'
      }}>
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={() => {
            setMobileMenuOpen(false);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.25rem',
            boxShadow: '0 4px 16px rgba(79, 70, 229, 0.35)',
            letterSpacing: '-0.02em'
          }}>
            SA
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.35rem',
              letterSpacing: '-0.03em',
              color: '#0f172a',
              lineHeight: 1.1
            }}>
              Aalq<span style={{ color: 'var(--primary)' }}> Converter</span>
            </div>
            <div style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              Universal Document Suite
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '2rem' }} className="sa-desktop-nav">
          <Link
            to="/"
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive('/') ? 'var(--primary)' : 'var(--text-main)',
              transition: 'var(--transition)',
              position: 'relative'
            }}
          >
            Home
            {isActive('/') && (
              <span style={{
                position: 'absolute',
                bottom: '-6px',
                left: '0',
                right: '0',
                height: '2px',
                background: 'var(--primary)',
                borderRadius: '2px'
              }} />
            )}
          </Link>
          <Link
            to="/tools"
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive('/tools') ? 'var(--primary)' : 'var(--text-main)',
              transition: 'var(--transition)',
              position: 'relative'
            }}
          >
            All Tools
            {isActive('/tools') && (
              <span style={{
                position: 'absolute',
                bottom: '-6px',
                left: '0',
                right: '0',
                height: '2px',
                background: 'var(--primary)',
                borderRadius: '2px'
              }} />
            )}
          </Link>
        </nav>

        {/* Desktop Action CTA */}
        <div style={{ display: 'none', alignItems: 'center', gap: '1rem' }} className="sa-desktop-auth">
          <Link
            to="/tools"
            className="sa-btn sa-btn-primary sa-btn-sm"
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '0.55rem 1.15rem',
              fontSize: '0.88rem'
            }}
          >
            <Sparkles size={15} />
            Explore All Tools
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sa-mobile-toggle"
          style={{
            background: 'var(--primary-light)',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            padding: '0.55rem',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition)'
          }}
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          padding: '1.25rem 1.5rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: isActive('/') ? 'var(--primary-light)' : 'transparent',
              color: isActive('/') ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Home</span>
            <ArrowRight size={16} color="var(--text-muted)" />
          </Link>
          <Link
            to="/tools"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: isActive('/tools') ? 'var(--primary-light)' : 'transparent',
              color: isActive('/tools') ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>All Tools</span>
            <ArrowRight size={16} color="var(--text-muted)" />
          </Link>

          <Link
            to="/tools"
            onClick={() => setMobileMenuOpen(false)}
            className="sa-btn sa-btn-primary"
            style={{
              marginTop: '0.5rem',
              width: '100%',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem'
            }}
          >
            <Sparkles size={16} />
            Explore All 15+ Tools
          </Link>
        </div>
      )}

      <style>{`
        @media (min-width: 769px) {
          .sa-desktop-nav, .sa-desktop-auth { display: flex !important; }
          .sa-mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
}
