/**
 * Plain-English Note:
 * This file configures the PDF.js library so that our browser can load,
 * parse, render, and extract text from PDF files directly in your web browser.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF.js worker using a fast, reliable public CDN matching the library version
if (typeof window !== 'undefined' && 'GlobalWorkerOptions' in pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export { pdfjsLib };
