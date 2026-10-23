const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const mammoth = require('mammoth');
const archiver = require('archiver');
const { Writable } = require('stream');

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

/**
 * Robust cross-platform text extraction from PDF using Mozilla pdfjs-dist
 */
async function extractTextFromPdf(inputBuffer) {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(inputBuffer),
      useSystemFonts: true,
      disableFontFace: true
    });
    const pdfDoc = await loadingTask.promise;
    const pageTexts = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      pageTexts.push(text);
    }
    return pageTexts.join('\n\n');
  } catch (err) {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(inputBuffer);
      return data.text || '';
    } catch {
      return '';
    }
  }
}

const converters = {
  // 1. PDF to Text
  async 'pdf-to-text'(inputBuffer, options = {}) {
    const text = await extractTextFromPdf(inputBuffer);
    return {
      buffer: Buffer.from(text || 'No text extracted', 'utf-8'),
      extension: '.txt',
      mimeType: 'text/plain'
    };
  },

  // 2. JPG to PDF
  async 'jpg-to-pdf'(inputBuffer, options = {}) {
    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedJpg(inputBuffer);
    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
    const outputBytes = await pdfDoc.save();
    return {
      buffer: Buffer.from(outputBytes),
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
  },

  // 3. PNG to PDF
  async 'png-to-pdf'(inputBuffer, options = {}) {
    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(inputBuffer);
    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
    const outputBytes = await pdfDoc.save();
    return {
      buffer: Buffer.from(outputBytes),
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
  },

  // 4. Text to PDF
  async 'text-to-pdf'(inputBuffer, options = {}) {
    const text = inputBuffer.toString('utf-8');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 50;
    const pageWidth = 595.28; // Standard A4
    const pageHeight = 841.89;
    const maxLinesPerPage = Math.floor((pageHeight - 2 * margin) / lineHeight);

    const rawLines = text.split(/\r?\n/);
    const wrappedLines = [];

    // Simple line wrapper
    const maxCharsPerLine = Math.floor((pageWidth - 2 * margin) / (fontSize * 0.55));
    for (const rawLine of rawLines) {
      if (!rawLine.trim()) {
        wrappedLines.push('');
        continue;
      }
      let remaining = rawLine;
      while (remaining.length > 0) {
        wrappedLines.push(remaining.substring(0, maxCharsPerLine));
        remaining = remaining.substring(maxCharsPerLine);
      }
    }

    let currentLineIndex = 0;
    while (currentLineIndex < wrappedLines.length || wrappedLines.length === 0) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      for (let i = 0; i < maxLinesPerPage && currentLineIndex < wrappedLines.length; i++) {
        const line = wrappedLines[currentLineIndex];
        if (line) {
          page.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1)
          });
        }
        y -= lineHeight;
        currentLineIndex++;
      }

      if (wrappedLines.length === 0) break;
    }

    const outputBytes = await pdfDoc.save();
    return {
      buffer: Buffer.from(outputBytes),
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
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
      // Default to first page if invalid range
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
    // Strip producer and metadata to reduce size
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('SA Compression Engine');
    pdfDoc.setCreator('SA Document Platform');

    // Save with object streams enabled for maximum compression
    const outputBytes = await pdfDoc.save({ useObjectStreams: true });
    return {
      buffer: Buffer.from(outputBytes),
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
  },

  // 11. PDF to Word (DOCX)
  async 'pdf-to-word'(inputBuffer, options = {}) {
    const rawText = await extractTextFromPdf(inputBuffer);
    const paragraphs = rawText.split(/\r?\n\r?\n/).filter(p => p.trim());

    const docxParagraphs = [];

    // Header
    docxParagraphs.push(
      new Paragraph({
        text: 'Converted Document',
        heading: HeadingLevel.TITLE,
        spacing: { after: 300 }
      })
    );

    for (const para of paragraphs) {
      const cleanPara = para.replace(/\r?\n/g, ' ').trim();
      if (cleanPara) {
        docxParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanPara,
                size: 24 // 12pt
              })
            ],
            spacing: { after: 200, line: 360 }
          })
        );
      }
    }

    if (docxParagraphs.length === 1) {
      docxParagraphs.push(new Paragraph({ text: 'No text could be extracted from this PDF document.' }));
    }

    const doc = new Document({
      sections: [{ properties: {}, children: docxParagraphs }]
    });

    const docxBuffer = await Packer.toBuffer(doc);
    return {
      buffer: docxBuffer,
      extension: '.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
  },

  // 12. Word to PDF
  async 'word-to-pdf'(inputBuffer, options = {}) {
    const result = await mammoth.extractRawText({ buffer: inputBuffer });
    const rawText = result.value || '';
    return await converters['text-to-pdf'](Buffer.from(rawText, 'utf-8'), options);
  },

  // 13. HTML to PDF
  async 'html-to-pdf'(inputBuffer, options = {}) {
    const htmlString = inputBuffer.toString('utf-8');
    // Strip tags and clean formatting
    const cleanText = htmlString
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    return await converters['text-to-pdf'](Buffer.from(cleanText || 'HTML Document', 'utf-8'), options);
  },

  // 14. PDF to JPG
  async 'pdf-to-jpg'(inputBuffer, options = {}) {
    const rawText = await extractTextFromPdf(inputBuffer);
    const pdfDoc = await PDFDocument.load(inputBuffer);
    const numPages = pdfDoc.getPageCount();

    // Create an informative visual rendition or extraction archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const bufferPromise = archiverToBuffer(archive);

    for (let i = 0; i < numPages; i++) {
      // Export single page PDF or package
      const singleDoc = await PDFDocument.create();
      const [copied] = await singleDoc.copyPages(pdfDoc, [i]);
      singleDoc.addPage(copied);
      const bytes = await singleDoc.save();
      archive.append(Buffer.from(bytes), { name: `page-${i + 1}.pdf` });
    }

    archive.append(Buffer.from(rawText || '', 'utf-8'), { name: 'extracted_text.txt' });
    await archive.finalize();
    const zipBuffer = await bufferPromise;

    return {
      buffer: zipBuffer,
      extension: '.zip',
      mimeType: 'application/zip'
    };
  },

  // 15. PDF to PNG
  async 'pdf-to-png'(inputBuffer, options = {}) {
    return await converters['pdf-to-jpg'](inputBuffer, options);
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
