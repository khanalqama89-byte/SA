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
          const contents = Buffer.from(obj.contents || []);
          if (filterStr.includes('DCTDecode') || (contents[0] === 0xff && contents[1] === 0xd8)) {
            images.push({ type: 'jpeg', buffer: contents });
          } else if (contents.length > 500) {
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
 * High-Fidelity PDF to Word (DOCX) Converter
 * Converts headings, paragraphs, bullet lists, page breaks, and embedded images.
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

      // Split multiline block into separate sub-paragraphs if needed
      const subLines = (block.text || '').split('\n').map(l => l.trim()).filter(Boolean);
      if (subLines.length === 0) continue;

      // 1. Heading 1
      if (block.type === 'heading1') {
        docxElements.push(
          new Paragraph({
            text: subLines.join(' '),
            heading: HeadingLevel.HEADING_1,
            alignment: getDocxAlignment(block.align),
            spacing: { before: isFirstElement ? 0 : 260, after: 120 },
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
            text: subLines.join(' '),
            heading: HeadingLevel.HEADING_2,
            alignment: getDocxAlignment(block.align),
            spacing: { before: isFirstElement ? 0 : 200, after: 100 },
            pageBreakBefore: needsPageBreak
          })
        );
        isFirstElement = false;
        continue;
      }

      // 3. Bullet / Numbered list item
      if (block.type === 'bullet') {
        for (const line of subLines) {
          const cleanText = line.replace(/^[•\-\*\u2022]\s*|^\d+[\.\)]\s*/, '').trim();
          docxElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanText,
                  size: 22 // 11pt
                })
              ],
              bullet: { level: 0 },
              spacing: { after: 100, line: 300 },
              pageBreakBefore: needsPageBreak && isFirstElement
            })
          );
          isFirstElement = false;
        }
        continue;
      }

      // 4. Standard Paragraph(s)
      for (const line of subLines) {
        docxElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 22,
                bold: block.isBold || false,
                italics: block.isItalic || false
              })
            ],
            alignment: getDocxAlignment(block.align),
            spacing: { after: 140, line: 320 },
            pageBreakBefore: needsPageBreak && isFirstElement
          })
        );
        isFirstElement = false;
      }
    }
  }

  // Extract embedded images (e.g. diagrams, photos, scanned pages)
  const embeddedImages = await extractEmbeddedImages(inputBuffer);
  if (embeddedImages.length > 0) {
    if (docxElements.length > 0) {
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
    }

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
        console.warn('Failed to embed image into docx:', err.message);
      }
    }
  }

  // If document was completely empty, extract basic document metadata overview
  if (docxElements.length === 0) {
    let pageCount = 1;
    try {
      const doc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
      pageCount = doc.getPageCount();
    } catch {}

    docxElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Document Content Overview (${pageCount} page${pageCount > 1 ? 's' : ''})`,
            bold: true,
            size: 26
          })
        ],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: structuredData.fullText || 'This document has been converted into Microsoft Word (.docx) format.',
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
