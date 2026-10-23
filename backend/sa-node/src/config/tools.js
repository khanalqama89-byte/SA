/**
 * SA Document Converter Platform - Tool Definitions
 * Matches the initial 15 conversion tools supported by the platform.
 */
const TOOLS = [
  {
    id: 1,
    name: 'PDF to Word',
    slug: 'pdf-to-word',
    description: 'Convert PDF documents to editable Microsoft Word (DOCX) files accurately.',
    sourceFormat: 'pdf',
    targetFormat: 'docx',
    enabled: true
  },
  {
    id: 2,
    name: 'Word to PDF',
    slug: 'word-to-pdf',
    description: 'Convert Word (DOCX) documents into standard PDF documents.',
    sourceFormat: 'docx',
    targetFormat: 'pdf',
    enabled: true
  },
  {
    id: 3,
    name: 'PDF to Text',
    slug: 'pdf-to-text',
    description: 'Extract text content from PDF documents cleanly into Plain Text (TXT).',
    sourceFormat: 'pdf',
    targetFormat: 'txt',
    enabled: true
  },
  {
    id: 4,
    name: 'PDF to JPG',
    slug: 'pdf-to-jpg',
    description: 'Extract or render PDF pages into high-resolution JPG images.',
    sourceFormat: 'pdf',
    targetFormat: 'jpg',
    enabled: true
  },
  {
    id: 5,
    name: 'JPG to PDF',
    slug: 'jpg-to-pdf',
    description: 'Convert JPG images into a single professional PDF document.',
    sourceFormat: 'jpg',
    targetFormat: 'pdf',
    enabled: true
  },
  {
    id: 6,
    name: 'PNG to PDF',
    slug: 'png-to-pdf',
    description: 'Convert PNG images into a clean, crisp PDF document.',
    sourceFormat: 'png',
    targetFormat: 'pdf',
    enabled: true
  },
  {
    id: 7,
    name: 'PDF to PNG',
    slug: 'pdf-to-png',
    description: 'Render PDF pages into crystal clear lossless PNG images.',
    sourceFormat: 'pdf',
    targetFormat: 'png',
    enabled: true
  },
  {
    id: 8,
    name: 'Merge PDF',
    slug: 'merge-pdf',
    description: 'Combine multiple PDF files into one single organized PDF document.',
    sourceFormat: 'pdf',
    targetFormat: 'pdf',
    enabled: true
  },
  {
    id: 9,
    name: 'Split PDF',
    slug: 'split-pdf',
    description: 'Separate PDF pages or extract a specific range into standalone PDFs.',
    sourceFormat: 'pdf',
    targetFormat: 'zip',
    enabled: true
  },
  {
    id: 10,
    name: 'Compress PDF',
    slug: 'compress-pdf',
    description: 'Reduce PDF file size efficiently while maintaining visual quality.',
    sourceFormat: 'pdf',
    targetFormat: 'pdf',
    enabled: true
  },
  {
    id: 11,
    name: 'Rotate PDF',
    slug: 'rotate-pdf',
    description: 'Rotate PDF pages 90, 180, or 270 degrees permanently.',
    sourceFormat: 'pdf',
    targetFormat: 'pdf',
    enabled: true
  },
  {
    id: 12,
    name: 'Extract PDF Pages',
    slug: 'extract-pdf-pages',
    description: 'Extract selected pages from any PDF document into a new PDF.',
    sourceFormat: 'pdf',
    targetFormat: 'pdf',
    enabled: true
  },
  {
    id: 13,
    name: 'Delete PDF Pages',
    slug: 'delete-pdf-pages',
    description: 'Remove unwanted pages from a PDF document effortlessly.',
    sourceFormat: 'pdf',
    targetFormat: 'pdf',
    enabled: true
  },
  {
    id: 14,
    name: 'HTML to PDF',
    slug: 'html-to-pdf',
    description: 'Convert HTML documents or webpages into formatted PDF documents.',
    sourceFormat: 'html',
    targetFormat: 'pdf',
    enabled: true
  },
  {
    id: 15,
    name: 'Text to PDF',
    slug: 'text-to-pdf',
    description: 'Transform plain text files into cleanly styled PDF documents.',
    sourceFormat: 'txt',
    targetFormat: 'pdf',
    enabled: true
  }
];

module.exports = { TOOLS };
