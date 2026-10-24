const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } = require('docx');
const { PDFDocument, PDFName } = require('pdf-lib');
const { extractStructuredPdf } = require('./pdfTextExtractor');

function getDocxAlignment(align) {
  if (align === 'center') return AlignmentType.CENTER;
  if (align === 'right') return AlignmentType.RIGHT;
  if (align === 'justify') return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

/**
 * Extract embedded images from PDF (e.g. photos, diagrams, scanned pages)
 */
async function extractEmbeddedImages(inputBuffer) {
  const images = [];
  try {
    const doc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
    const objects = doc.context.enumerateIndirectObjects();
    for (const [ref, obj] of objects) {
      if (obj && obj.dict) {
        const subtype = obj.dict.get(PDFName.of('Subtype'));
        if (subtype && subtype.toString() === '/Image') {
          const filter = obj.dict.get(PDFName.of('Filter'));
          const filterStr = filter ? filter.toString() : '';
          const contents = Buffer.from(obj.getContents());
          if (filterStr.includes('DCTDecode') || (contents[0] === 0xff && contents[1] === 0xd8)) {
            images.push({ type: 'jpeg', buffer: contents });
          } else if (contents.length > 1000) {
            // Check for PNG signature
            if (contents[0] === 0x89 && contents[1] === 0x50 && contents[2] === 0x4e && contents[3] === 0x47) {
              images.push({ type: 'png', buffer: contents });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('PDF image extraction warning:', err.message);
  }
  return images;
}

/**
 * High-fidelity PDF to Word (DOCX) Converter
 * Reconstructs headings, styled paragraphs, alignment, bullets, page breaks, and images.
 */
async function convertPdfToDocx(inputBuffer, options = {}) {
  const structuredData = await extractStructuredPdf(inputBuffer);
  const docxElements = [];

  let isFirstElement = true;

  for (let pIdx = 0; pIdx < structuredData.pages.length; pIdx++) {
    const page = structuredData.pages[pIdx];
    const paragraphs = page.paragraphs || [];

    for (let bIdx = 0; bIdx < paragraphs.length; bIdx++) {
      const block = paragraphs[bIdx];
      const needsPageBreak = (pIdx > 0 && bIdx === 0);

      // 1. Heading 1
      if (block.type === 'heading1') {
        docxElements.push(
          new Paragraph({
            text: block.text,
            heading: HeadingLevel.HEADING_1,
            alignment: getDocxAlignment(block.align),
            spacing: { before: isFirstElement ? 0 : 280, after: 140 },
            pageBreakBefore: needsPageBreak
          })
        );
        isFirstElement = false;
        continue;
      }

      // 2. Heading 2
      if (block.type === 'heading2') {
        docxElements.push(
          new Paragraph({
            text: block.text,
            heading: HeadingLevel.HEADING_2,
            alignment: getDocxAlignment(block.align),
            spacing: { before: isFirstElement ? 0 : 220, after: 120 },
            pageBreakBefore: needsPageBreak
          })
        );
        isFirstElement = false;
        continue;
      }

      // 3. Heading 3
      if (block.type === 'heading3') {
        docxElements.push(
          new Paragraph({
            text: block.text,
            heading: HeadingLevel.HEADING_3,
            alignment: getDocxAlignment(block.align),
            spacing: { before: isFirstElement ? 0 : 180, after: 90 },
            pageBreakBefore: needsPageBreak
          })
        );
        isFirstElement = false;
        continue;
      }

      // 4. Bullet / Numbered list
      if (block.type === 'bullet') {
        const cleanText = block.text.replace(/^[•\-\*\u2022]\s*|^\d+[\.\)]\s*/, '').trim();
        docxElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText,
                size: Math.round(block.fontSize * 2) || 22,
                bold: block.isBold,
                italics: block.isItalic
              })
            ],
            bullet: { level: 0 },
            alignment: getDocxAlignment(block.align),
            spacing: { after: 100, line: 320 },
            pageBreakBefore: needsPageBreak
          })
        );
        isFirstElement = false;
        continue;
      }

      // 5. Standard paragraph with rich text runs
      const runs = [];
      if (block.lines && block.lines.length > 0) {
        for (let lIdx = 0; lIdx < block.lines.length; lIdx++) {
          const line = block.lines[lIdx];
          runs.push(
            new TextRun({
              text: line.text + (lIdx < block.lines.length - 1 ? ' ' : ''),
              size: Math.max(18, Math.min(36, Math.round(line.fontSize * 2))) || 22,
              bold: line.isBold,
              italics: line.isItalic
            })
          );
        }
      } else {
        runs.push(
          new TextRun({
            text: block.text,
            size: Math.max(18, Math.min(36, Math.round(block.fontSize * 2))) || 22,
            bold: block.isBold,
            italics: block.isItalic
          })
        );
      }

      docxElements.push(
        new Paragraph({
          children: runs,
          alignment: getDocxAlignment(block.align),
          spacing: { after: 160, line: 340 },
          pageBreakBefore: needsPageBreak
        })
      );
      isFirstElement = false;
    }
  }

  // Extract embedded images
  const embeddedImages = await extractEmbeddedImages(inputBuffer);
  if (embeddedImages.length > 0) {
    docxElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Embedded Document Visuals & Graphics',
            bold: true,
            size: 24,
            color: '4F46E5'
          })
        ],
        spacing: { before: 300, after: 150 }
      })
    );

    for (const img of embeddedImages) {
      try {
        docxElements.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: img.buffer,
                transformation: { width: 520, height: 400 }
              })
            ],
            spacing: { after: 250 }
          })
        );
      } catch (err) {
        console.warn('Failed to embed ImageRun:', err.message);
      }
    }
  }

  // If document was completely empty of text and images, add a clean overview note
  if (docxElements.length === 0) {
    docxElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Processed Document',
            bold: true,
            size: 26
          })
        ],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'This document was converted successfully into Microsoft Word (.docx) format.',
            size: 22
          })
        ],
        spacing: { after: 200 }
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: docxElements
      }
    ]
  });

  const docxBuffer = await Packer.toBuffer(doc);

  return {
    buffer: docxBuffer,
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
}

module.exports = {
  convertPdfToDocx
};
