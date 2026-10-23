const app = require('./src/app');
const http = require('http');

async function runTests() {
  console.log('🧪 Starting SA Node.js backend validation suite...\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(8081, resolve));
  const baseUrl = 'http://localhost:8081';

  try {
    // 1. Health Check
    console.log('1. Checking /api/health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    console.log('   Health response:', healthJson);
    if (healthJson.status !== 'UP') throw new Error('Health check failed');

    // 2. Tools List
    console.log('\n2. Checking /api/tools...');
    const toolsRes = await fetch(`${baseUrl}/api/tools`);
    const toolsJson = await toolsRes.json();
    console.log(`   Retrieved ${toolsJson.data.length} tools. First tool:`, toolsJson.data[0].name);
    if (toolsJson.data.length !== 15) throw new Error(`Expected 15 tools, got ${toolsJson.data.length}`);

    // 3. User Registration & Login
    console.log('\n3. Testing User Registration & Login...');
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
      })
    });
    const regJson = await regRes.json();
    if (!regJson.success) throw new Error('Registration failed: ' + regJson.message);
    console.log('   Registered user ID:', regJson.data.id);

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regJson.data.email,
        password: 'password123'
      })
    });
    const loginJson = await loginRes.json();
    if (!loginJson.data?.token) throw new Error('Login failed to return token');
    const token = loginJson.data.token;
    console.log('   Login successful, JWT token acquired');

    // 4. File Upload (Text file)
    console.log('\n4. Testing File Upload (Text Document)...');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const textContent = 'Hello from SA Document Converter Platform!\nThis is a test conversion document generated for verification.';
    const bodyBuffer = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.txt"\r\nContent-Type: text/plain\r\n\r\n`),
      Buffer.from(textContent, 'utf-8'),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const uploadRes = await fetch(`${baseUrl}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`
      },
      body: bodyBuffer
    });
    const uploadJson = await uploadRes.json();
    if (!uploadJson.success) throw new Error('Upload failed: ' + uploadJson.message);
    console.log('   File uploaded successfully. File ID:', uploadJson.data.id);

    // 5. Conversion (Text to PDF)
    console.log('\n5. Testing Conversion Job (text-to-pdf)...');
    const convRes = await fetch(`${baseUrl}/api/conversions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        toolSlug: 'text-to-pdf',
        sourceFileId: uploadJson.data.id,
        options: {}
      })
    });
    const convJson = await convRes.json();
    if (!convJson.success) throw new Error('Conversion initiation failed: ' + convJson.message);
    const jobId = convJson.data.jobId;
    console.log('   Conversion job queued. Job ID:', jobId);

    // 6. Poll Job Status
    console.log('\n6. Polling job status...');
    let completed = false;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 400));
      const statusRes = await fetch(`${baseUrl}/api/conversions/${jobId}/status`);
      const statusJson = await statusRes.json();
      console.log(`   Poll ${i + 1}: status = ${statusJson.data.status}, progress = ${statusJson.data.progress}%`);
      if (statusJson.data.status === 'COMPLETED') {
        completed = true;
        break;
      }
      if (statusJson.data.status === 'FAILED') {
        throw new Error('Conversion job failed: ' + statusJson.data.errorMessage);
      }
    }
    if (!completed) throw new Error('Job did not complete in time');

    // 7. Download Converted PDF
    console.log('\n7. Verifying Converted Output Download...');
    const dlRes = await fetch(`${baseUrl}/api/conversions/${jobId}/download`);
    if (!dlRes.ok) throw new Error(`Download endpoint failed with HTTP ${dlRes.status}`);
    const dlBuffer = await dlRes.arrayBuffer();
    const pdfMagic = Buffer.from(dlBuffer.slice(0, 4)).toString('ascii');
    console.log(`   Downloaded buffer size: ${dlBuffer.byteLength} bytes, PDF Magic Header: "${pdfMagic}"`);
    if (pdfMagic !== '%PDF') throw new Error(`Expected %PDF header, got "${pdfMagic}"`);

    // 8. Conversion: PDF to Word (DOCX)
    console.log('\n8. Testing Conversion Job (pdf-to-word)...');
    // Upload the PDF we just created
    const pdfBoundary = '----WebKitFormBoundaryPdfUpload123';
    const pdfBodyBuffer = Buffer.concat([
      Buffer.from(`--${pdfBoundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      Buffer.from(dlBuffer),
      Buffer.from(`\r\n--${pdfBoundary}--\r\n`)
    ]);

    const pdfUploadRes = await fetch(`${baseUrl}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${pdfBoundary}`,
        'Authorization': `Bearer ${token}`
      },
      body: pdfBodyBuffer
    });
    const pdfUploadJson = await pdfUploadRes.json();

    const docxConvRes = await fetch(`${baseUrl}/api/conversions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        toolSlug: 'pdf-to-word',
        sourceFileId: pdfUploadJson.data.id,
        options: {}
      })
    });
    const docxConvJson = await docxConvRes.json();
    const docxJobId = docxConvJson.data.jobId;

    let docxCompleted = false;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 400));
      const statusRes = await fetch(`${baseUrl}/api/conversions/${docxJobId}/status`);
      const statusJson = await statusRes.json();
      if (statusJson.data.status === 'COMPLETED') {
        docxCompleted = true;
        break;
      }
      if (statusJson.data.status === 'FAILED') {
        throw new Error('PDF to Word conversion failed: ' + statusJson.data.errorMessage);
      }
    }
    if (!docxCompleted) throw new Error('PDF to Word job did not complete in time');

    const docxDlRes = await fetch(`${baseUrl}/api/conversions/${docxJobId}/download`);
    const docxBuffer = await docxDlRes.arrayBuffer();
    // DOCX is a zip file, starts with 'PK' (0x50, 0x4B)
    const docxMagic = Buffer.from(docxBuffer.slice(0, 2)).toString('ascii');
    console.log(`   DOCX buffer size: ${docxBuffer.byteLength} bytes, Magic Header: "${docxMagic}" (PK for ZIP/DOCX)`);
    if (docxMagic !== 'PK') throw new Error(`Expected PK zip header for docx, got "${docxMagic}"`);

    // 9. Check Conversion History
    console.log('\n9. Checking /api/history...');
    const histRes = await fetch(`${baseUrl}/api/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const histJson = await histRes.json();
    console.log(`   User has ${histJson.data.length} history items recorded.`);
    if (histJson.data.length < 2) throw new Error('History was not properly recorded for authenticated conversions');

    console.log('\n✅ ALL BACKEND TESTS PASSED WITH 100% SUCCESS!\n');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
