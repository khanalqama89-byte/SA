const zlib = require('zlib');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');

/**
 * Decode Adobe PostScript ASCII85 (Base85) data stream
 */
function decodeAscii85(input) {
  const str = (typeof input === 'string' ? input : input.toString('latin1'))
    .replace(/^<~|~>$/g, '')
    .replace(/\s+/g, '');
  const out = [];
  let tuple = 0;
  let count = 0;

  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c === 0x7A) { // 'z' representing four 0x00 bytes
      if (count > 0) throw new Error('Unexpected z inside ascii85 block');
      out.push(0, 0, 0, 0);
    } else if (c >= 0x21 && c <= 0x75) { // '!' (33) through 'u' (117)
      tuple = tuple * 85 + (c - 33);
      count++;
      if (count === 5) {
        out.push(
          (tuple >>> 24) & 0xff,
          (tuple >>> 16) & 0xff,
          (tuple >>> 8) & 0xff,
          tuple & 0xff
        );
        tuple = 0;
        count = 0;
      }
    }
  }

  if (count > 1) {
    for (let j = count; j < 5; j++) tuple = tuple * 85 + 84;
    for (let j = 0; j < count - 1; j++) out.push((tuple >>> (24 - j * 8)) & 0xff);
  }

  return Buffer.from(out);
}

/**
 * Decompress raw stream bytes with support for chained filters (e.g. ASCII85 + Flate)
 */
function decompressStreamBytes(rawBytes, filterStr = '') {
  let bytes = rawBytes;

  // If stream is ASCII85-encoded
  if (filterStr.includes('ASCII85') || (bytes.length > 5 && bytes[0] === 0x47 && bytes[1] === 0x62)) {
    try {
      bytes = decodeAscii85(bytes);
    } catch (e) {}
  }

  // Decompress Flate (zlib)
  try {
    return zlib.inflateSync(bytes).toString('latin1');
  } catch {
    try {
      return zlib.inflateRawSync(bytes).toString('latin1');
    } catch {
      // If direct inflate failed, check if ASCII85 decode reveals valid zlib stream
      try {
        const a85 = decodeAscii85(bytes);
        return zlib.inflateSync(a85).toString('latin1');
      } catch {
        return bytes.toString('latin1');
      }
    }
  }
}

/**
 * Decode PDF hex strings <hex> or literal strings (str) with octal and character entity support
 */
function decodePdfString(str) {
  if (!str) return '';
  str = str.trim();
  if (str.startsWith('<') && str.endsWith('>')) {
    const hex = str.slice(1, -1).replace(/\s+/g, '');
    if (!hex) return '';
    try {
      if (hex.length >= 4 && (hex.startsWith('feff') || hex.startsWith('FEFF'))) {
        return Buffer.from(hex, 'hex').swap16().toString('utf16le');
      }
      return Buffer.from(hex, 'hex').toString('utf-8');
    } catch {
      return '';
    }
  }
  if (str.startsWith('(') && str.endsWith(')')) {
    return str.slice(1, -1)
      .replace(/\\([0-7]{1,3})/g, (_, oct) => {
        const code = parseInt(oct, 8);
        return (code === 127 || code === 149) ? ' • ' : String.fromCharCode(code);
      })
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/\\r/g, '\r')
      .replace(/\\n/g, '\n');
  }
  return str;
}

/**
 * Parse uncompressed PDF content stream commands into structured text lines
 * Handles: TJ arrays (with kerning-based word spacing), Tj, ', ", T*, Td, TD, Tm, ET
 */
