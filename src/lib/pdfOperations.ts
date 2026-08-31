/**
 * Plain-English Note:
 * This is the central engine for all PDF modifications (Merge, Split, Rotate,
 * Delete, Page Numbers, Watermark, Compress, E-Sign, Crop, Password, and Images).
 * Everything runs 100% in your browser using WebAssembly and canvas technology,
 * meaning your private files NEVER leave your computer or phone.
 */

import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';
import JSZip from 'jszip';
import { createWorker } from 'tesseract.js';
import { OCRResult } from '../types/pdf';

/**
 * Merge multiple PDF file buffers into a single combined PDF
 */
export async function mergePDFs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Split a PDF according to page ranges (e.g. "1-3, 5, 8-10")
 */
export async function splitPDF(
  pdfBuffer: ArrayBuffer,
  pageRangesStr: string
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const targetIndices = parsePageRanges(pageRangesStr, totalPages);

  if (targetIndices.length === 0) {
    throw new Error('No valid pages selected from range string.');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return await newDoc.save();
}

/**
 * Parse page strings like "1-3, 5, 7" into 0-indexed page indices
 */
export function parsePageRanges(rangesStr: string, totalPages: number): number[] {
  const indices = new Set<number>();
  const parts = rangesStr.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(totalPages, parseInt(endStr, 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Reorder, rotate, and delete pages from a PDF document
 */
export async function reorderRotateDeletePages(
  pdfBuffer: ArrayBuffer,
  pageModifications: Array<{ originalIndex: number; rotation: number; deleted: boolean }>
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const activePages = pageModifications.filter((p) => !p.deleted);
  if (activePages.length === 0) {
    throw new Error('You cannot delete all pages in the PDF.');
  }

  for (const mod of activePages) {
    const [copiedPage] = await newDoc.copyPages(srcDoc, [mod.originalIndex]);
    if (mod.rotation) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRotation + mod.rotation) % 360));
    }
    newDoc.addPage(copiedPage);
  }

  return await newDoc.save();
}

/**
 * Add Text or Image Watermark across all or selected pages
 */
export async function addWatermarkToPDF(
  pdfBuffer: ArrayBuffer,
  options: {
    text?: string;
    imageBuffer?: ArrayBuffer;
    imageType?: 'png' | 'jpg';
    opacity: number; // 0.1 to 1.0
    size: number;
    angle: number;
    colorHex?: string;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  let embeddedImage: any = null;
  if (options.imageBuffer) {
    if (options.imageType === 'png') {
      embeddedImage = await pdfDoc.embedPng(options.imageBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(options.imageBuffer);
    }
  }

  // Parse color hex if text watermark
  const hex = (options.colorHex || '#94a3b8').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0.5;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0.5;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0.5;

  for (const page of pages) {
    const { width, height } = page.getSize();

    if (embeddedImage) {
      const imgWidth = (options.size / 100) * (width * 0.5);
      const imgHeight = (embeddedImage.height / embeddedImage.width) * imgWidth;
      page.drawImage(embeddedImage, {
        x: width / 2 - imgWidth / 2,
        y: height / 2 - imgHeight / 2,
        width: imgWidth,
        height: imgHeight,
        opacity: options.opacity,
        rotate: degrees(options.angle || 0),
      });
    } else if (options.text) {
      const textWidth = font.widthOfTextAtSize(options.text, options.size);
      page.drawText(options.text, {
        x: width / 2 - textWidth / 2,
        y: height / 2,
        size: options.size,
        font,
        color: rgb(r, g, b),
        opacity: options.opacity,
        rotate: degrees(options.angle || 45),
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Add Page Numbers to header or footer
 */
export async function addPageNumbersToPDF(
  pdfBuffer: ArrayBuffer,
  options: {
    position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
    format: 'number' | 'page-x-of-y';
    fontSize: number;
    startPageNumber: number;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const currentNum = i + options.startPageNumber;
    const text = options.format === 'page-x-of-y' ? `Page ${currentNum} of ${totalPages}` : `${currentNum}`;
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const margin = 28;

    let x = width / 2 - textWidth / 2;
    let y = margin;

    if (options.position === 'bottom-left') {
      x = margin;
      y = margin;
    } else if (options.position === 'bottom-right') {
      x = width - textWidth - margin;
      y = margin;
    } else if (options.position === 'top-center') {
      x = width / 2 - textWidth / 2;
      y = height - margin;
    } else if (options.position === 'top-left') {
      x = margin;
      y = height - margin;
    } else if (options.position === 'top-right') {
      x = width - textWidth - margin;
      y = height - margin;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.3, 0.35, 0.4),
    });
  });

  return await pdfDoc.save();
}

/**
 * Convert Image files to a neat multi-page or single PDF
 */
export async function convertImagesToPDF(
  images: Array<{ file: File; buffer: ArrayBuffer }>,
  options: { orientation: 'auto' | 'portrait' | 'landscape'; margin: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const item of images) {
    const isPng = item.file.type === 'image/png';
    const isJpg = item.file.type === 'image/jpeg' || item.file.type === 'image/jpg';

    let img: any;
    if (isPng) {
      img = await pdfDoc.embedPng(item.buffer);
    } else if (isJpg) {
      img = await pdfDoc.embedJpg(item.buffer);
    } else {
      // For WebP or other formats, convert to PNG via offscreen canvas
      const blob = new Blob([item.buffer], { type: item.file.type });
      const imgBitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = imgBitmap.width;
      canvas.height = imgBitmap.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(imgBitmap, 0, 0);
      const pngDataUrl = canvas.toDataURL('image/png');
      const pngBase64 = pngDataUrl.split(',')[1];
      const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0));
      img = await pdfDoc.embedPng(pngBytes);
    }

    let pageWidth = 595.28; // Standard A4 points
    let pageHeight = 841.89;

    if (options.orientation === 'landscape' || (options.orientation === 'auto' && img.width > img.height)) {
      pageWidth = 841.89;
      pageHeight = 595.28;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const margin = options.margin || 20;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const scale = Math.min(availableWidth / img.width, availableHeight / img.height, 1);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;

    page.drawImage(img, {
      x: (pageWidth - drawWidth) / 2,
      y: (pageHeight - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * Render all or selected PDF pages to image blobs (PNG or JPG)
 */
export async function convertPDFToImages(
  pdfBuffer: ArrayBuffer,
  format: 'png' | 'jpeg' = 'png',
  scale: number = 1.5
): Promise<Array<{ pageNumber: number; blob: Blob; dataUrl: string }>> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer.slice(0)) });
  const pdf = await loadingTask.promise;
  const results: Array<{ pageNumber: number; blob: Blob; dataUrl: string }> = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d')!;

    await page.render({ canvasContext: context, viewport }).promise;

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mimeType, 0.92);

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), mimeType, 0.92);
    });

    results.push({ pageNumber: pageNum, blob, dataUrl });
  }

  return results;
}

