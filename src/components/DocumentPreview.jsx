import React, { useState, useEffect, useRef } from 'react';
import { formatBytes } from '../utils/formatters';
import {
  FileText,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck2,
  Loader2,
  Eye,
  Columns
} from 'lucide-react';
import * as mammoth from 'mammoth';

export default function DocumentPreview({ file, fileDataUrl = null, fileBase64 = null, mimeType = null, isOutput = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState('unknown'); // 'pdf' | 'image' | 'text' | 'docx' | 'other'

  // PDF state
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageThumbnails, setPageThumbnails] = useState([]);
  const [pdfScale, setPdfScale] = useState(1.0);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Image state
  const [imageUrl, setImageUrl] = useState('');

  // Text state
  const [textContent, setTextContent] = useState('');
  const [wordCount, setWordCount] = useState(0);

  // DOCX state
  const [docxHtml, setDocxHtml] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    async function initPreview() {
      try {
        let name = file ? file.name : '';
        let type = file ? file.type : mimeType || '';
        const ext = name.split('.').pop()?.toLowerCase() || '';

        // Determine category
        if (ext === 'pdf' || type.includes('pdf')) {
          setFileType('pdf');
          await loadPdf(file, fileBase64, active);
        } else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || type.startsWith('image/')) {
          setFileType('image');
          loadImage(file, fileBase64, fileDataUrl);
        } else if (['txt', 'csv', 'log', 'json', 'md'].includes(ext) || type.startsWith('text/')) {
          setFileType('text');
          await loadText(file, fileBase64);
        } else if (ext === 'docx' || ext === 'doc' || type.includes('wordprocessingml') || type.includes('msword')) {
          setFileType('docx');
          await loadDocx(file, fileBase64);
        } else {
          setFileType('other');
        }
      } catch (err) {
        console.warn('Preview initialization error:', err);
        if (active) setError('Preview not available for this file type.');
      } finally {
        if (active) setLoading(false);
      }
    }

    initPreview();

    return () => {
      active = false;
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
      }
    };
  }, [file, fileBase64, fileDataUrl, mimeType]);

  // Load PDF with pdfjs-dist
  async function loadPdf(fileObj, b64Data, active) {
    try {
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      } catch {
        // Fallback if worker cannot be resolved
      }

      let dataArray;
      if (fileObj) {
        const ab = await fileObj.arrayBuffer();
        dataArray = new Uint8Array(ab);
      } else if (b64Data) {
        const binaryStr = atob(b64Data);
        dataArray = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          dataArray[i] = binaryStr.charCodeAt(i);
        }
      } else {
        throw new Error('No PDF data provided');
      }

      const loadingTask = pdfjsLib.getDocument({
        data: dataArray,
        useSystemFonts: true
      });
      const doc = await loadingTask.promise;
      if (!active) return;

      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);

      // Generate page thumbnail previews asynchronously
      generateThumbnails(doc, Math.min(doc.numPages, 10), active);
    } catch (err) {
      console.warn('PDF load error:', err);
      if (active) setError('Unable to render PDF preview.');
    }
  }

  // Render current PDF page to main canvas
  useEffect(() => {
    if (!pdfDoc || fileType !== 'pdf' || !canvasRef.current) return;

    let cancelled = false;

    async function renderPage() {
      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch {}
        }

        const page = await pdfDoc.getPage(currentPage);
        if (cancelled || !canvasRef.current) return;

        const baseViewport = page.getViewport({ scale: 1.0 });
        const containerWidth = canvasRef.current.parentElement?.clientWidth || 600;
        // Calculate fit scale
        const fitScale = (containerWidth - 32) / baseViewport.width;
        const actualScale = Math.min(Math.max(fitScale * pdfScale, 0.4), 2.5);

        const viewport = page.getViewport({ scale: actualScale });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.warn('Page render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage, pdfScale, fileType]);

  // Generate lightweight thumbnails for page navigation
  async function generateThumbnails(doc, limit, active) {
    const thumbs = [];
    for (let i = 1; i <= limit; i++) {
      if (!active) return;
      try {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 0.22 });
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = vp.width;
        thumbCanvas.height = vp.height;
        const ctx = thumbCanvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        thumbs.push({ pageNum: i, dataUrl: thumbCanvas.toDataURL('image/jpeg', 0.7) });
      } catch (e) {
        thumbs.push({ pageNum: i, dataUrl: null });
      }
    }
    if (active) setPageThumbnails(thumbs);
  }

  // Load Image preview
  function loadImage(fileObj, b64Data, dataUrl) {
    if (fileObj) {
      const url = URL.createObjectURL(fileObj);
      setImageUrl(url);
    } else if (dataUrl) {
      setImageUrl(dataUrl);
    } else if (b64Data) {
      setImageUrl(`data:${mimeType || 'image/jpeg'};base64,${b64Data}`);
    }
  }

  // Load Text preview
  async function loadText(fileObj, b64Data) {
    let str = '';
    if (fileObj) {
      str = await fileObj.text();
    } else if (b64Data) {
      str = atob(b64Data);
    }
    setTextContent(str);
    const words = str.trim() ? str.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }

  // Load DOCX preview via mammoth
  async function loadDocx(fileObj, b64Data) {
    try {
      let arrayBuffer;
      if (fileObj) {
        arrayBuffer = await fileObj.arrayBuffer();
      } else if (b64Data) {
        const bin = atob(b64Data);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        arrayBuffer = bytes.buffer;
      }

      if (arrayBuffer) {
        const res = await mammoth.convertToHtml({ arrayBuffer });
        setDocxHtml(res.value || '<p>No readable content found in Word document.</p>');
      }
    } catch (e) {
      console.warn('Docx preview error:', e);
      setError('Structured preview unavailable for this Word document.');
    }
  }

  if (loading) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '3rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem'
      }}>
        <Loader2 className="sa-animate-spin" size={32} color="var(--primary)" />
        <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Generating high-fidelity document preview...
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.25rem',
        background: '#f8fafc',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Eye size={18} color="var(--primary)" />
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
            {isOutput ? 'Converted Document Preview' : 'Source Document Preview'}
          </span>
          {file && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'white', padding: '0.15rem 0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              {formatBytes(file.size)}
            </span>
          )}
        </div>

        {/* PDF Navigation & Zoom Bar */}
        {fileType === 'pdf' && numPages > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="sa-btn sa-btn-secondary sa-btn-sm"
                style={{ padding: '0.3rem 0.6rem', height: '30px' }}
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', padding: '0 0.35rem' }}>
                Page {currentPage} of {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, numPages))}
                disabled={currentPage >= numPages}
                className="sa-btn sa-btn-secondary sa-btn-sm"
                style={{ padding: '0.3rem 0.6rem', height: '30px' }}
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ width: '1px', height: '18px', background: 'var(--border)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                onClick={() => setPdfScale(s => Math.max(s - 0.2, 0.6))}
                className="sa-btn sa-btn-secondary sa-btn-sm"
                style={{ padding: '0.3rem 0.5rem', height: '30px' }}
                title="Zoom out"
              >
                <ZoomOut size={15} />
              </button>
              <button
                onClick={() => setPdfScale(1.0)}
                className="sa-btn sa-btn-secondary sa-btn-sm"
                style={{ padding: '0.3rem 0.55rem', height: '30px', fontSize: '0.75rem', fontWeight: 700 }}
                title="Reset zoom"
              >
                {Math.round(pdfScale * 100)}%
              </button>
              <button
                onClick={() => setPdfScale(s => Math.min(s + 0.2, 2.0))}
                className="sa-btn sa-btn-secondary sa-btn-sm"
                style={{ padding: '0.3rem 0.5rem', height: '30px' }}
                title="Zoom in"
              >
                <ZoomIn size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Text Word Counter */}
        {fileType === 'text' && (
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {wordCount} words • {textContent.split('\n').length} lines
          </span>
        )}
      </div>

      {/* Main Preview Canvas / Container */}
      <div style={{
        padding: '1.5rem',
        background: '#f1f5f9',
        minHeight: '260px',
        maxHeight: '560px',
        overflowY: 'auto',
        overflowX: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <FileText size={44} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>{error}</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginTop: '0.35rem' }}>
              Your file is loaded and ready for conversion.
            </p>
          </div>
        ) : fileType === 'pdf' ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}>
            <div style={{
              background: '#ffffff',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              overflow: 'hidden',
              display: 'inline-block',
              margin: '0 auto',
              lineHeight: 0
            }}>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
            </div>

            {/* Thumbnail Strip */}
            {pageThumbnails.length > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                marginTop: '1.25rem',
                padding: '0.65rem',
                background: '#ffffff',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                overflowX: 'auto',
                maxWidth: '100%'
              }}>
                {pageThumbnails.map(thumb => (
                  <button
                    key={thumb.pageNum}
                    onClick={() => setCurrentPage(thumb.pageNum)}
                    style={{
                      border: currentPage === thumb.pageNum ? '2px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '2px',
                      background: 'white',
                      cursor: 'pointer',
                      flexShrink: 0,
                      opacity: currentPage === thumb.pageNum ? 1 : 0.7,
                      transition: 'all 0.15s ease'
                    }}
                    title={`Go to page ${thumb.pageNum}`}
                  >
                    {thumb.dataUrl ? (
                      <img
                        src={thumb.dataUrl}
                        alt={`Page ${thumb.pageNum}`}
                        style={{ height: '56px', width: 'auto', display: 'block', borderRadius: '2px' }}
                      />
                    ) : (
                      <div style={{ width: '42px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                        {thumb.pageNum}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : fileType === 'image' ? (
          <div style={{
            maxWidth: '100%',
            maxHeight: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <img
              src={imageUrl}
              alt="Document Visual Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '460px',
                objectFit: 'contain',
                borderRadius: '4px',
                display: 'block'
              }}
            />
          </div>
        ) : fileType === 'text' ? (
          <div style={{
            width: '100%',
            maxWidth: '720px',
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '0.92rem',
            lineHeight: 1.65,
            color: '#1e293b',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '440px',
            overflowY: 'auto'
          }}>
            {textContent || '(Empty text document)'}
          </div>
        ) : fileType === 'docx' ? (
          <div style={{
            width: '100%',
            maxWidth: '740px',
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '2.25rem 2rem',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border)',
            color: '#1e293b',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            maxHeight: '480px',
            overflowY: 'auto'
          }}>
            <div
              className="sa-docx-preview-content"
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
              {file?.name || 'Document Ready'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Standard file preview ready for conversion.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
