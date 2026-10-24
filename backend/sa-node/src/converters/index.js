const { PDFDocument, degrees } = require('pdf-lib');
const archiver = require('archiver');
const { Writable } = require('stream');

const { extractStructuredPdf } = require('./pdfTextExtractor');
const { convertPdfToDocx } = require('./pdfToDocx');
const { convertDocxToPdf, convertHtmlToPdf } = require('./htmlDocxToPdf');
const { convertPdfToImage } = require('./pdfToImage');
const { convertImageToPdf } = require('./imageToPdf');
const { convertTextToPdf } = require('./textToPdf');

/**
 * Utility to convert Archiver stream to Buffer
 */
function archiverToBuffer(archive) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const customStream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });

    customStream.on('finish', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
    archive.pipe(customStream);
  });
}

/**
 * Helper to parse page range strings like "1-3, 5, 8"
 */
function parsePageRange(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = new Set();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          pages.add(p - 1);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

const converters = {
  // 1. PDF to Text (Preserves logical structure, spaces, line breaks, headings, paragraphs)
  async 'pdf-to-text'(inputBuffer, options = {}) {
    const structured = await extractStructuredPdf(inputBuffer);
    const textOutput = structured.fullText || 'No text extracted from document.';
    return {
      buffer: Buffer.from(textOutput, 'utf-8'),
      extension: '.txt',
      mimeType: 'text/plain'
    };
  },

  // 2. JPG to PDF (Full page, aspect ratio preserved, centering, margins, portrait/landscape)
  async 'jpg-to-pdf'(inputBuffer, options = {}) {
    return await convertImageToPdf(inputBuffer, options);
  },

  // 3. PNG to PDF (Lossless quality, centering, standard page sizes)
  async 'png-to-pdf'(inputBuffer, options = {}) {
    return await convertImageToPdf(inputBuffer, options);
  },

  // 4. Text to PDF (Clean word wrapping, multi-page layout, headings, lists, margins)
  async 'text-to-pdf'(inputBuffer, options = {}) {
    return await convertTextToPdf(inputBuffer, options);
  },

  // 5. Merge PDF
  async 'merge-pdf'(inputBuffer, options = {}) {
    const sourceDoc = await PDFDocument.load(inputBuffer);
    const mergedDoc = await PDFDocument.create();
    const copiedPages = await mergedDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
    copiedPages.forEach(p => mergedDoc.addPage(p));
    const outputBytes = await mergedDoc.save();
    return {
      buffer: Buffer.from(outputBytes),
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
  },

  // 6. Split PDF
  async 'split-pdf'(inputBuffer, options = {}) {
    const sourceDoc = await PDFDocument.load(inputBuffer);
    const totalPages = sourceDoc.getPageCount();
    const archive = archiver('zip', { zlib: { level: 9 } });
    const bufferPromise = archiverToBuffer(archive);

    for (let i = 0; i < totalPages; i++) {
      const pageDoc = await PDFDocument.create();
      const [copiedPage] = await pageDoc.copyPages(sourceDoc, [i]);
      pageDoc.addPage(copiedPage);
      const pageBytes = await pageDoc.save();
      archive.append(Buffer.from(pageBytes), { name: `page-${i + 1}.pdf` });
    }

    await archive.finalize();
    const zipBuffer = await bufferPromise;

    return {
      buffer: zipBuffer,
      extension: '.zip',
      mimeType: 'application/zip'
    };
  },

  // 7. Rotate PDF
  async 'rotate-pdf'(inputBuffer, options = {}) {
    const pdfDoc = await PDFDocument.load(inputBuffer);
    const angle = parseInt(options.rotation || '90', 10);
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + angle) % 360));
    }
    const outputBytes = await pdfDoc.save();
    return {
      buffer: Buffer.from(outputBytes),
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
  },

  // 8. Extract PDF Pages
  async 'extract-pdf-pages'(inputBuffer, options = {}) {
    const sourceDoc = await PDFDocument.load(inputBuffer);
    const totalPages = sourceDoc.getPageCount();
    const indicesToExtract = parsePageRange(options.pageRange, totalPages);

    const newDoc = await PDFDocument.create();
    if (indicesToExtract.length > 0) {
      const copiedPages = await newDoc.copyPages(sourceDoc, indicesToExtract);
      copiedPages.forEach(p => newDoc.addPage(p));
    } else {
      const [firstPage] = await newDoc.copyPages(sourceDoc, [0]);
      newDoc.addPage(firstPage);
    }

    const outputBytes = await newDoc.save();
    return {
      buffer: Buffer.from(outputBytes),
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
  },

  // 9. Delete PDF Pages
  async 'delete-pdf-pages'(inputBuffer, options = {}) {
    const sourceDoc = await PDFDocument.load(inputBuffer);
    const totalPages = sourceDoc.getPageCount();
    const deleteRange = options.deletePages || options.pageRange || '';
    const indicesToDelete = new Set(parsePageRange(deleteRange, totalPages));

    const newDoc = await PDFDocument.create();
    const indicesToKeep = [];
    for (let i = 0; i < totalPages; i++) {
      if (!indicesToDelete.has(i)) {
        indicesToKeep.push(i);
      }
    }

    if (indicesToKeep.length === 0) {
      throw new Error('Cannot delete all pages of the document. At least one page must remain.');
    }

    const copiedPages = await newDoc.copyPages(sourceDoc, indicesToKeep);
    copiedPages.forEach(p => newDoc.addPage(p));

    const outputBytes = await newDoc.save();
    return {
      buffer: Buffer.from(outputBytes),
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
  },

  // 10. Compress PDF
  async 'compress-pdf'(inputBuffer, options = {}) {
    const pdfDoc = await PDFDocument.load(inputBuffer);
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('Aalq Compression Engine');
    pdfDoc.setCreator('Aalq Document Platform');

    const outputBytes = await pdfDoc.save({ useObjectStreams: true });
    return {
      buffer: Buffer.from(outputBytes),
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
  },

  // 11. PDF to Word (DOCX) (Reconstructs headings, styled paragraphs, bullets, page breaks, images)
  async 'pdf-to-word'(inputBuffer, options = {}) {
    return await convertPdfToDocx(inputBuffer, options);
  },

  // 12. Word to PDF (Preserves tables, headings, styles, fonts, lists, margins via Headless Browser)
  async 'word-to-pdf'(inputBuffer, options = {}) {
    return await convertDocxToPdf(inputBuffer, options);
  },

  // 13. HTML to PDF (Renders actual HTML/CSS structure, tables, fonts, headings, page breaks)
  async 'html-to-pdf'(inputBuffer, options = {}) {
    return await convertHtmlToPdf(inputBuffer, options);
  },

  // 14. PDF to JPG (Renders actual high-resolution JPEG images, 150/300 DPI, full page)
  async 'pdf-to-jpg'(inputBuffer, options = {}) {
    return await convertPdfToImage(inputBuffer, options, 'jpg');
  },

  // 15. PDF to PNG (Lossless high-resolution PNG rendering)
  async 'pdf-to-png'(inputBuffer, options = {}) {
    return await convertPdfToImage(inputBuffer, options, 'png');
  }
};

/**
 * Execute conversion by tool slug
 */
async function executeConversion(toolSlug, inputBuffer, options = {}) {
  const handler = converters[toolSlug];
  if (!handler) {
    throw new Error(`Unsupported conversion tool: ${toolSlug}`);
  }
  return await handler(inputBuffer, options);
}

module.exports = {
  executeConversion,
  converters
};
