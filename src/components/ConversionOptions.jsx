import React from 'react';
import { SlidersHorizontal, Settings2, Info } from 'lucide-react';

export default function ConversionOptions({ toolSlug, options, onChange, targetFormat = 'pdf' }) {
  const updateOption = (key, value) => {
    onChange({ ...options, [key]: value });
  };

  const isPdfToWord = toolSlug === 'pdf-to-word';
  const isPdfToImg = toolSlug === 'pdf-to-jpg' || toolSlug === 'pdf-to-png';
  const isImgToPdf = toolSlug === 'jpg-to-pdf' || toolSlug === 'png-to-pdf';
  const isTextToPdf = toolSlug === 'text-to-pdf';
  const isWordToPdf = toolSlug === 'word-to-pdf';
  const isCompress = toolSlug === 'compress-pdf';
  const isRotate = toolSlug === 'rotate-pdf';
  const isExtract = toolSlug === 'extract-pdf-pages';
  const isDelete = toolSlug === 'delete-pdf-pages';

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        marginBottom: '1.25rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <Settings2 size={20} color="var(--primary)" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Conversion Settings
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* PDF to Word Options */}
        {isPdfToWord && (
          <>
            <div className="sa-input-group">
              <label className="sa-label">Output Layout</label>
              <select
                value={options.layoutMode || 'FLOWING'}
                onChange={(e) => updateOption('layoutMode', e.target.value)}
                className="sa-select"
              >
                <option value="FLOWING">Flowing Document (Recommended for editing text)</option>
                <option value="STRUCTURED">Exact Structured Sections</option>
              </select>
            </div>
            <div className="sa-input-group">
              <label className="sa-label">Output Word Format</label>
              <input
                type="text"
                value="Microsoft Word (.docx)"
                disabled
                className="sa-input"
                style={{ background: '#f8fafc', color: 'var(--text-muted)' }}
              />
            </div>
          </>
        )}

        {/* PDF to Image Options */}
        {isPdfToImg && (
          <>
            <div className="sa-input-group">
              <label className="sa-label">Image Resolution (DPI)</label>
              <select
                value={options.dpi || '150'}
                onChange={(e) => updateOption('dpi', e.target.value)}
                className="sa-select"
              >
                <option value="150">150 DPI (Standard - Crisp & Fast)</option>
                <option value="300">300 DPI (High Print - Maximum Sharpness)</option>
                <option value="96">96 DPI (Web - Compact Size)</option>
              </select>
            </div>
            <div className="sa-input-group">
              <label className="sa-label">Pages to Convert</label>
              <select
                value={options.pagesMode || 'ALL'}
                onChange={(e) => updateOption('pagesMode', e.target.value)}
                className="sa-select"
              >
                <option value="ALL">All Pages (Bundled in ZIP)</option>
                <option value="FIRST">First Page Only</option>
              </select>
            </div>
          </>
        )}

        {/* Image to PDF Options */}
        {isImgToPdf && (
          <>
            <div className="sa-input-group">
              <label className="sa-label">Page Size</label>
              <select
                value={options.pageSize || 'A4'}
                onChange={(e) => updateOption('pageSize', e.target.value)}
                className="sa-select"
              >
                <option value="A4">A4 (Standard 210 x 297 mm)</option>
                <option value="LETTER">US Letter (8.5 x 11 in)</option>
                <option value="FIT_IMAGE">Fit to Image Size</option>
              </select>
            </div>
            <div className="sa-input-group">
              <label className="sa-label">Orientation</label>
              <select
                value={options.orientation || 'auto'}
                onChange={(e) => updateOption('orientation', e.target.value)}
                className="sa-select"
              >
                <option value="auto">Auto (Match image aspect ratio)</option>
                <option value="portrait">Portrait (Vertical)</option>
                <option value="landscape">Landscape (Horizontal)</option>
              </select>
            </div>
            <div className="sa-input-group">
              <label className="sa-label">Page Margins</label>
              <select
                value={options.margin || 'standard'}
                onChange={(e) => updateOption('margin', e.target.value)}
                className="sa-select"
              >
                <option value="standard">Standard (36pt - Centered)</option>
                <option value="small">Small (20pt)</option>
                <option value="none">No Margin (Full Bleed)</option>
              </select>
            </div>
            <div className="sa-input-group">
              <label className="sa-label">Fit Mode</label>
              <select
                value={options.fitMode || 'fit'}
                onChange={(e) => updateOption('fitMode', e.target.value)}
                className="sa-select"
              >
                <option value="fit">Fit to Page (Preserve Aspect Ratio)</option>
                <option value="fill">Fill Entire Area</option>
              </select>
            </div>
          </>
        )}

        {/* Text to PDF Options */}
        {isTextToPdf && (
          <>
            <div className="sa-input-group">
              <label className="sa-label">Font Family</label>
              <select
                value={options.font || 'Helvetica'}
                onChange={(e) => updateOption('font', e.target.value)}
                className="sa-select"
              >
                <option value="Helvetica">Helvetica (Modern Clean Sans)</option>
                <option value="Times-Roman">Times New Roman (Classic Editorial)</option>
                <option value="Courier">Courier (Code & Technical)</option>
              </select>
            </div>
            <div className="sa-input-group">
              <label className="sa-label">Font Size</label>
              <select
                value={options.fontSize || '11'}
                onChange={(e) => updateOption('fontSize', e.target.value)}
                className="sa-select"
              >
                <option value="10">10 pt (Compact)</option>
                <option value="11">11 pt (Standard Document)</option>
                <option value="12">12 pt (Large Readable)</option>
                <option value="14">14 pt (Presentation)</option>
              </select>
            </div>
            <div className="sa-input-group">
              <label className="sa-label">Line Spacing</label>
              <select
                value={options.lineSpacing || '1.5'}
                onChange={(e) => updateOption('lineSpacing', e.target.value)}
                className="sa-select"
              >
                <option value="1.2">1.2 (Tight)</option>
                <option value="1.5">1.5 (Standard Comfortable)</option>
                <option value="2.0">2.0 (Double Spaced)</option>
              </select>
            </div>
            <div className="sa-input-group">
              <label className="sa-label">Margins</label>
              <select
                value={options.margin || '45'}
                onChange={(e) => updateOption('margin', e.target.value)}
                className="sa-select"
              >
                <option value="30">Compact (30 pt)</option>
                <option value="45">Standard (45 pt)</option>
                <option value="60">Wide (60 pt)</option>
              </select>
            </div>
          </>
        )}

        {/* Word to PDF Options */}
        {isWordToPdf && (
          <div className="sa-input-group">
            <label className="sa-label">Page Size</label>
            <select
              value={options.pageSize || 'A4'}
              onChange={(e) => updateOption('pageSize', e.target.value)}
              className="sa-select"
            >
              <option value="A4">A4 (Standard 210 x 297 mm)</option>
              <option value="LETTER">US Letter (8.5 x 11 in)</option>
            </select>
          </div>
        )}

        {/* Compress PDF Options */}
        {isCompress && (
          <div className="sa-input-group">
            <label className="sa-label">Compression Level</label>
            <select
              value={options.compressionLevel || 'MEDIUM'}
              onChange={(e) => updateOption('compressionLevel', e.target.value)}
              className="sa-select"
            >
              <option value="MEDIUM">Recommended (Balanced Quality & Size)</option>
              <option value="HIGH">Extreme (Maximum compression, smallest file)</option>
              <option value="LOW">Low (Maximum visual fidelity)</option>
            </select>
          </div>
        )}

        {/* Rotate PDF Options */}
        {isRotate && (
          <div className="sa-input-group">
            <label className="sa-label">Rotation Angle</label>
            <select
              value={options.rotation || '90'}
              onChange={(e) => updateOption('rotation', e.target.value)}
              className="sa-select"
            >
              <option value="90">90° Clockwise</option>
              <option value="180">180° Upside-Down</option>
              <option value="270">270° Counter-Clockwise</option>
            </select>
          </div>
        )}

        {/* Extract PDF Pages */}
        {isExtract && (
          <div className="sa-input-group">
            <label className="sa-label">Pages to Extract</label>
            <input
              type="text"
              placeholder="e.g. 1-3, 5, 8"
              value={options.pageRange || ''}
              onChange={(e) => updateOption('pageRange', e.target.value)}
              className="sa-input"
            />
            <small style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Separate single pages or ranges with commas.
            </small>
          </div>
        )}

        {/* Delete PDF Pages */}
        {isDelete && (
          <div className="sa-input-group">
            <label className="sa-label">Pages to Remove</label>
            <input
              type="text"
              placeholder="e.g. 2, 4, 6"
              value={options.deletePages || ''}
              onChange={(e) => updateOption('deletePages', e.target.value)}
              className="sa-input"
            />
            <small style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Enter page numbers to remove permanently.
            </small>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '1.25rem',
        padding: '0.65rem 0.95rem',
        background: '#f8fafc',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.82rem',
        color: 'var(--text-muted)'
      }}>
        <Info size={15} color="var(--primary)" />
        <span>Conversion output will be formatted into <strong>{(targetFormat || 'PDF').toUpperCase()}</strong> with professional layout preservation.</span>
      </div>
    </div>
  );
}
