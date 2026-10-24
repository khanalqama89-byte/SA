const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { Writable } = require('stream');
const { createCanvas } = require('@napi-rs/canvas');

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
 * Render PDF page(s) to crystal-clear high-resolution images (JPEG or PNG)
 */
async function convertPdfToImage(inputBuffer, options = {}, outputFormat = 'jpg') {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(inputBuffer),
    StandardFontDataFactory: NodeStandardFontDataFactory,
    useSystemFonts: true,
    disableFontFace: true
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  // Determine scale from DPI (72 DPI is 1.0)
  const dpi = parseInt(options.dpi || options.resolution || '150', 10);
  let scale = 2.08; // default 150 DPI
  if (dpi >= 300) scale = 4.16;
  else if (dpi <= 96) scale = 1.33;

  const mimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
  const ext = outputFormat === 'png' ? '.png' : '.jpg';

  // If user requested a specific single page or document has only 1 page
  const requestedPage = options.page ? parseInt(options.page, 10) : null;
  const isSinglePage = numPages === 1 || (requestedPage && requestedPage >= 1 && requestedPage <= numPages);

  if (isSinglePage) {
    const pageNumber = requestedPage || 1;
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');

    // Solid white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    // Compatibility shim for pdfjs fill calls with Path2D
    const origFill = ctx.fill.bind(ctx);
    ctx.fill = function(...args) {
      if (args.length === 1 && typeof args[0] === 'object') {
        try { return origFill(args[0]); } catch { return origFill(); }
      }
      return origFill(...args);
    };

    await page.render({ canvasContext: ctx, viewport }).promise;
    const imgBuffer = canvas.toBuffer(mimeType);

    return {
      buffer: imgBuffer,
      extension: ext,
      mimeType
    };
  }

  // Multi-page PDF: render each page and bundle into high quality ZIP
  const archive = archiver('zip', { zlib: { level: 9 } });
  const bufferPromise = archiverToBuffer(archive);

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    const origFill = ctx.fill.bind(ctx);
    ctx.fill = function(...args) {
      if (args.length === 1 && typeof args[0] === 'object') {
        try { return origFill(args[0]); } catch { return origFill(); }
      }
      return origFill(...args);
    };

    await page.render({ canvasContext: ctx, viewport }).promise;
    const pageImgBuffer = canvas.toBuffer(mimeType);

    archive.append(pageImgBuffer, { name: `page-${i}${ext}` });
  }

  await archive.finalize();
  const zipBuffer = await bufferPromise;

  return {
    buffer: zipBuffer,
    extension: '.zip',
    mimeType: 'application/zip'
  };
}

module.exports = {
  convertPdfToImage
};
