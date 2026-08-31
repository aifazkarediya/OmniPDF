/**
 * Plain-English Note:
 * This file defines all the data types and interfaces used throughout the app,
 * such as tool configurations, dictionary results, reading settings, and signature objects.
 */

export type AppMode = 'reader' | 'tools' | 'convert';

export type ToolType =
  | 'merge'
  | 'split'
  | 'reorder-rotate-delete'
  | 'compress'
  | 'watermark'
  | 'page-numbers'
  | 'extract'
  | 'pdf-to-image'
  | 'image-to-pdf'
  | 'protect-unlock'
  | 'crop'
  | 'esign'
  | 'ocr';

export interface DictionaryDefinition {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
  sourceUrls?: string[];
}

export interface ReadingNote {
  id: string;
  pageNumber: number;
  selectedText: string;
  noteText: string;
  color: 'yellow' | 'green' | 'blue' | 'pink';
  createdAt: string;
}

export interface PageModification {
  originalIndex: number;
  rotation: number; // 0, 90, 180, 270
  deleted: boolean;
}

export interface SignaturePlacement {
  id: string;
  pageNumber: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  dataUrl: string;
}

export interface OCRResult {
  pageNumber: number;
  text: string;
  confidence: number;
}
