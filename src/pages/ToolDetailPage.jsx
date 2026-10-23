import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toolService } from '../services/toolService';
import { useConversion } from '../hooks/useConversion';
import FileUploader from '../components/FileUploader';
import FilePreview from '../components/FilePreview';
import ProgressBar from '../components/ProgressBar';
import DownloadButton from '../components/DownloadButton';
import { ArrowLeft, Sparkles, SlidersHorizontal, AlertCircle, ShieldCheck, Zap, FileCheck2, Clock } from 'lucide-react';

export default function ToolDetailPage() {
  const { slug } = useParams();
  const getInitialTool = (s) => {
    if (!s) return null;
    const name = s.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    const src = s.split('-')[0] || 'pdf';
    const tgt = s.split('-').pop() || 'docx';
    return {
      name,
      slug: s,
      description: `Convert and process ${src.toUpperCase()} to ${tgt.toUpperCase()} accurately with zero layout loss.`,
      sourceFormat: src,
      targetFormat: tgt
    };
  };

  const [tool, setTool] = useState(() => getInitialTool(slug));
  const [loadingTool, setLoadingTool] = useState(false);

  // Tool specific options
  const [options, setOptions] = useState({
    compressionLevel: 'MEDIUM',
    rotation: '90',
    pageRange: '',
    deletePages: '',
    dpi: '150'
  });

  const {
    selectedFile,
    stage,
    progress,
    statusMessage,
    errorMessage,
    jobId,
    outputFileName,
    selectFile,
    removeFile,
    startProcess,
    downloadOutput,
    reset
  } = useConversion(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) return;
    const initial = getInitialTool(slug);
    if (!tool || tool.slug !== slug) {
      setTool(initial);
    }
    if (initial?.name) {
      document.title = `${initial.name} — Convert Online Free | SA`;
    }

    toolService.getTool(slug)
      .then(data => {
        if (data && data.name) {
          setTool(data);
          document.title = `${data.name} — Convert Online Free | SA`;
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTool(false));
  }, [slug]);

  const handleStartConversion = () => {
    try {
      startProcess(options);
    } catch (e) {
      console.error("Failed to start process:", e);
    }
  };

  const safeTool = tool || getInitialTool(slug) || {
    name: 'Document Converter',
    slug: slug || 'convert',
    description: 'Convert and process documents online.',
    sourceFormat: 'pdf',
    targetFormat: 'docx'
  };

  return (
    <div className="sa-page">
      <div className="sa-ambient-bg" />

      <div className="sa-container" style={{ maxWidth: '880px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.75rem' }}>
          <Link
            to="/tools"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.92rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'white',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <ArrowLeft size={16} />
            Back to All Tools
          </Link>
        </div>

        {/* Tool Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '0.8rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '1rem'
          }}>
            <span>{safeTool.sourceFormat} &rarr; {safeTool.targetFormat}</span>
          </div>

          <h1 className="sa-title-hero" style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', marginBottom: '0.85rem' }}>
            {safeTool.name}
          </h1>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: '1.1rem',
            maxWidth: '640px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            {safeTool.description}
          </p>
        </div>

        {/* Main Work Area */}
        <div style={{ marginBottom: '4rem' }}>
          {stage === 'COMPLETED' ? (
            <DownloadButton
              jobId={jobId}
              fileName={outputFileName}
              targetFormat={safeTool.targetFormat}
              onDownload={downloadOutput}
              onReset={reset}
            />
          ) : stage === 'UPLOADING' || stage === 'CONVERTING' ? (
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)'
            }}>
              <ProgressBar
                progress={progress}
                statusText={statusMessage}
                error={false}
              />
            </div>
          ) : stage === 'FAILED' ? (
            <div style={{
              background: 'white',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.75rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <AlertCircle size={34} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '0.5rem' }}>
                Conversion Failed
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', maxWidth: '480px', margin: '0 auto 1.75rem' }}>
                {errorMessage || 'An error occurred while converting the file. Please ensure the file is not corrupted or password-protected.'}
              </p>
              <button onClick={reset} className="sa-btn sa-btn-primary">
                Try Again
              </button>
            </div>
          ) : !selectedFile ? (
            <FileUploader
              acceptedFormat={safeTool.sourceFormat}
              toolName={safeTool.name}
              onFileSelected={selectFile}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <FilePreview
                file={selectedFile}
                onRemove={removeFile}
              />

              {/* Tool Specific Options Card */}
              <div className="sa-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '1.5rem' }}>
                  <SlidersHorizontal size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Conversion Settings</h3>
                </div>

                {safeTool.slug === 'compress-pdf' && (
                  <div className="sa-input-group">
                    <label className="sa-label">Compression Level</label>
                    <select
                      value={options.compressionLevel}
                      onChange={(e) => setOptions({ ...options, compressionLevel: e.target.value })}
                      className="sa-select"
                    >
                      <option value="MEDIUM">Recommended (Balanced Quality & Size)</option>
                      <option value="HIGH">Extreme (Maximum compression, lowest size)</option>
                      <option value="LOW">Low (Maximum visual quality, subtle compression)</option>
                    </select>
                  </div>
                )}

                {safeTool.slug === 'rotate-pdf' && (
                  <div className="sa-input-group">
                    <label className="sa-label">Rotation Angle</label>
                    <select
                      value={options.rotation}
                      onChange={(e) => setOptions({ ...options, rotation: e.target.value })}
                      className="sa-select"
                    >
                      <option value="90">90° Clockwise</option>
                      <option value="180">180° Flip Upside-Down</option>
                      <option value="270">270° Counter-Clockwise</option>
                    </select>
                  </div>
                )}

                {safeTool.slug === 'extract-pdf-pages' && (
                  <div className="sa-input-group">
                    <label className="sa-label">Pages to Extract</label>
                    <input
                      type="text"
                      placeholder="e.g. 1-3, 5, 8"
                      value={options.pageRange}
                      onChange={(e) => setOptions({ ...options, pageRange: e.target.value })}
                      className="sa-input"
                    />
                    <small style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>Enter page numbers or ranges separated by commas.</small>
                  </div>
                )}

                {safeTool.slug === 'delete-pdf-pages' && (
                  <div className="sa-input-group">
                    <label className="sa-label">Pages to Remove</label>
                    <input
                      type="text"
                      placeholder="e.g. 2, 4, 6"
                      value={options.deletePages}
                      onChange={(e) => setOptions({ ...options, deletePages: e.target.value })}
                      className="sa-input"
                    />
                    <small style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>Designate unwanted pages to strip permanently.</small>
                  </div>
                )}

                {(safeTool.slug === 'pdf-to-jpg' || safeTool.slug === 'pdf-to-png') && (
                  <div className="sa-input-group">
                    <label className="sa-label">Output Resolution (DPI)</label>
                    <select
                      value={options.dpi}
                      onChange={(e) => setOptions({ ...options, dpi: e.target.value })}
                      className="sa-select"
                    >
                      <option value="150">150 DPI (Standard Web Quality)</option>
                      <option value="300">300 DPI (High Print Resolution)</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={handleStartConversion}
                  className="sa-btn sa-btn-primary sa-btn-lg"
                  style={{ width: '100%', marginTop: '0.75rem', fontSize: '1.1rem' }}
                >
                  <Sparkles size={20} />
                  Convert to {(safeTool.targetFormat || 'Document').toUpperCase()} Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Informational & SEO Guide Section */}
        <section style={{
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem 2.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>
            How to use {safeTool.name}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>1</div>
              <div>
                <h4 style={{ fontWeight: 800, marginBottom: '0.35rem', fontSize: '1rem' }}>Upload Document</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Drag & drop or select your {(safeTool.sourceFormat || 'File').toUpperCase()} file from your phone or PC.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>2</div>
              <div>
                <h4 style={{ fontWeight: 800, marginBottom: '0.35rem', fontSize: '1rem' }}>Instant Engine</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Click Convert. Our high-fidelity Java pipeline processes your file in sub-seconds.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>3</div>
              <div>
                <h4 style={{ fontWeight: 800, marginBottom: '0.35rem', fontSize: '1rem' }}>Download Result</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Save your converted {(safeTool.targetFormat || 'Document').toUpperCase()} file directly without extra prompts.
                </p>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'rgba(241, 245, 249, 1)', margin: '2.5rem 0' }} />

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', fontFamily: 'var(--font-display)' }}>
            Frequently Asked Questions about {safeTool.name}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Does {safeTool.name} alter the layout or page count of my file?
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                No! Our engine is specifically calibrated to preserve 2-column resumes, table structures, exact font weights, and compact margins so a 1-page document remains 1 page.
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                How long are my files stored on the server?
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Both uploaded and generated files are automatically and permanently deleted from our servers within 24 hours. No data is retained.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
