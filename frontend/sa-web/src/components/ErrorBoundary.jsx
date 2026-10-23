import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught runtime error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem 2rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertCircle size={30} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--text-main)' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              An unexpected display issue occurred. Please try reloading or choose another tool.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={this.handleReload} className="sa-btn sa-btn-primary">
                <RotateCcw size={16} />
                Reload Page
              </button>
              <a href="/tools" className="sa-btn sa-btn-secondary">
                All Tools
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
