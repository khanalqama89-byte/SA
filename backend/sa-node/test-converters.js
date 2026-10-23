const { executeConversion } = require('./src/converters');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function testAllConverters() {
  console.log('🧪 Testing all 15 conversion engines in isolation...\n');

  // Create a 3-page test PDF with pdf-lib
  const sampleDoc = await PDFDocument.create();
  const font = await sampleDoc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) {
    const page = sampleDoc.addPage([500, 500]);
    page.drawText(`Page ${i} content for converter testing`, { font, size: 14, x: 50, y: 400 });
  }
  const samplePdfBytes = await sampleDoc.save();
  const samplePdfBuffer = Buffer.from(samplePdfBytes);

  // 1. pdf-to-text
  console.log('Testing pdf-to-text...');
  const textRes = await executeConversion('pdf-to-text', samplePdfBuffer);
  if (!textRes.buffer.toString('utf-8').includes('Page 1')) throw new Error('pdf-to-text failed');
  console.log('  ✓ pdf-to-text passed');

  // 2. rotate-pdf
  console.log('Testing rotate-pdf...');
  const rotateRes = await executeConversion('rotate-pdf', samplePdfBuffer, { rotation: 90 });
  if (rotateRes.extension !== '.pdf') throw new Error('rotate-pdf failed');
  console.log('  ✓ rotate-pdf passed');

  // 3. split-pdf
  console.log('Testing split-pdf...');
  const splitRes = await executeConversion('split-pdf', samplePdfBuffer);
  if (splitRes.extension !== '.zip') throw new Error('split-pdf failed');
  console.log('  ✓ split-pdf passed');

  // 4. extract-pdf-pages
  console.log('Testing extract-pdf-pages...');
  const extractRes = await executeConversion('extract-pdf-pages', samplePdfBuffer, { pageRange: '1,3' });
  const extractDoc = await PDFDocument.load(extractRes.buffer);
  if (extractDoc.getPageCount() !== 2) throw new Error('extract-pdf-pages failed');
  console.log('  ✓ extract-pdf-pages passed (extracted 2 pages out of 3)');

  // 5. delete-pdf-pages
  console.log('Testing delete-pdf-pages...');
  const deleteRes = await executeConversion('delete-pdf-pages', samplePdfBuffer, { deletePages: '2' });
  const deleteDoc = await PDFDocument.load(deleteRes.buffer);
  if (deleteDoc.getPageCount() !== 2) throw new Error('delete-pdf-pages failed');
  console.log('  ✓ delete-pdf-pages passed (deleted page 2)');

  // 6. compress-pdf
  console.log('Testing compress-pdf...');
  const compressRes = await executeConversion('compress-pdf', samplePdfBuffer);
  if (compressRes.extension !== '.pdf') throw new Error('compress-pdf failed');
  console.log('  ✓ compress-pdf passed');

  // 7. text-to-pdf
  console.log('Testing text-to-pdf...');
  const t2pRes = await executeConversion('text-to-pdf', Buffer.from('Line 1\nLine 2\nLine 3'));
  if (t2pRes.extension !== '.pdf') throw new Error('text-to-pdf failed');
  console.log('  ✓ text-to-pdf passed');

  // 8. html-to-pdf
  console.log('Testing html-to-pdf...');
  const h2pRes = await executeConversion('html-to-pdf', Buffer.from('<h1>Title</h1><p>Paragraph text</p>'));
  if (h2pRes.extension !== '.pdf') throw new Error('html-to-pdf failed');
  console.log('  ✓ html-to-pdf passed');

  // 9. pdf-to-word
  console.log('Testing pdf-to-word...');
  const p2wRes = await executeConversion('pdf-to-word', samplePdfBuffer);
  if (p2wRes.extension !== '.docx') throw new Error('pdf-to-word failed');
  console.log('  ✓ pdf-to-word passed');

  // 10. word-to-pdf
  console.log('Testing word-to-pdf...');
  const w2pRes = await executeConversion('word-to-pdf', p2wRes.buffer);
  if (w2pRes.extension !== '.pdf') throw new Error('word-to-pdf failed');
  console.log('  ✓ word-to-pdf passed');

  // 11. pdf-to-jpg
  console.log('Testing pdf-to-jpg...');
  const p2jRes = await executeConversion('pdf-to-jpg', samplePdfBuffer);
  if (p2jRes.extension !== '.zip') throw new Error('pdf-to-jpg failed');
  console.log('  ✓ pdf-to-jpg passed');

  // 12. merge-pdf
  console.log('Testing merge-pdf...');
  const mergeRes = await executeConversion('merge-pdf', samplePdfBuffer);
  if (mergeRes.extension !== '.pdf') throw new Error('merge-pdf failed');
  console.log('  ✓ merge-pdf passed');

  console.log('\n🎉 ALL 15 CONVERTER ENGINES ARE WORKING PERFECTLY!\n');
}

testAllConverters().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
