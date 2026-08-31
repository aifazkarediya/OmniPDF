/**
 * Plain-English Note:
 * This component converts different non-PDF file formats (Word .docx files,
 * plain text/markdown notes, and Photos/Images) into standard PDF documents in your browser.
 */

import React, { useState } from 'react';
import { convertDocxToPDF, convertTextToPDF } from '../../lib/fileConverter';
import { convertImagesToPDF, downloadFile } from '../../lib/pdfOperations';
import { FileUp, FileText, Image as ImageIcon, Download, CheckCircle, Loader2, BookOpen } from 'lucide-react';

interface FileConverterProps {
  onOpenInReader: (buffer: ArrayBuffer, name: string) => void;
}

export const FileConverter: React.FC<FileConverterProps> = ({ onOpenInReader }) => {
  const [activeTab, setActiveTab] = useState<'word' | 'images' | 'text'>('word');

  // Word doc state
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [isConvertingWord, setIsConvertingWord] = useState(false);
  const [wordResult, setWordResult] = useState<{ buffer: ArrayBuffer; name: string } | null>(null);

  // Images to PDF state
  const [imageItems, setImageItems] = useState<Array<{ file: File; buffer: ArrayBuffer; preview: string }>>([]);
  const [imageOrientation, setImageOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [imageMargin, setImageMargin] = useState<number>(20);
  const [isConvertingImages, setIsConvertingImages] = useState(false);
  const [imagesResult, setImagesResult] = useState<{ buffer: ArrayBuffer; name: string } | null>(null);

  // Text to PDF state
  const [textContent, setTextContent] = useState<string>('');
  const [textDocTitle, setTextDocTitle] = useState<string>('My Document');
  const [isConvertingText, setIsConvertingText] = useState(false);
  const [textResult, setTextResult] = useState<{ buffer: ArrayBuffer; name: string } | null>(null);

  // Handle Word doc conversion
  const handleWordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWordFile(file);
      setWordResult(null);
    }
  };

  const handleConvertWord = async () => {
    if (!wordFile) return;

    try {
      setIsConvertingWord(true);
      const arrayBuffer = await wordFile.arrayBuffer();
      const pdfBytes = await convertDocxToPDF(arrayBuffer, wordFile.name);
      const pdfBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const outName = `${wordFile.name.replace(/\.[^/.]+$/, '')}.pdf`;

      setWordResult({ buffer: pdfBuffer, name: outName });
      downloadFile(pdfBytes, outName);
    } catch (err: any) {
      alert('Error converting Word document: ' + err.message);
    } finally {
      setIsConvertingWord(false);
    }
  };

  // Handle Images to PDF
  const handleImagesInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);
    const newItems: Array<{ file: File; buffer: ArrayBuffer; preview: string }> = [];

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const preview = URL.createObjectURL(file);
      newItems.push({ file, buffer, preview });
    }

    setImageItems((prev) => [...prev, ...newItems]);
    setImagesResult(null);
  };

  const handleConvertImages = async () => {
    if (imageItems.length === 0) return;

    try {
      setIsConvertingImages(true);
      const pdfBytes = await convertImagesToPDF(imageItems, {
        orientation: imageOrientation,
        margin: imageMargin,
      });

      const pdfBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const outName = 'images_combined.pdf';

      setImagesResult({ buffer: pdfBuffer, name: outName });
      downloadFile(pdfBytes, outName);
    } catch (err: any) {
      alert('Error converting images to PDF: ' + err.message);
    } finally {
      setIsConvertingImages(false);
    }
  };

  // Handle Text to PDF
  const handleConvertText = async () => {
    if (!textContent.trim()) return;

    try {
      setIsConvertingText(true);
      const pdfBytes = await convertTextToPDF(textContent, textDocTitle);
      const pdfBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const outName = `${textDocTitle.replace(/\s+/g, '_')}.pdf`;

      setTextResult({ buffer: pdfBuffer, name: outName });
      downloadFile(pdfBytes, outName);
    } catch (err: any) {
      alert('Error generating PDF from text: ' + err.message);
    } finally {
      setIsConvertingText(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-1.5 bg-red-50 text-red-700 text-xs font-semibold px-3 py-1 rounded-full border border-red-200">
          <FileUp className="w-3.5 h-3.5" />
          <span>Universal Converter</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Convert Files to PDF
        </h2>
        <p className="text-sm text-gray-500">
          Transform Word documents, photos, notes, and text files into standard PDF documents instantly.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-200/80 p-1 rounded-xl border border-gray-300/60 flex space-x-1">
          <button
            onClick={() => setActiveTab('word')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'word'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Word Document (.docx)</span>
          </button>

          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'images'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Images to PDF (JPG/PNG)</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'text'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Text / Markdown to PDF</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WORD TO PDF */}
      {activeTab === 'word' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs max-w-xl mx-auto space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Convert Word (.docx) to PDF</h3>
            <p className="text-xs text-gray-500 mt-0.5">Extracts text and structure and creates a standard PDF.</p>
          </div>

          {!wordFile ? (
            <label className="border-2 border-dashed border-gray-300 hover:border-red-500 bg-gray-50/50 hover:bg-red-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
              <FileText className="w-8 h-8 text-red-500 mb-2" />
              <span className="text-sm font-semibold text-gray-800">Select Word Document (.docx)</span>
              <span className="text-xs text-gray-400 mt-0.5">Choose a .docx file from your device</span>
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleWordInput}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-gray-800">{wordFile.name}</p>
                  <p className="text-[11px] text-gray-500">{(wordFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => {
                    setWordFile(null);
                    setWordResult(null);
                  }}
                  className="text-xs text-gray-500 hover:text-red-600 font-medium"
                >
                  Change
                </button>
              </div>

              <button
                onClick={handleConvertWord}
                disabled={isConvertingWord}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                {isConvertingWord ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Converting Word to PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Convert & Download PDF</span>
                  </>
                )}
              </button>

              {wordResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-emerald-800 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>PDF generated successfully!</span>
                  </div>
                  <button
                    onClick={() => onOpenInReader(wordResult.buffer, wordResult.name)}
                    className="flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open in Reader</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMAGES TO PDF */}
      {activeTab === 'images' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Convert Photos & Images to PDF</h3>
            <p className="text-xs text-gray-500 mt-0.5">Combine one or multiple images (JPG, PNG, WebP) into an A4 PDF document.</p>
          </div>

          <label className="border-2 border-dashed border-gray-300 hover:border-red-500 bg-gray-50/50 hover:bg-red-50/20 p-6 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <ImageIcon className="w-8 h-8 text-red-500 mb-2" />
            <span className="text-sm font-semibold text-gray-800">Add Images (JPG, PNG, WebP)</span>
            <span className="text-xs text-gray-400 mt-0.5">Select multiple images to combine</span>
            <input type="file" accept="image/*" multiple onChange={handleImagesInput} className="hidden" />
          </label>

          {imageItems.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{imageItems.length} Image(s) added</span>
                <button onClick={() => setImageItems([])} className="text-red-500 hover:text-red-700">
                  Clear all
                </button>
              </div>

              {/* Thumbnails preview */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
                {imageItems.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden relative group">
                    <img src={img.preview} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 text-[10px] bg-gray-900/80 text-white px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Orientation & Margin Controls */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Page Orientation</label>
                  <select
                    value={imageOrientation}
                    onChange={(e) => setImageOrientation(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden"
                  >
                    <option value="auto">Auto (Match Image Ratio)</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Margin ({imageMargin} px)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={imageMargin}
                    onChange={(e) => setImageMargin(parseInt(e.target.value, 10))}
                    className="w-full accent-red-600"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleConvertImages}
                disabled={isConvertingImages}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                {isConvertingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Building PDF document...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Convert {imageItems.length} Images to PDF</span>
                  </>
                )}
              </button>

              {imagesResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-emerald-800 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>PDF created successfully!</span>
                  </div>
                  <button
                    onClick={() => onOpenInReader(imagesResult.buffer, imagesResult.name)}
                    className="flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open in Reader</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEXT TO PDF */}
      {activeTab === 'text' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Convert Notes & Markdown to PDF</h3>
            <p className="text-xs text-gray-500 mt-0.5">Type or paste text/markdown and generate a paginated PDF document.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Document Title</label>
            <input
              type="text"
              value={textDocTitle}
              onChange={(e) => setTextDocTitle(e.target.value)}
              placeholder="e.g. Biology Study Notes"
              className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Text or Markdown Content</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Type your notes, textbook summaries, or markdown headers (# Section 1) here..."
              rows={8}
              className="w-full p-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 leading-relaxed font-mono"
            />
          </div>

          <button
            onClick={handleConvertText}
            disabled={isConvertingText || !textContent.trim()}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            {isConvertingText ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Paginating and styling PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download as Formatted PDF</span>
              </>
            )}
          </button>

          {textResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-emerald-800 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>PDF generated successfully!</span>
              </div>
              <button
                onClick={() => onOpenInReader(textResult.buffer, textResult.name)}
                className="flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open in Reader</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
