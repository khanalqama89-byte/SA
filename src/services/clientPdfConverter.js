import JSZip from 'jszip';

/**
 * Client-Side High-Fidelity PDF to Image Converter
 * Uses browser HTML5 canvas and pdfjs-dist for crisp 150/300 DPI rendering.
 * Produces real JPEG/PNG files (or a ZIP of real images for multi-page documents).
 */
export async function convertPdfToImagesClient(file, toolSlug, options = {}) {
  const isPng = toolSlug === 'pdf-to-png';
  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const ext = isPng ? '.png' : '.jpg';

  const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {}

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const dpi = parseInt(options.dpi || options.resolution || '150', 10);
  const scale = dpi >= 300 ? 3.5 : dpi <= 96 ? 1.33 : 2.08;

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  // 1. Single Page Document: Return direct image
  if (numPages === 1) {
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL(mimeType, 0.92);
    const base64Data = dataUrl.split(',')[1];
    const byteString = atob(base64Data);
    const size = byteString.length;

    return {
      outputFileName: `${baseName}_converted${ext}`,
      targetFormat: isPng ? 'png' : 'jpg',
      mimeType,
      size,
      fileBase64: base64Data
    };
  }

  // 2. Multi-Page Document: Bundle real images into ZIP
  const zip = new JSZip();
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL(mimeType, 0.92);
    const b64 = dataUrl.split(',')[1];
    zip.file(`page-${i}${ext}`, b64, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipBase64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(zipBlob);
  });

  return {
    outputFileName: `${baseName}_images.zip`,
    targetFormat: 'zip',
    mimeType: 'application/zip',
    size: zipBlob.size,
    fileBase64: zipBase64
  };
}