/**
 * Download a ZIP package containing all rendered page images
 */
export async function createImagesZip(images: Array<{ pageNumber: number; blob: Blob }>, baseName: string): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(`${baseName}-images`) || zip;

  images.forEach((img) => {
    const ext = img.blob.type === 'image/jpeg' ? 'jpg' : 'png';
    folder.file(`page-${img.pageNumber}.${ext}`, img.blob);
  });

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Compress PDF by rendering pages to optimized JPEG canvases and rebuilding the PDF
 */
export async function compressPDF(
  pdfBuffer: ArrayBuffer,
  qualityFactor: 'low' | 'medium' | 'high'
): Promise<Uint8Array> {
  const scaleMap = { low: 1.0, medium: 1.3, high: 1.8 };
  const qualityMap = { low: 0.55, medium: 0.72, high: 0.88 };

  const scale = scaleMap[qualityFactor];
  const jpegQuality = qualityMap[qualityFactor];

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer.slice(0)) });
  const pdf = await loadingTask.promise;
  const newDoc = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    // Fill white background for clean JPEG compression
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const jpegBase64 = jpegDataUrl.split(',')[1];
    const jpegBytes = Uint8Array.from(atob(jpegBase64), (c) => c.charCodeAt(0));

    const embeddedImage = await newDoc.embedJpg(jpegBytes);
    // Unscaled original PDF points for crisp page geometry
    const originalViewport = page.getViewport({ scale: 1.0 });
    const newPdfPage = newDoc.addPage([originalViewport.width, originalViewport.height]);

    newPdfPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });
  }

  return await newDoc.save();
}

/**
 * Crop PDF pages by trimming outer margins
 */
export async function cropPDF(
  pdfBuffer: ArrayBuffer,
  margins: { top: number; bottom: number; left: number; right: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { x, y, width, height } = page.getCropBox();
    const newX = x + margins.left;
    const newY = y + margins.bottom;
    const newWidth = Math.max(50, width - margins.left - margins.right);
    const newHeight = Math.max(50, height - margins.top - margins.bottom);

    page.setCropBox(newX, newY, newWidth, newHeight);
  }

  return await pdfDoc.save();
}

/**
 * Place and burn E-Signatures onto specific pages of the PDF
 */
export async function eSignPDF(
  pdfBuffer: ArrayBuffer,
  signatures: Array<{
    pageNumber: number;
    xPercent: number; // 0 to 100 percentage from left
    yPercent: number; // 0 to 100 percentage from top
    widthPercent: number; // 0 to 100 percentage of page width
    heightPercent: number;
    pngDataUrl: string;
  }>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  for (const sig of signatures) {
    const targetPage = pages[sig.pageNumber - 1];
    if (!targetPage) continue;

    const base64 = sig.pngDataUrl.split(',')[1];
    const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const embeddedPng = await pdfDoc.embedPng(imageBytes);

    const { width, height } = targetPage.getSize();
    const sigWidth = (sig.widthPercent / 100) * width;
    const sigHeight = (sig.heightPercent / 100) * height;

    const x = (sig.xPercent / 100) * width;
    // PDF coordinate system starts from bottom-left (0,0)
    const y = height - (sig.yPercent / 100) * height - sigHeight;

    targetPage.drawImage(embeddedPng, {
      x,
      y,
      width: sigWidth,
      height: sigHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * OCR scanned page using Tesseract.js client-side
 */
export async function ocrScannedPage(
  imageCanvasOrBlob: HTMLCanvasElement | Blob,
  onProgress?: (progress: number, status: string) => void
): Promise<OCRResult> {
  const worker = await createWorker('eng');

  try {
    const ret = await worker.recognize(imageCanvasOrBlob);
    await worker.terminate();
    return {
      pageNumber: 1,
      text: ret.data.text,
      confidence: ret.data.confidence,
    };
  } catch (err: any) {
    await worker.terminate();
    throw new Error(err.message || 'OCR processing failed.');
  }
}

/**
 * Helper to download any Uint8Array or Blob as a file
 */
export function downloadFile(data: Uint8Array | Blob, fileName: string, mimeType: string = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
