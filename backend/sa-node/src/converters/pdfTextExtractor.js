const path = require('path');
const fs = require('fs');

const fontsDir = path.resolve(__dirname, '../../../../node_modules/pdfjs-dist/standard_fonts');

class NodeStandardFontDataFactory {
  async fetch({ filename }) {
    const filePath = path.join(fontsDir, filename);
    if (fs.existsSync(filePath)) {
      return new Uint8Array(fs.readFileSync(filePath));
    }
    return new Uint8Array();
  }
}

/**
 * Extract rich structured text and layout data from PDF buffer
 */
async function extractStructuredPdf(inputBuffer) {
  let pdfjsLib;
  try {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch (err) {
    console.warn('pdfjs-dist import error:', err.message);
    return extractFallbackText(inputBuffer);
  }

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(inputBuffer),
      StandardFontDataFactory: NodeStandardFontDataFactory,
      useSystemFonts: true,
      disableFontFace: true
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pages = [];
    const textLines = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;

      const content = await page.getTextContent();
      const rawItems = content.items || [];

      // Filter and normalize items
      const items = [];
      for (const it of rawItems) {
        if (!it.str && !it.hasEOL) continue;
        const tx = it.transform ? it.transform[4] : 0;
        const ty = it.transform ? it.transform[5] : 0;
        const fontSize = it.transform ? Math.abs(it.transform[0]) || Math.abs(it.transform[3]) || it.height || 10 : 10;
        const fontName = it.fontName || '';
        const isBold = /bold|black|heavy|700|800|900/i.test(fontName);
        const isItalic = /italic|oblique/i.test(fontName);

        items.push({
          str: it.str || '',
          x: tx,
          y: ty,
          width: it.width || 0,
          height: it.height || fontSize,
          fontSize,
          fontName,
          isBold,
          isItalic,
          hasEOL: it.hasEOL || false
        });
      }

      if (items.length === 0) {
        pages.push({
          pageNum,
          width: pageWidth,
          height: pageHeight,
          lines: [],
          paragraphs: []
        });
        continue;
      }

      // Group into lines by Y coordinate (PDF origin is bottom-left, so higher Y is higher on page)
      // Sort items by Y descending (top to bottom)
      items.sort((a, b) => b.y - a.y || a.x - b.x);

      const clusteredLines = [];
      let currentLine = [];
      let currentLineY = null;
      let currentLineHeight = 10;

      for (const item of items) {
        if (currentLineY === null) {
          currentLine = [item];
          currentLineY = item.y;
          currentLineHeight = item.fontSize;
        } else {
          // If within line tolerance
          const tolerance = Math.max(currentLineHeight * 0.45, 3.5);
          if (Math.abs(item.y - currentLineY) <= tolerance) {
            currentLine.push(item);
            currentLineHeight = Math.max(currentLineHeight, item.fontSize);
          } else {
            clusteredLines.push(currentLine);
            currentLine = [item];
            currentLineY = item.y;
            currentLineHeight = item.fontSize;
          }
        }
      }
      if (currentLine.length > 0) {
        clusteredLines.push(currentLine);
      }

      // Process each clustered line: sort left-to-right and assemble words with spacing
      const processedLines = [];
      for (const lineItems of clusteredLines) {
        lineItems.sort((a, b) => a.x - b.x);

        let lineText = '';
        let lastRight = null;
        let lineFontSize = 10;
        let isLineBold = false;
        let isLineItalic = false;
        const lineStartX = lineItems[0].x;
        const lastItem = lineItems[lineItems.length - 1];
        const lineEndX = lastItem.x + lastItem.width;
        const lineY = lineItems[0].y;

        for (let i = 0; i < lineItems.length; i++) {
          const item = lineItems[i];
          lineFontSize = Math.max(lineFontSize, item.fontSize);
          if (item.isBold) isLineBold = true;
          if (item.isItalic) isLineItalic = true;

          const textChunk = item.str;
          if (!textChunk) continue;

          if (lastRight !== null) {
            const gap = item.x - lastRight;
            const spaceThreshold = Math.max(item.fontSize * 0.22, 2.0);
            if (gap >= spaceThreshold && !lineText.endsWith(' ') && !textChunk.startsWith(' ')) {
              lineText += ' ';
            }
          }

          lineText += textChunk;
          lastRight = item.x + item.width;
        }

        const trimmed = lineText.trim();
        if (trimmed.length > 0) {
          // Determine horizontal alignment
          let align = 'left';
          const leftMargin = lineStartX;
          const rightMargin = pageWidth - lineEndX;
          const centerDiff = Math.abs(leftMargin - rightMargin);

          if (centerDiff < 30 && lineStartX > 40 && lineEndX < pageWidth - 40) {
            align = 'center';
          } else if (rightMargin < 60 && leftMargin > 100) {
            align = 'right';
          }

          processedLines.push({
            text: trimmed,
            y: lineY,
            x: lineStartX,
            width: lineEndX - lineStartX,
            fontSize: Math.round(lineFontSize * 10) / 10,
            isBold: isLineBold,
            isItalic: isLineItalic,
            align,
            items: lineItems
          });
        }
      }

      // Group processed lines into structured paragraphs / sections
      const paragraphs = [];
      let currentParaLines = [];
      let prevY = null;
      let prevFontSize = 11;

      for (let i = 0; i < processedLines.length; i++) {
        const line = processedLines[i];

        if (currentParaLines.length === 0) {
          currentParaLines.push(line);
          prevY = line.y;
          prevFontSize = line.fontSize;
          continue;
        }

        const verticalGap = prevY - line.y;
        const standardLineSpacing = prevFontSize * 1.45;
        const isHeading = line.fontSize >= 13.5 || (line.fontSize > prevFontSize + 2 && line.isBold);
        const prevWasHeading = currentParaLines[0].fontSize >= 13.5;
        const isBullet = /^[•\-\*\u2022]|\d+[\.\)]\s/.test(line.text);

        // Break paragraph if gap is large, or if heading, or bullet, or alignment change
        if (
          verticalGap > standardLineSpacing * 1.35 ||
          isHeading ||
          prevWasHeading ||
          isBullet ||
          line.align !== currentParaLines[0].align
        ) {
          paragraphs.push(buildParagraphData(currentParaLines, pageWidth));
          currentParaLines = [line];
        } else {
          currentParaLines.push(line);
        }

        prevY = line.y;
        prevFontSize = line.fontSize;
      }

      if (currentParaLines.length > 0) {
        paragraphs.push(buildParagraphData(currentParaLines, pageWidth));
      }

      pages.push({
        pageNum,
        width: pageWidth,
        height: pageHeight,
        lines: processedLines,
        paragraphs
      });

      // Assemble plain text representation for this page
      const pageParagraphStrings = paragraphs.map(p => p.text);
      if (pageParagraphStrings.length > 0) {
        textLines.push(pageParagraphStrings.join('\n\n'));
      }
    }

    const fullText = textLines.join('\n\n--- Page Break ---\n\n').trim();

    return {
      pages,
      fullText: fullText || 'No text extracted',
      numPages
    };
  } catch (err) {
    console.warn('pdfjs extraction failed, falling back:', err.message);
    return extractFallbackText(inputBuffer);
  }
}