function parseStreamLines(streamStr) {
  const lines = [];
  let currentLine = '';

  const tokenRegex = new RegExp(
    '\\[([\\s\\S]*?)\\]\\s*TJ|' +
    '(\\((?:\\\\.|[^)\\\\])*\\)|\\<[0-9a-fA-F\\s]+\\>)\\s*Tj|' +
    '(\\((?:\\\\.|[^)\\\\])*\\)|\\<[0-9a-fA-F\\s]+\\>)\\s*[\'\\"]|' +
    'T\\*|ET|' +
    '(-?[\\d\\.]+)\\s+(-?[\\d\\.]+)\\s+(?:Td|TD)|' +
    '(-?[\\d\\.]+)\\s+(-?[\\d\\.]+)\\s+(-?[\\d\\.]+)\\s+(-?[\\d\\.]+)\\s+(-?[\\d\\.]+)\\s+(-?[\\d\\.]+)\\s+Tm',
    'g'
  );

  let match;
  while ((match = tokenRegex.exec(streamStr)) !== null) {
    if (match[1] !== undefined) {
      // 1. TJ Array: elements are string literals, hex strings, or kerning numbers
      const arrStr = match[1];
      const elemRegex = new RegExp('\\((?:\\\\.|[^)\\\\])*\\)|\\<[0-9a-fA-F\\s]+\\>|(-?[\\d\\.]+)', 'g');
      let elem;
      while ((elem = elemRegex.exec(arrStr)) !== null) {
        if (elem[1] !== undefined) {
          const num = parseFloat(elem[1]);
          // Negative kerning shift of ~120-200 units corresponds to a word space
          if (num < -120 && currentLine && !currentLine.endsWith(' ')) {
            currentLine += ' ';
          }
        } else {
          currentLine += decodePdfString(elem[0]);
        }
      }
    } else if (match[2] !== undefined) {
      // 2. Single Tj
      const text = decodePdfString(match[2]);
      if (text) {
        currentLine += (currentLine && !currentLine.endsWith(' ') ? ' ' : '') + text;
      }
    } else if (match[3] !== undefined) {
      // 3. ' or " (moves to next line and prints text)
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = decodePdfString(match[3]);
    } else if (match[0] === 'T*' || match[0] === 'ET' || (match[4] !== undefined && parseFloat(match[5]) < -2)) {
      // 4. T*, ET, or Td with negative vertical offset (line break)
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = '';
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
}

/**
 * Robust Cross-Platform Multi-Layer PDF Text & Layout Extractor
 * 100% pure JavaScript, zero native binary dependencies, runs identically on Vercel Lambda and Local.
 */
async function extractStructuredPdf(inputBuffer) {
  let fullText = '';
  let pages = [];

  // LAYER 1: pdf-parse with custom spatial pagerender
  try {
    const res = await pdfParse(inputBuffer, {
      pagerender: (pageData) => {
        return pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
          .then(tc => {
            const items = tc.items || [];
            if (!items.length) return '';

            // Sort items top-to-bottom (Y descending), then left-to-right (X ascending)
            items.sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);

            let pageOut = '';
            let lastY = null;
            let lastX = null;
            let lastWidth = 0;

            for (const it of items) {
              const str = it.str;
              if (!str && !it.hasEOL) continue;

              const x = it.transform[4];
              const y = it.transform[5];
              const fontSize = Math.abs(it.transform[0]) || Math.abs(it.transform[3]) || it.height || 10;

              if (lastY === null) {
                pageOut += str;
              } else {
                const yDiff = lastY - y;
                if (Math.abs(yDiff) > fontSize * 0.45) {
                  // Vertical shift -> check for paragraph vs single line break
                  pageOut += (yDiff > fontSize * 1.35 ? '\n\n' : '\n') + str;
                } else {
                  // Same horizontal line -> check gap for word spacing
                  const gap = x - (lastX + lastWidth);
                  if (gap > 2.0 && !pageOut.endsWith(' ') && !str.startsWith(' ')) {
                    pageOut += ' ' + str;
                  } else {
                    pageOut += str;
                  }
                }
              }

              lastY = y;
              lastX = x;
              lastWidth = it.width || (str.length * fontSize * 0.5);
            }

            return pageOut;
          });
      }
    });

    const parsedText = (res.text || '').trim();
    if (parsedText.length > 20) {
      fullText = parsedText;
      const rawPages = fullText.split(/\n\n--- Page Break ---\n\n|\f/);
      pages = rawPages.map((pt, idx) => {
        const blocks = pt.split(/\n\s*\n/).map(pStr => {
          const trimmed = pStr.trim();
          const isHeading1 = trimmed.length < 60 && (/^[A-Z0-9\s:,\-\.]{4,}$/.test(trimmed) && !trimmed.includes('.'));
          const isHeading2 = !isHeading1 && trimmed.length < 80 && (trimmed.startsWith('#') || trimmed.endsWith(':'));
          const isBullet = /^[•\-\*\u2022]|\d+[\.\)]\s/.test(trimmed);

          return {
            type: isHeading1 ? 'heading1' : isHeading2 ? 'heading2' : isBullet ? 'bullet' : 'paragraph',
            text: trimmed,
            fontSize: isHeading1 ? 18 : isHeading2 ? 14 : 11,
            isBold: isHeading1 || isHeading2
          };
        }).filter(b => b.text.length > 0);

        return {
          pageNum: idx + 1,
          width: 595,
          height: 842,
          paragraphs: blocks
        };
      });
    }
  } catch (err) {
    // pdf-parse can throw on certain modern streams or when run in environments without dynamic worker paths
  }

  // LAYER 2: Native pdf-lib stream decompression (handles ASCII85 + Flate + direct stream contents)
  if (!fullText || fullText.length < 20) {
    try {
      const doc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
      const pageCount = doc.getPageCount();
      const pageObjs = [];
      const allPageText = [];

      for (let pIdx = 0; pIdx < pageCount; pIdx++) {
        const page = doc.getPage(pIdx);
        const { width = 595, height = 842 } = page.getSize ? page.getSize() : {};
        const contents = page.node.Contents();
        if (!contents) continue;

        let streamList = [];
        if (typeof contents.size === 'function') {
          for (let i = 0; i < contents.size(); i++) {
            const item = contents.get(i);
            const lookedUp = doc.context.lookup(item) || item;
            streamList.push(lookedUp);
          }
        } else {
          const lookedUp = doc.context.lookup(contents) || contents;
          streamList.push(lookedUp);
        }

        const pageLines = [];
        for (const s of streamList) {
          if (!s || !s.contents) continue;
          const filter = s.dict ? s.dict.get(PDFDocument.PDFName ? PDFDocument.PDFName.of('Filter') : 'Filter') : null;
          const filterStr = filter ? filter.toString() : '';
          const rawBytes = Buffer.from(s.contents);
          const decompressed = decompressStreamBytes(rawBytes, filterStr);
          const lines = parseStreamLines(decompressed);
          if (lines.length) pageLines.push(...lines);
        }

        if (pageLines.length > 0) {
          const pageStr = pageLines.join('\n');
          allPageText.push(pageStr);

          const blocks = pageLines.map(line => {
            const isH1 = line.length < 50 && /^[A-Z0-9\s:,\-\.]{4,}$/.test(line);
            const isBullet = /^[•\-\*\u2022]|\d+[\.\)]\s/.test(line);
            return {
              type: isH1 ? 'heading1' : isBullet ? 'bullet' : 'paragraph',
              text: line,
              fontSize: isH1 ? 16 : 11,
              isBold: isH1
            };
          });

          pageObjs.push({
            pageNum: pIdx + 1,
            width,
            height,
            paragraphs: blocks
          });
        }
      }

      if (allPageText.length > 0) {
        fullText = allPageText.join('\n\n--- Page Break ---\n\n').trim();
        pages = pageObjs;
      }
    } catch (err) {
      console.warn('pdf-lib stream decompression warning:', err.message);
    }
  }

  // LAYER 3: Standard pdf-parse fallback (in case custom pagerender was the part that threw)
  if (!fullText || fullText.length < 20) {
    try {
      const data = await pdfParse(inputBuffer);
      const raw = (data.text || '').replace(/\r\n/g, '\n').trim();
      if (raw.length > 0) {
        fullText = raw;
        const blocks = raw.split(/\n\s*\n/).map(p => ({
          type: 'paragraph',
          text: p.trim(),
          fontSize: 11
        })).filter(b => b.text.length > 0);

        pages = [{
          pageNum: 1,
          width: 595,
          height: 842,
          paragraphs: blocks
        }];
      }
    } catch (e) {}
  }

  return {
    pages: pages.length > 0 ? pages : [{ pageNum: 1, width: 595, height: 842, paragraphs: [] }],
    fullText: fullText || '',
    numPages: pages.length || 1
  };
}

module.exports = {
  extractStructuredPdf
};
