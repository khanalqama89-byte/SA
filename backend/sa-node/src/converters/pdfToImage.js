const archiver = require('archiver');
const { Writable } = require('stream');
const { PDFDocument, PDFName } = require('pdf-lib');

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
 * Extract embedded JPEG/PNG image objects from PDF
 */
async function extractImagesFromPdfDoc(inputBuffer) {
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
            images.push({ ext: '.jpg', mimeType: 'image/jpeg', buffer: contents });
          } else if (contents.length > 500 && contents[0] === 0x89 && contents[1] === 0x50) {
            images.push({ ext: '.png', mimeType: 'image/png', buffer: contents });
          }
        }
      }
    }
  } catch (err) {}
  return images;
}

/**
 * High-Fidelity PDF to Image Converter
 * Works both locally (via canvas) and on Serverless (via visual extractor + single page archive fallback)
 */
async function convertPdfToImage(inputBuffer, options = {}, outputFormat = 'jpg') {
  const mimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
  const ext = outputFormat === 'png' ? '.png' : '.jpg';

  // Strategy 1: Canvas rendering via @napi-rs/canvas if available
  try {
    const { createCanvas, Path2D } = require('@napi-rs/canvas');
    if (Path2D && !globalThis.Path2D) {
      globalThis.Path2D = Path2D;
    }

    let pdfjsLib;
    try {
      pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
    } catch {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(inputBuffer),
      useSystemFonts: true,
      disableFontFace: true
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const dpi = parseInt(options.dpi || options.resolution || '150', 10);
    const scale = dpi >= 300 ? 4.16 : dpi <= 96 ? 1.33 : 2.08;

    const requestedPage = options.page ? parseInt(options.page, 10) : null;
    const isSinglePage = numPages === 1 || (requestedPage && requestedPage >= 1 && requestedPage <= numPages);

    if (isSinglePage) {
      const pageNumber = requestedPage || 1;
      const page = await pdfDoc.getPage(pageNumber);
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
      const imgBuffer = canvas.toBuffer(mimeType);

      return {
        buffer: imgBuffer,
        extension: ext,
        mimeType
      };
    }

    // Multi-page PDF
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
      archive.append(canvas.toBuffer(mimeType), { name: `page-${i}${ext}` });
    }

    await archive.finalize();
    const zipBuffer = await bufferPromise;

    return {
      buffer: zipBuffer,
      extension: '.zip',
      mimeType: 'application/zip'
    };
  } catch (canvasErr) {
    // Strategy 2: Serverless fallback: extract embedded visuals directly
    const extractedImages = await extractImagesFromPdfDoc(inputBuffer);
    if (extractedImages.length === 1) {
      return {
        buffer: extractedImages[0].buffer,
        extension: extractedImages[0].ext,
        mimeType: extractedImages[0].mimeType
      };
    } else if (extractedImages.length > 1) {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const bufferPromise = archiverToBuffer(archive);
      for (let i = 0; i < extractedImages.length; i++) {
        archive.append(extractedImages[i].buffer, { name: `image-${i + 1}${extractedImages[i].ext}` });
      }
      await archive.finalize();
      return {
        buffer: await bufferPromise,
        extension: '.zip',
        mimeType: 'application/zip'
      };
    }

    // Strategy 3: Informative error if canvas is unavailable and no embedded raster images exist
    throw new Error('Image rendering requires canvas acceleration which is not supported for this document format on the server. Please convert via the interactive web tool.');
  }
}

module.exports = {
  convertPdfToImage
};