function buildParagraphData(lines, pageWidth) {
  const firstLine = lines[0];
  const isHeading1 = firstLine.fontSize >= 18;
  const isHeading2 = !isHeading1 && firstLine.fontSize >= 14;
  const isHeading3 = !isHeading1 && !isHeading2 && firstLine.fontSize >= 12.5 && firstLine.isBold;
  const isBullet = /^[•\-\*\u2022]|\d+[\.\)]\s/.test(firstLine.text);

  let type = 'paragraph';
  if (isHeading1) type = 'heading1';
  else if (isHeading2) type = 'heading2';
  else if (isHeading3) type = 'heading3';
  else if (isBullet) type = 'bullet';

  // Join lines with space if normal paragraph, or line break if poem/table/heading
  const combinedText = lines.map(l => l.text).join(type === 'paragraph' ? ' ' : '\n');

  return {
    type,
    text: combinedText,
    fontSize: firstLine.fontSize,
    isBold: firstLine.isBold,
    isItalic: firstLine.isItalic,
    align: firstLine.align,
    lines
  };
}

/**
 * Fallback text extraction using pdf-parse or basic pdf-lib decompression
 */
async function extractFallbackText(inputBuffer) {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(inputBuffer);
    const cleaned = (data.text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      pages: [{ pageNum: 1, width: 595, height: 842, lines: [], paragraphs: [{ type: 'paragraph', text: cleaned }] }],
      fullText: cleaned || 'No text extracted',
      numPages: data.numpages || 1
    };
  } catch (e) {
    return {
      pages: [],
      fullText: 'Document text could not be extracted.',
      numPages: 1
    };
  }
}

module.exports = {
  extractStructuredPdf
};
