import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  FileCode,
  Image,
  Layers,
  Scissors,
  Minimize2,
  RotateCw,
  Trash2,
  ArrowRight,
  Sparkles,
  FileCheck2,
  FileType
} from 'lucide-react';

export default function ToolCard({ tool }) {
  const getToolMeta = (slug) => {
    switch (slug) {
      case 'pdf-to-word':
        return {
          icon: <FileText size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
          glow: 'rgba(79, 70, 229, 0.35)',
          tag: 'Most Popular'
        };
      case 'word-to-pdf':
        return {
          icon: <FileType size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
          glow: 'rgba(37, 99, 235, 0.35)',
          tag: 'High Fidelity'
        };
      case 'pdf-to-text':
      case 'text-to-pdf':
        return {
          icon: <FileCheck2 size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          glow: 'rgba(16, 185, 129, 0.35)',
          tag: 'Clean Text'
        };
      case 'pdf-to-jpg':
      case 'jpg-to-pdf':
      case 'pdf-to-png':
      case 'png-to-pdf':
        return {
          icon: <Image size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
          glow: 'rgba(234, 88, 12, 0.35)',
          tag: 'HD Visuals'
        };
      case 'merge-pdf':
        return {
          icon: <Layers size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
          glow: 'rgba(124, 58, 237, 0.35)',
          tag: 'Batch Engine'
        };
      case 'split-pdf':
        return {
          icon: <Scissors size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #db2777 0%, #f43f5e 100%)',
          glow: 'rgba(219, 39, 119, 0.35)',
          tag: 'Fast Split'
        };
      case 'compress-pdf':
        return {
          icon: <Minimize2 size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
          glow: 'rgba(8, 145, 178, 0.35)',
          tag: 'Smart Reduce'
        };
      case 'rotate-pdf':
        return {
          icon: <RotateCw size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          glow: 'rgba(59, 130, 246, 0.35)',
          tag: 'Instant Fix'
        };
      case 'delete-pdf-pages':
      case 'extract-pdf-pages':
        return {
          icon: <Trash2 size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #dc2626 0%, #e11d48 100%)',
          glow: 'rgba(220, 38, 38, 0.35)',
          tag: 'Page Tools'
        };
      case 'html-to-pdf':
        return {
          icon: <FileCode size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          glow: 'rgba(2, 132, 199, 0.35)',
          tag: 'Web Engine'
        };
      default:
        return {
          icon: <Sparkles size={26} color="white" />,
          gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          glow: 'rgba(79, 70, 229, 0.35)',
          tag: 'Instant'
        };
    }
  };

  const meta = getToolMeta(tool.slug);

  return (
    <Link
      to={`/${tool.slug}`}
      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
      className="sa-card sa-card-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.85rem',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(226, 232, 240, 0.85)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = `0 20px 35px -8px ${meta.glow}`;
        e.currentTarget.style.borderColor = 'var(--border-focus)';
        const arrow = e.currentTarget.querySelector('.sa-card-arrow');
        if (arrow) arrow.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.85)';
        const arrow = e.currentTarget.querySelector('.sa-card-arrow');
        if (arrow) arrow.style.transform = 'translateX(0)';
      }}
    >
      <div>
        {/* Header Row: Icon + Format Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.35rem'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: meta.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 18px ${meta.glow}`
          }}>
            {meta.icon}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              {tool.sourceFormat} &rarr; {tool.targetFormat}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.22rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          marginBottom: '0.55rem',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
          lineHeight: 1.25
        }}>
          {tool.name}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: '0.92rem',
          color: 'var(--text-muted)',
          lineHeight: 1.55,
          marginBottom: '1.5rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {tool.description}
        </p>
      </div>

      {/* Footer CTA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(241, 245, 249, 1)',
        marginTop: 'auto'
      }}>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-subtle)',
          letterSpacing: '0.03em',
          textTransform: 'uppercase'
        }}>
          {meta.tag}
        </span>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.9rem',
          fontWeight: 700,
          color: 'var(--primary)'
        }}>
          <span>Convert now</span>
          <ArrowRight
            size={16}
            className="sa-card-arrow"
            style={{ transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </div>
      </div>
    </Link>
  );
}
