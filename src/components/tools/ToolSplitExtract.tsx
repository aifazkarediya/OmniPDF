/**
 * Plain-English Note:
 * This tool lets you extract specific pages or split a PDF by page ranges (e.g. 1-3, 5, 7-10)
 * and save them as a clean new PDF document.
 */

import React, { useState, useEffect } from 'react';
import { splitPDF, downloadFile } from '../../lib/pdfOperations';
import { pdfjsLib } from '../../lib/pdfWorker';
import { Scissors, Upload, Download, CheckCircle, Loader2, FileText } from 'lucide-react';

interface ToolSplitExtractProps {
  initialBuffer: ArrayBuffer | null;
  initialFileName?: string;
}

export const ToolSplitExtract: React.FC<ToolSplitExtractProps> = ({ initialBuffer, initialFileName }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(initialBuffer);
  const [fileName, setFileName] = useState<string>(initialFileName || 'document.pdf');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageRange, setPageRange] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfBuffer) return;
    const getCount = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer.slice(0)) });
        const doc = await loadingTask.promise;
        setTotalPages(doc.numPages);
        setPageRange(`1-${doc.numPages}`);
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
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          setPdfBuffer(reader.result as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSplit = async () => {
    if (!pdfBuffer) return;

    try {
      setIsProcessing(true);
      setStatus('Extracting pages...');
      const resultBytes = await splitPDF(pdfBuffer, pageRange);
      const outName = `${fileName.replace(/\.pdf$/i, '')}_extracted.pdf`;
      downloadFile(resultBytes, outName);
      setStatus(`Successfully extracted pages (${pageRange})!`);
    } catch (err: any) {
      alert('Error extracting pages: ' + (err.message || 'Please check your page range format.'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Split & Extract Pages</h3>
            <p className="text-xs text-slate-500">Extract any page or custom page ranges into a separate PDF file.</p>
          </div>
        </div>

        {/* Upload Zone */}
        {!pdfBuffer ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Select PDF to Split</span>
            <span className="text-xs text-slate-400 mt-0.5">Choose a PDF file from your device</span>
            <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">{fileName}</p>
                  <p className="text-[11px] text-slate-500">Total pages: {totalPages}</p>
                </div>
              </div>

              <label className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                Change File
                <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
              </label>
            </div>

            {/* Range Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Pages to Extract (Example: 1-3, 5, 8-10)
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g. 1-2, 4, 6"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                You can use commas for separate pages and hyphens for page spans.
              </p>
            </div>

            {/* Quick Range Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPageRange('1')}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors"
              >
                Page 1 Only
              </button>
              {totalPages > 2 && (
                <button
                  type="button"
                  onClick={() => setPageRange(`1-${Math.ceil(totalPages / 2)}`)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                >
                  First Half (1-{Math.ceil(totalPages / 2)})
                </button>
              )}
              {totalPages > 1 && (
                <button
                  type="button"
                  onClick={() => setPageRange(String(totalPages))}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Last Page ({totalPages})
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSplit}
              disabled={isProcessing || !pageRange.trim()}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Extract & Download Pages</span>
                </>
              )}
            </button>

            {status && (
              <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{status}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
