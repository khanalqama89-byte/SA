import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toolService } from '../services/toolService';
import { useConversion } from '../hooks/useConversion';
import FileUploader from '../components/FileUploader';
import FileSelectedHeader from '../components/FileSelectedHeader';
import DocumentPreview from '../components/DocumentPreview';
import ConversionOptions from '../components/ConversionOptions';
import ConversionResult from '../components/ConversionResult';
import ConversionFlowSteps from '../components/ConversionFlowSteps';
import ProgressBar from '../components/ProgressBar';
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Zap,
  FileCheck2,
  Clock,
  Layers,
  CheckCircle2,
  Lock
} from 'lucide-react';

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

  // Conversion options state
  const [options, setOptions] = useState({
    compressionLevel: 'MEDIUM',
    rotation: '90',
    pageRange: '',
    deletePages: '',
    dpi: '150',
    pageSize: 'A4',
    orientation: 'auto',
    margin: 'standard',
    fitMode: 'fit',
    font: 'Helvetica',
    fontSize: '11',
    lineSpacing: '1.5',
    layoutMode: 'FLOWING'
  });

  const {
    selectedFile,
    stage,
    progress,
    statusMessage,
    errorMessage,
    jobId,
    outputFileName,
    resultData,
    selectFile,
    replaceFile,
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
      document.title = `${initial.name} — Convert Online Free | Aalq Converter`;
    }

    toolService.getTool(slug)
      .then(data => {
        if (data && data.name) {
          setTool(data);
          document.title = `${data.name} — Convert Online Free | Aalq Converter`;
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTool(false));
  }, [slug]);

  const handleStartConversion = () => {
    try {
      startProcess(options);
    } catch (e) {
      console.error("Failed to start conversion:", e);
    }
  };

  const safeTool = tool || getInitialTool(slug) || {
    name: 'Document Converter',
    slug: slug || 'convert',
    description: 'Convert and process documents online.',
    sourceFormat: 'pdf',
    targetFormat: 'docx'
  };

  // Compute step number for the flow indicator
  const currentStep = stage === 'COMPLETED'
    ? 4
    : stage === 'CONVERTING'
    ? 3
    : stage === 'PREVIEW'
    ? 2
    : 1;

  const targetFormatUpper = (safeTool.targetFormat || 'Document').toUpperCase();

  return (
    <div className="sa-page">
      <div className="sa-ambient-bg" />

      <div className="sa-container" style={{ maxWidth: '920px' }}>
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
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              background: 'white',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xs)',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to All Tools</span>
          </Link>
        </div>

        {/* Tool Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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

          <h1 className="sa-title-hero" style={{ fontSize: 'clamp(2.2rem, 4.2vw, 3.1rem)', marginBottom: '0.85rem' }}>
            {safeTool.name}
          </h1>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: '1.1rem',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            {safeTool.description}
          </p>
        </div>

        {/* Professional Step Flow Indicator */}
        <ConversionFlowSteps currentStep={currentStep} />

        {/* Main Interactive Workspace Area */}
        <div style={{ marginBottom: '4rem' }}>
          {stage === 'COMPLETED' ? (
            /* STEP 6 & RESULT: Completed View */
            <ConversionResult
              jobId={jobId}
              originalFileName={resultData?.originalFileName || selectedFile?.name}
              originalSize={resultData?.originalSize || selectedFile?.size}
              outputFileName={outputFileName}
              targetFormat={safeTool.targetFormat}
              fileSize={resultData?.size}
              fileBase64={resultData?.fileBase64}
              mimeType={resultData?.mimeType}
              onDownload={downloadOutput}
              onReset={reset}
            />
          ) : stage === 'CONVERTING' ? (
            /* STEP 5: Converting & Processing State */
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              padding: '3rem 2rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
              textAlign: 'center'
            }}>
              <ProgressBar
                progress={progress}
                statusText={statusMessage}
                error={false}
              />
              <div style={{
                marginTop: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}>
                <Lock size={15} color="var(--primary)" />
                <span>Processing in secure isolated sandbox • 100% confidential</span>
              </div>
            </div>
          ) : stage === 'FAILED' ? (
            /* Error State */
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-xl)',
              padding: '3rem 2rem',
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
                Conversion Notice
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', maxWidth: '520px', margin: '0 auto 1.75rem', lineHeight: 1.55 }}>
                {errorMessage || 'Unable to convert this document. Please check that the file is not corrupted or password-protected, then try again.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button onClick={reset} className="sa-btn sa-btn-primary">
                  Try Another File
                </button>
              </div>
            </div>
          ) : !selectedFile || stage === 'IDLE' ? (
            /* STEP 1: Upload File */
            <FileUploader
              acceptedFormat={safeTool.sourceFormat}
              toolName={safeTool.name}
              onFileSelected={selectFile}
            />
          ) : (
            /* STEP 2, 3, 4: Preview, Options, & Confirmation */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* File Info Bar with Replace / Remove */}
              <FileSelectedHeader
                file={selectedFile}
                onReplace={replaceFile}
                onRemove={removeFile}
              />

              {/* Document Visual Preview */}
              <DocumentPreview
                file={selectedFile}
                isOutput={false}
              />

              {/* Conversion Settings / Options */}
              <ConversionOptions
                toolSlug={safeTool.slug}
                options={options}
                onChange={setOptions}
                targetFormat={safeTool.targetFormat}
              />

              {/* Step 4 Confirmation Button */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center'
              }}>
                <button
                  onClick={handleStartConversion}
                  className="sa-btn sa-btn-primary sa-btn-lg"
                  style={{
                    width: '100%',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    padding: '1.15rem 2rem',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 28px var(--primary-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <Sparkles size={22} />
                  <span>Convert to {targetFormatUpper} Now</span>
                </button>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.25rem',
                  marginTop: '1rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-subtle)',
                  fontWeight: 600,
                  flexWrap: 'wrap'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={15} color="#10b981" />
                    High-Fidelity Document Layout
                  </span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={15} color="#10b981" />
                    Clean & Editable Output
                  </span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={15} color="#10b981" />
                    Instant Cloud Processing
                  </span>
                </div>
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
                <h4 style={{ fontWeight: 800, marginBottom: '0.35rem', fontSize: '1rem' }}>Upload & Preview</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Select your {(safeTool.sourceFormat || 'File').toUpperCase()} document. Review pages, layout, and adjust settings before converting.
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
                  Click Convert to {(safeTool.targetFormat || 'Document').toUpperCase()}. Our high-fidelity pipeline reconstructs fonts, tables, and images accurately.
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
                  Inspect the converted document preview and save your completed {(safeTool.targetFormat || 'Document').toUpperCase()} file directly.
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
                Does {safeTool.name} preserve headings, tables, and page margins?
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Yes! Our high-fidelity conversion pipeline analyzes spatial text coordinates, font weights, and table structures so the resulting document looks professionally finished and properly structured.
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                How long are my files stored on the server?
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Both uploaded and generated documents are automatically and permanently purged from server memory within 24 hours. Your documents are never shared or stored long-term.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
