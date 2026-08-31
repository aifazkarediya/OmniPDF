/**
 * Plain-English Note:
 * This tool uses Optical Character Recognition (OCR) to convert scanned PDF documents
 * or photo snapshots into real, searchable, selectable, and copyable text entirely inside your browser.
 */

import React, { useState, useEffect } from 'react';
import { ocrScannedPage } from '../../lib/pdfOperations';
import { pdfjsLib } from '../../lib/pdfWorker';
import { ScanText, Upload, Copy, Download, Check, Loader2, Sparkles } from 'lucide-react';

interface ToolOCRProps {
  initialBuffer: ArrayBuffer | null;
  initialFileName?: string;
}

export const ToolOCR: React.FC<ToolOCRProps> = ({ initialBuffer, initialFileName }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(initialBuffer);
  const [fileName, setFileName] = useState<string>(initialFileName || 'document.pdf');
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pdfBuffer) return;
    const getCount = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer.slice(0)) });
        const doc = await loadingTask.promise;
        setTotalPages(doc.numPages);
      } catch (err) {
        console.error(err);
      }
    };
    getCount();
  }, [pdfBuffer]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setOcrText('');
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          setPdfBuffer(reader.result as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleRunOCR = async () => {
    if (!pdfBuffer) return;

    try {
      setIsProcessing(true);
      setOcrText('');

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer.slice(0)) });
      const doc = await loadingTask.promise;
      const page = await doc.getPage(selectedPage);
      const viewport = page.getViewport({ scale: 2.0 }); // High scale for clear OCR recognition

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const result = await ocrScannedPage(canvas);
      setOcrText(result.text);
      setConfidence(Math.round(result.confidence));
    } catch (err: any) {
      alert('Error during OCR processing: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!ocrText) return;
    navigator.clipboard.writeText(ocrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    if (!ocrText) return;
    const blob = new Blob([ocrText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.pdf$/i, '')}_page_${selectedPage}_ocr.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ScanText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">OCR Scanned Text Extraction</h3>
            <p className="text-xs text-slate-500">Extract editable text from scanned pages and photos using AI-powered OCR in your browser.</p>
          </div>
        </div>

        {/* Upload Zone */}
        {!pdfBuffer ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Select Scanned PDF to OCR</span>
            <span className="text-xs text-slate-400 mt-0.5">Choose a scanned document or book page</span>
            <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-800">{fileName}</p>
                <p className="text-[11px] text-slate-500">Total pages: {totalPages}</p>
              </div>
              <label className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                Change File
                <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
              </label>
            </div>

            {/* Page selection */}
            {totalPages > 1 && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Page to OCR</span>
                  <span className="text-indigo-600">Page {selectedPage} of {totalPages}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={totalPages}
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600"
                />
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleRunOCR}
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recognizing characters & words (Tesseract OCR)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Text from Page {selectedPage}</span>
                </>
              )}
            </button>

            {/* OCR Output Box */}
            {ocrText && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700">Extracted Searchable Text</span>
                    {confidence !== null && (
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        {confidence}% Accuracy
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleDownloadText}
                      className="flex items-center space-x-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .TXT</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={ocrText}
                  rows={8}
                  className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden leading-relaxed text-slate-800"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
