const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612.0, height: 792.0 }
};

/**
 * Clean word-wrapping helper using actual font metrics
 */
function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue;

    const testLine = currentLine ? `${currentLine} ${word}` : word;
    let testWidth = 0;
    try {
      testWidth = font.widthOfTextAtSize(testLine, fontSize);
    } catch {
      testWidth = testLine.length * fontSize * 0.55;
    }

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      // If a single word is wider than maxWidth, hard wrap it
      let singleWordWidth = 0;
      try { singleWordWidth = font.widthOfTextAtSize(word, fontSize); } catch { singleWordWidth = word.length * fontSize * 0.55; }

      if (singleWordWidth > maxWidth) {
        let chunk = '';
        for (const char of word) {
          const testChunk = chunk + char;
          const chunkWidth = font.widthOfTextAtSize ? font.widthOfTextAtSize(testChunk, fontSize) : testChunk.length * fontSize * 0.55;
          if (chunkWidth <= maxWidth) {
            chunk = testChunk;
          } else {
            lines.push(chunk);
            chunk = char;
          }
        }
        currentLine = chunk;
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * High-fidelity Plain Text to PDF Converter
 * Preserves paragraphs, wraps cleanly at word boundaries, supports headings & lists, and multi-page layout.
 */
async function convertTextToPdf(inputBuffer, options = {}) {
  const rawText = inputBuffer.toString('utf-8').replace(/\r\n/g, '\n');
  const pdfDoc = await PDFDocument.create();

  // Page dimensions
  const pageSizeKey = (options.pageSize || 'A4').toUpperCase();
  const pageDim = PAGE_SIZES[pageSizeKey] || PAGE_SIZES.A4;
  const pageWidth = pageDim.width;
  const pageHeight = pageDim.height;

  // Formatting options
  const baseFontSize = parseInt(options.fontSize || '11', 10);
  const lineSpacingMultiplier = parseFloat(options.lineSpacing || '1.5');
  const margin = parseInt(options.margin || '45', 10);
  const printableWidth = pageWidth - 2 * margin;

  // Font selection
  let normalFont;
  let boldFont;
  const fontChoice = (options.font || 'Helvetica').toLowerCase();

  if (fontChoice.includes('times')) {
    normalFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  } else if (fontChoice.includes('courier')) {
    normalFont = await pdfDoc.embedFont(StandardFonts.Courier);
    boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
  } else {
    normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const rawBlocks = rawText.split(/\n\s*\n/);
  const pages = [];

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  pages.push(currentPage);
  let currentY = pageHeight - margin;

  const checkPageSpace = (requiredHeight) => {
    if (currentY - requiredHeight < margin + 30) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pages.push(currentPage);
      currentY = pageHeight - margin;
    }
  };

  for (let block of rawBlocks) {
    block = block.trim();
    if (!block) continue;

    // Detect Markdown-style headings or Section Titles
    let isHeading1 = false;
    let isHeading2 = false;
    let isBullet = false;
    let cleanText = block;

    if (block.startsWith('# ')) {
      isHeading1 = true;
      cleanText = block.substring(2).trim();
    } else if (block.startsWith('## ')) {
      isHeading2 = true;
      cleanText = block.substring(3).trim();
    } else if (block.length < 50 && /^[A-Z0-9\s:,\-\.]{4,}$/.test(block) && !block.includes('.')) {
      isHeading2 = true;
    } else if (/^[•\-\*\u2022]|\d+[\.\)]\s/.test(block)) {
      isBullet = true;
    }

    const fontSize = isHeading1 ? baseFontSize + 6 : isHeading2 ? baseFontSize + 3 : baseFontSize;
    const font = (isHeading1 || isHeading2) ? boldFont : normalFont;
    const lineHeight = fontSize * lineSpacingMultiplier;
    const textColor = isHeading1 ? rgb(0.06, 0.09, 0.16) : isHeading2 ? rgb(0.12, 0.16, 0.24) : rgb(0.15, 0.18, 0.25);

    // Indent bullets
    const indentX = isBullet ? margin + 14 : margin;
    const availableLineWidth = isBullet ? printableWidth - 14 : printableWidth;

    const lines = wrapText(cleanText, font, fontSize, availableLineWidth);
    const blockHeight = lines.length * lineHeight + (isHeading1 ? 16 : isHeading2 ? 12 : 8);

    checkPageSpace(blockHeight);

    // If heading, add subtle top spacing
    if (isHeading1 || isHeading2) {
      currentY -= 6;
    }

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];

      currentPage.drawText(lineText, {
        x: indentX,
        y: currentY,
        size: fontSize,
        font,
        color: textColor
      });

      currentY -= lineHeight;
    }

    // Paragraph bottom spacing
    currentY -= (isHeading1 ? 12 : isHeading2 ? 8 : 6);
  }

  // Draw clean running page numbers in footer
  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const footerText = `Page ${i + 1} of ${totalPages}`;
    const footerWidth = normalFont.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
      x: (pageWidth - footerWidth) / 2,
      y: margin - 15,
      size: 9,
      font: normalFont,
      color: rgb(0.55, 0.6, 0.68)
    });
  }

  const outputBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(outputBytes),
    extension: '.pdf',
    mimeType: 'application/pdf'
  };
}

module.exports = {
  convertTextToPdf
};
