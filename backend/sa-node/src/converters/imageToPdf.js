const { PDFDocument } = require('pdf-lib');

const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612.0, height: 792.0 }
};

const MARGIN_VALUES = {
  none: 0,
  small: 20,
  standard: 36,
  wide: 54
};

/**
 * High-fidelity Image (JPG / PNG) to PDF Converter
 * Preserves exact aspect ratio, auto-centers, handles portrait/landscape, and standard page sizes.
 */
async function convertImageToPdf(inputBuffer, options = {}) {
  const pdfDoc = await PDFDocument.create();

  // Detect image type (JPEG vs PNG)
  let embeddedImage;
  const isPng = inputBuffer[0] === 0x89 && inputBuffer[1] === 0x50 && inputBuffer[2] === 0x4e && inputBuffer[3] === 0x47;
  const isJpg = inputBuffer[0] === 0xff && inputBuffer[1] === 0xd8;

  if (isPng) {
    embeddedImage = await pdfDoc.embedPng(inputBuffer);
  } else if (isJpg) {
    embeddedImage = await pdfDoc.embedJpg(inputBuffer);
  } else {
    // Attempt JPG then PNG fallback
    try {
      embeddedImage = await pdfDoc.embedJpg(inputBuffer);
    } catch {
      embeddedImage = await pdfDoc.embedPng(inputBuffer);
    }
  }

  const imgWidth = embeddedImage.width;
  const imgHeight = embeddedImage.height;
  const imgAspect = imgWidth / imgHeight;

  const pageSizeOpt = (options.pageSize || 'A4').toUpperCase();
  const orientationOpt = (options.orientation || 'auto').toLowerCase();
  const marginOpt = (options.margin || 'standard').toLowerCase();
  const fitMode = (options.fitMode || 'fit').toLowerCase();

  // Mode 1: Fit Page to Image Dimensions Exactly
  if (pageSizeOpt === 'FIT_IMAGE' || pageSizeOpt === 'FIT') {
    const page = pdfDoc.addPage([imgWidth, imgHeight]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: imgWidth,
      height: imgHeight
    });
    const pdfBytes = await pdfDoc.save();
    return {
      buffer: Buffer.from(pdfBytes),
      extension: '.pdf',
      mimeType: 'application/pdf'
    };
  }

  // Mode 2: Standard Page (A4 or US Letter) with Proper Margins and Centering
  const baseDim = PAGE_SIZES[pageSizeOpt] || PAGE_SIZES.A4;
  let pageWidth = baseDim.width;
  let pageHeight = baseDim.height;

  // Determine orientation
  let isLandscape = false;
  if (orientationOpt === 'landscape') {
    isLandscape = true;
  } else if (orientationOpt === 'portrait') {
    isLandscape = false;
  } else {
    // Auto: match image orientation
    isLandscape = imgAspect > 1.15;
  }

  if (isLandscape) {
    pageWidth = Math.max(baseDim.width, baseDim.height);
    pageHeight = Math.min(baseDim.width, baseDim.height);
  } else {
    pageWidth = Math.min(baseDim.width, baseDim.height);
    pageHeight = Math.max(baseDim.width, baseDim.height);
  }

  const margin = MARGIN_VALUES[marginOpt] !== undefined ? MARGIN_VALUES[marginOpt] : MARGIN_VALUES.standard;
  const printableWidth = Math.max(pageWidth - 2 * margin, 50);
  const printableHeight = Math.max(pageHeight - 2 * margin, 50);

  let drawWidth = imgWidth;
  let drawHeight = imgHeight;

  if (fitMode === 'fill') {
    drawWidth = printableWidth;
    drawHeight = printableHeight;
  } else {
    // Default 'fit': scale down (or up) to fit within printable area preserving aspect ratio
    const scale = Math.min(printableWidth / imgWidth, printableHeight / imgHeight);
    drawWidth = imgWidth * scale;
    drawHeight = imgHeight * scale;
  }

  // Calculate centered coordinates
  const drawX = margin + (printableWidth - drawWidth) / 2;
  const drawY = margin + (printableHeight - drawHeight) / 2;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(embeddedImage, {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight
  });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    extension: '.pdf',
    mimeType: 'application/pdf'
  };
}

module.exports = {
  convertImageToPdf
};
