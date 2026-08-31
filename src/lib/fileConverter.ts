/**
 * Plain-English Note:
 * This file handles converting other file formats (Word .docx, plain text,
 * Markdown, and Images) into clean, standard PDF documents directly in the browser.
 */

import mammoth from 'mammoth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Convert a Word Document (.docx) into a clean PDF document
 */
export async function convertDocxToPDF(docxBuffer: ArrayBuffer, fileName: string = 'document'): Promise<Uint8Array> {
  const result = await mammoth.extractRawText({ arrayBuffer: docxBuffer });
  const rawText = result.value;

  if (!rawText.trim()) {
    throw new Error('The Word document appears to be empty or could not be read.');
  }

  return await convertTextToPDF(rawText, fileName);
}

/**
 * Convert plain text or markdown to PDF with pagination, word wrapping, and margins
 */
export async function convertTextToPDF(text: string, title?: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // Standard A4 points
  const pageHeight = 841.89;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const fontSize = 11;
  const lineHeight = fontSize * 1.5;

  const lines = text.split(/\r?\n/);
  const wrappedLines: Array<{ text: string; isHeader?: boolean; isBlank?: boolean }> = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      wrappedLines.push({ text: '', isBlank: true });
      continue;
    }

    const isHeader = rawLine.startsWith('# ') || rawLine.startsWith('## ');
    const lineText = isHeader ? rawLine.replace(/^#+\s*/, '') : rawLine;
    const currentFont = isHeader ? fontBold : fontRegular;
    const currentFontSize = isHeader ? 15 : fontSize;

    // Simple word wrapping
    const words = lineText.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = currentFont.widthOfTextAtSize(testLine, currentFontSize);

      if (testWidth > contentWidth && currentLine) {
        wrappedLines.push({ text: currentLine, isHeader });
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      wrappedLines.push({ text: currentLine, isHeader });
    }
  }

  // Paginate lines
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Title header if provided
  if (title) {
    currentPage.drawText(title.replace(/\.[^/.]+$/, ''), {
      x: margin,
      y: currentY,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25),
    });
    currentY -= 28;
  }

  for (const item of wrappedLines) {
    const itemHeight = item.isBlank ? lineHeight * 0.7 : item.isHeader ? lineHeight * 1.6 : lineHeight;

    if (currentY - itemHeight < margin) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }

    if (item.isBlank) {
      currentY -= itemHeight;
      continue;
    }

    const itemFont = item.isHeader ? fontBold : fontRegular;
    const itemFontSize = item.isHeader ? 14 : fontSize;
    const itemColor = item.isHeader ? rgb(0.12, 0.18, 0.3) : rgb(0.2, 0.22, 0.25);

    currentPage.drawText(item.text, {
      x: margin,
      y: currentY,
      size: itemFontSize,
      font: itemFont,
      color: itemColor,
    });

    currentY -= itemHeight;
  }

  return await pdfDoc.save();
}
