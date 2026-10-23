import React, { useState, useEffect } from 'react';
import ToolCard from '../components/ToolCard';
import { toolService } from '../services/toolService';
import { Search, Sparkles, X, Layers } from 'lucide-react';

export default function Tools() {
  const [tools, setTools] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    toolService.getTools()
      .then(data => setTools(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: 'ALL', label: '🔥 All Tools' },
    { id: 'PDF', label: '📄 PDF Tools' },
    { id: 'OFFICE', label: '💼 Word & Office' },
    { id: 'IMAGES', label: '🖼️ Images' },
    { id: 'EDIT', label: '⚡ Merge & Compress' }
  ];

  const filtered = tools.filter(t => {
    if (!t) return false;
    const name = t.name || '';
    const desc = t.description || '';
    const src = t.sourceFormat || '';
    const tgt = t.targetFormat || '';
    const q = (search || '').toLowerCase();

    const matches = name.toLowerCase().includes(q) ||
                    desc.toLowerCase().includes(q) ||
                    src.toLowerCase().includes(q) ||
                    tgt.toLowerCase().includes(q);

    if (!matches) return false;

    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'PDF') return src.toLowerCase() === 'pdf' || tgt.toLowerCase() === 'pdf';
    if (selectedCategory === 'OFFICE') return src.toLowerCase() === 'docx' || tgt.toLowerCase() === 'docx';
    if (selectedCategory === 'IMAGES') return ['jpg', 'png', 'jpeg'].includes(src.toLowerCase()) || ['jpg', 'png', 'jpeg'].includes(tgt.toLowerCase());
    if (selectedCategory === 'EDIT') return ['merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'extract-pdf-pages', 'delete-pdf-pages'].includes(t.slug);
    return true;
  });

  return (
    <div className="sa-page">
      <div className="sa-ambient-bg" />

      <div className="sa-container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.95rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '0.82rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '1.25rem'
          }}>
            <Sparkles size={14} />
            <span>Complete Document Suite</span>
          </div>

          <h1 className="sa-title-hero" style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', marginBottom: '0.85rem' }}>
            All Document Conversion Tools
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
            Explore our complete collection of 15+ high-fidelity document converters and utilities. 100% free with zero layout shift.
          </p>

          {/* Search Input */}
          <div className="sa-search-wrapper">
            <Search
              size={20}
              color="var(--text-subtle)"
              style={{ position: 'absolute', left: '1.25rem', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="Search by tool name or format (e.g. Word, PNG, Merge)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sa-input"
              style={{
                paddingLeft: '3.35rem',
                paddingRight: search ? '3rem' : '1.25rem',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                fontSize: '1rem',
                border: '1px solid rgba(203, 213, 225, 0.8)',
                boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.06)'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '1.15rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-subtle)',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Clear Search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '0.65rem'
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`sa-pill-tab ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div className="sa-animate-spin" style={{
              width: '44px',
              height: '44px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              margin: '0 auto 1.25rem'
            }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading tools suite...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <Search size={40} color="var(--text-subtle)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No tools found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              We couldn't find any tool matching "{search}".
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('ALL'); }}
              className="sa-btn sa-btn-primary"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '1.75rem'
          }}>
            {filtered.map(tool => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
