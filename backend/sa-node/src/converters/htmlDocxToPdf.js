const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const mammoth = require('mammoth');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Locate local browser executable
function findBrowserExecutable() {
  const browserPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];

  for (const p of browserPaths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

const STYLED_TEMPLATE = (bodyContent, title = 'Document') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 20mm 18mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      font-weight: 700;
      line-height: 1.25;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }
    h1 { font-size: 22pt; margin-top: 0.5em; }
    h2 { font-size: 16pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    h3 { font-size: 13pt; }
    p {
      margin-top: 0;
      margin-bottom: 0.85em;
      text-align: justify;
      text-justify: inter-word;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.2em 0;
      page-break-inside: avoid;
      font-size: 10pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 7pt 10pt;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 0.85em;
      padding-left: 24pt;
    }
    li {
      margin-bottom: 0.35em;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
      page-break-inside: avoid;
      border-radius: 4px;
    }
    blockquote {
      border-left: 4px solid #818cf8;
      margin: 1em 0;
      padding: 0.5em 1em;
      color: #475569;
      background-color: #f8fafc;
    }
    code, pre {
      font-family: Consolas, Monaco, "Courier New", monospace;
      font-size: 9.5pt;
      background-color: #f1f5f9;
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre {
      padding: 10px;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    a {
      color: #4f46e5;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;

/**
 * Render HTML buffer to PDF using Headless Chrome / Edge
 */
async function renderHtmlWithBrowser(htmlString, browserPath) {
  const tmpId = Math.random().toString(36).substring(2, 10);
  const tmpHtml = path.join(os.tmpdir(), `sa_render_${tmpId}.html`);
  const tmpPdf = path.join(os.tmpdir(), `sa_render_${tmpId}.pdf`);

  try {
    fs.writeFileSync(tmpHtml, htmlString, 'utf-8');

    execFileSync(browserPath, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--run-all-compositor-stages-before-draw',
      '--print-to-pdf=' + tmpPdf,
      '--print-to-pdf-no-header',
      tmpHtml
    ], { timeout: 30000 });

    if (fs.existsSync(tmpPdf)) {
      const pdfBytes = fs.readFileSync(tmpPdf);
      return Buffer.from(pdfBytes);
    }
    throw new Error('PDF file was not created by browser engine');
  } finally {
    try { if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml); } catch {}
    try { if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf); } catch {}
  }
}

/**
 * Pure JavaScript fallback for rendering clean HTML into PDF via pdf-lib
 */
async function renderHtmlWithPdfLib(htmlString, options = {}) {
  // Strip tags while preserving structure
  const cleanContent = htmlString
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, '\n\n## $1\n\n')
    .replace(/<h[4-6][^>]*>(.*?)<\/h[4-6]>/gi, '\n\n### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, cells) => {
      const row = cells.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi, '$1 | ');
      return row + '\n';
    })
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  const { convertTextToPdf } = require('./textToPdf');
  const res = await convertTextToPdf(Buffer.from(cleanContent, 'utf-8'), options);
  return res.buffer;
}

/**
 * High-fidelity Word (DOCX) to PDF Converter
 */
async function convertDocxToPdf(inputBuffer, options = {}) {
  // Convert DOCX to rich HTML with Mammoth
  const result = await mammoth.convertToHtml({ buffer: inputBuffer });
  const rawHtml = result.value || '<p>Empty Document</p>';

  const formattedHtml = STYLED_TEMPLATE(rawHtml, 'Word Document');

  const browser = findBrowserExecutable();
  let pdfBuffer;

  if (browser) {
    try {
      pdfBuffer = await renderHtmlWithBrowser(formattedHtml, browser);
    } catch (err) {
      console.warn('Headless browser conversion failed, using fallback engine:', err.message);
      pdfBuffer = await renderHtmlWithPdfLib(rawHtml, options);
    }
  } else {
    pdfBuffer = await renderHtmlWithPdfLib(rawHtml, options);
  }

  return {
    buffer: pdfBuffer,
    extension: '.pdf',
    mimeType: 'application/pdf'
  };
}

/**
 * High-fidelity HTML to PDF Converter
 */
async function convertHtmlToPdf(inputBuffer, options = {}) {
  const htmlInput = inputBuffer.toString('utf-8');
  let finalHtml = htmlInput;

  // If input is snippet rather than full document, wrap in styled template
  if (!htmlInput.includes('<html') && !htmlInput.includes('<body')) {
    finalHtml = STYLED_TEMPLATE(htmlInput, 'HTML Document');
  }

  const browser = findBrowserExecutable();
  let pdfBuffer;

  if (browser) {
    try {
      pdfBuffer = await renderHtmlWithBrowser(finalHtml, browser);
    } catch (err) {
      console.warn('Browser HTML to PDF failed, falling back:', err.message);
      pdfBuffer = await renderHtmlWithPdfLib(htmlInput, options);
    }
  } else {
    pdfBuffer = await renderHtmlWithPdfLib(htmlInput, options);
  }

  return {
    buffer: pdfBuffer,
    extension: '.pdf',
    mimeType: 'application/pdf'
  };
}

module.exports = {
  convertDocxToPdf,
  convertHtmlToPdf
};
