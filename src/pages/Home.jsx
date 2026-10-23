import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { toolService } from '../services/toolService';
import {
  Search,
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Sparkles,
  Check,
  Lock,
  Layers,
  FileCheck2,
  ChevronDown,
  X
} from 'lucide-react';

export default function Home() {
  const [tools, setTools] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    toolService.getTools()
      .then(data => setTools(data || []))
      .catch(() => {
        // Fallback default list if backend is starting
        setTools([
          { id: 1, name: 'PDF to Word', slug: 'pdf-to-word', description: 'Convert PDF documents to editable Microsoft Word (DOCX) files with 1:1 layout preservation.', sourceFormat: 'pdf', targetFormat: 'docx' },
          { id: 2, name: 'Word to PDF', slug: 'word-to-pdf', description: 'Convert Word (DOCX) documents into clean, standard PDF files.', sourceFormat: 'docx', targetFormat: 'pdf' },
          { id: 3, name: 'PDF to Text', slug: 'pdf-to-text', description: 'Extract clean plain text content cleanly from PDF documents.', sourceFormat: 'pdf', targetFormat: 'txt' },
          { id: 4, name: 'PDF to JPG', slug: 'pdf-to-jpg', description: 'Convert PDF pages into high-resolution JPG images.', sourceFormat: 'pdf', targetFormat: 'jpg' },
          { id: 5, name: 'JPG to PDF', slug: 'jpg-to-pdf', description: 'Convert JPG images into a formatted PDF document.', sourceFormat: 'jpg', targetFormat: 'pdf' },
          { id: 6, name: 'PNG to PDF', slug: 'png-to-pdf', description: 'Convert PNG images into crisp, high-density PDF documents.', sourceFormat: 'png', targetFormat: 'pdf' },
          { id: 7, name: 'PDF to PNG', slug: 'pdf-to-png', description: 'Render PDF pages into crystal clear lossless PNG images.', sourceFormat: 'pdf', targetFormat: 'png' },
          { id: 8, name: 'Merge PDF', slug: 'merge-pdf', description: 'Combine multiple PDF files into one single organized PDF.', sourceFormat: 'pdf', targetFormat: 'pdf' },
          { id: 9, name: 'Split PDF', slug: 'split-pdf', description: 'Split PDF pages or extract a specific range into standalone PDFs.', sourceFormat: 'pdf', targetFormat: 'zip' },
          { id: 10, name: 'Compress PDF', slug: 'compress-pdf', description: 'Reduce PDF file size efficiently while maintaining crisp visual quality.', sourceFormat: 'pdf', targetFormat: 'pdf' },
          { id: 11, name: 'Rotate PDF', slug: 'rotate-pdf', description: 'Rotate PDF pages permanently 90, 180, or 270 degrees.', sourceFormat: 'pdf', targetFormat: 'pdf' },
          { id: 12, name: 'Extract PDF Pages', slug: 'extract-pdf-pages', description: 'Extract selected pages from any PDF document into a new PDF.', sourceFormat: 'pdf', targetFormat: 'pdf' },
          { id: 13, name: 'Delete PDF Pages', slug: 'delete-pdf-pages', description: 'Remove unwanted pages from a PDF document effortlessly.', sourceFormat: 'pdf', targetFormat: 'pdf' },
          { id: 14, name: 'HTML to PDF', slug: 'html-to-pdf', description: 'Convert HTML documents or webpages into formatted PDF files.', sourceFormat: 'html', targetFormat: 'pdf' },
          { id: 15, name: 'Text to PDF', slug: 'text-to-pdf', description: 'Transform plain text files into cleanly styled PDF documents.', sourceFormat: 'txt', targetFormat: 'pdf' }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: 'ALL', label: '🔥 All Tools' },
    { id: 'PDF', label: '📄 PDF Tools' },
    { id: 'OFFICE', label: '💼 Word & Office' },
    { id: 'IMAGES', label: '🖼️ Images' },
    { id: 'EDIT', label: '⚡ Merge & Compress' }
  ];

  const filteredTools = tools.filter(t => {
    if (!t) return false;
    const name = t.name || '';
    const desc = t.description || '';
    const src = t.sourceFormat || '';
    const tgt = t.targetFormat || '';
    const q = (search || '').toLowerCase();

    const matchesSearch = name.toLowerCase().includes(q) ||
                          desc.toLowerCase().includes(q) ||
                          src.toLowerCase().includes(q) ||
                          tgt.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'PDF') return src.toLowerCase() === 'pdf' || tgt.toLowerCase() === 'pdf';
    if (selectedCategory === 'OFFICE') return src.toLowerCase() === 'docx' || tgt.toLowerCase() === 'docx';
    if (selectedCategory === 'IMAGES') return ['jpg', 'png', 'jpeg'].includes(src.toLowerCase()) || ['jpg', 'png', 'jpeg'].includes(tgt.toLowerCase());
    if (selectedCategory === 'EDIT') return ['merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'extract-pdf-pages', 'delete-pdf-pages'].includes(t.slug);
    return true;
  });

  const faqs = [
    {
      q: 'Will my 1-page PDF resume stay 1 page when converted to Word?',
      a: 'Yes, 100%! Our engine uses an advanced layout analyzer with compact margins, intelligent 2-column detection, and sentence continuation merging. Your fonts, headings, and column layouts remain identical with zero accidental page blowup.'
    },
    {
      q: 'Is SA Tools completely free without limits or sign-up?',
      a: 'Yes, every tool on SA is 100% free to use. There are no registration forms, no login barriers, no subscriptions, and no hidden watermarks.'
    },
    {
      q: 'Are my uploaded documents safe and private?',
      a: 'Absolutely. All processing occurs on isolated temporary storage with strict SSL encryption. Your files are automatically purged from our servers within 24 hours and are never read, indexed, or shared.'
    },
    {
      q: 'Does it work smoothly on mobile phones and tablets?',
      a: 'Yes! The entire interface is touch-optimized, fully responsive, and tested across mobile viewports so you can upload, convert, and download directly from your smartphone.'
    }
  ];

  return (
    <div className="sa-page">
      <div className="sa-ambient-bg" />

      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '3rem 1rem 3.5rem',
        position: 'relative',
        overflow: 'hidden',
        maxWidth: '100%'
      }}>
        <div className="sa-container">
          {/* Top Sparkling Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 1.15rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(79, 70, 229, 0.08)',
            border: '1px solid rgba(79, 70, 229, 0.18)',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.75rem',
            backdropFilter: 'blur(8px)'
          }}>
            <Sparkles size={16} />
            <span>⚡ Next-Gen Document Engine • 100% Free & Unlimited</span>
          </div>

          {/* Hero Main Headline */}
          <h1 className="sa-title-hero" style={{ marginBottom: '1.35rem' }}>
            Convert Any Document.<br />
            <span className="sa-gradient-text">Instant. Flawless. Free.</span>
          </h1>

          <p className="sa-subtitle" style={{ marginBottom: '2.5rem' }}>
            Transform PDF, Word, images, and text with zero layout loss. Engineered with high-speed Java pipelines so your 1-page resumes, tables, and fonts stay exact.
          </p>

          {/* Search Box */}
          <div className="sa-search-wrapper">
            <Search
              size={20}
              color="var(--text-subtle)"
              style={{ position: 'absolute', left: '1.25rem', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="Search tools... (e.g. PDF to Word, Merge, Compress)"
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

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '0.65rem',
            marginBottom: '3rem'
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

          {/* Trust Metrics Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '1.75rem',
            padding: '1rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)',
            maxWidth: '850px',
            margin: '0 auto',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} color="#4f46e5" />
              <span>Sub-Second Speed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck2 size={16} color="#10b981" />
              <span>1:1 Layout Preservation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#06b6d4" />
              <span>100% Private & Encrypted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={16} color="#7c3aed" />
              <span>No Sign-Up Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section style={{ padding: '1rem 0 4rem' }}>
        <div className="sa-container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem'
          }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em'
              }}>
                Available Conversion Tools
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Showing {filteredTools.length} powerful conversion and document tools
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div className="sa-animate-spin" style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                margin: '0 auto 1rem'
              }} />
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading tools...</p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)'
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
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: '1.75rem'
            }}>
              {filteredTools.map(tool => (
                <ToolCard key={tool.id || tool.slug} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: '4.5rem 0',
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="sa-container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3.5rem' }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Seamless Experience
            </span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              marginTop: '0.4rem',
              letterSpacing: '-0.02em'
            }}>
              How SA Works in 3 Simple Steps
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '1.05rem' }}>
              No software installations, no complex menus. Convert with lightning precision.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2rem'
          }}>
            {/* Step 1 */}
            <div className="sa-card" style={{ padding: '2.25rem 1.75rem', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontWeight: 800,
                fontSize: '1.35rem',
                boxShadow: '0 8px 20px var(--primary-glow)'
              }}>
                1
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                Upload Document
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Drag and drop your PDF, Word, image, or text file directly into the designated drop zone.
              </p>
            </div>

            {/* Step 2 */}
            <div className="sa-card" style={{ padding: '2.25rem 1.75rem', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontWeight: 800,
                fontSize: '1.35rem',
                boxShadow: '0 8px 20px rgba(6, 182, 212, 0.35)'
              }}>
                2
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                Instant Processing
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Our multithreaded backend analyzes font sizes, headings, tables, and multi-column layouts with 1:1 precision.
              </p>
            </div>

            {/* Step 3 */}
            <div className="sa-card" style={{ padding: '2.25rem 1.75rem', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontWeight: 800,
                fontSize: '1.35rem',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)'
              }}>
                3
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                Download & Enjoy
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Click download to immediately save your cleanly converted, formatted document without browser warnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section style={{ padding: '5rem 0 3rem' }}>
        <div className="sa-container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Got Questions?
            </span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
              fontWeight: 800,
              marginTop: '0.4rem',
              letterSpacing: '-0.02em'
            }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    transition: 'var(--transition)'
                  }}
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.35rem 1.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-display)'
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={20}
                      color="var(--primary)"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                        flexShrink: 0,
                        marginLeft: '1rem'
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 1.75rem 1.5rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      borderTop: '1px solid rgba(241, 245, 249, 1)',
                      paddingTop: '1rem'
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
