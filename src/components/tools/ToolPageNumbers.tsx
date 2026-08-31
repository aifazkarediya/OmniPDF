/**
 * Plain-English Note:
 * This tool numbers every page of your PDF document (e.g. "Page 1 of 12" or "1, 2, 3")
 * with customizable header/footer positions and font sizes.
 */

import React, { useState } from 'react';
import { addPageNumbersToPDF, downloadFile } from '../../lib/pdfOperations';
import { Hash, Upload, Download, CheckCircle, Loader2 } from 'lucide-react';

interface ToolPageNumbersProps {
  initialBuffer: ArrayBuffer | null;
  initialFileName?: string;
}

export const ToolPageNumbers: React.FC<ToolPageNumbersProps> = ({ initialBuffer, initialFileName }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(initialBuffer);
  const [fileName, setFileName] = useState<string>(initialFileName || 'document.pdf');
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'>('bottom-center');
  const [format, setFormat] = useState<'page-x-of-y' | 'number'>('page-x-of-y');
  const [fontSize, setFontSize] = useState<number>(10);
  const [startPageNumber, setStartPageNumber] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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

  const handleApplyNumbers = async () => {
    if (!pdfBuffer) return;

    try {
      setIsProcessing(true);
      setStatus('Adding page numbers...');

      const resultBytes = await addPageNumbersToPDF(pdfBuffer, {
        position,
        format,
        fontSize,
        startPageNumber,
      });

      const outName = `${fileName.replace(/\.pdf$/i, '')}_numbered.pdf`;
      downloadFile(resultBytes, outName);
      setStatus('Page numbers added successfully!');
    } catch (err: any) {
      alert('Error adding page numbers: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Add Page Numbers</h3>
            <p className="text-xs text-slate-500">Insert custom page numbers in header or footer locations.</p>
          </div>
        </div>

        {/* Upload Zone */}
        {!pdfBuffer ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Select PDF to Number</span>
            <span className="text-xs text-slate-400 mt-0.5">Choose a PDF file from your device</span>
            <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-800">{fileName}</p>
                <p className="text-[11px] text-slate-500">Ready to number</p>
              </div>
              <label className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                Change File
                <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
              </label>
            </div>

            {/* Controls */}
            <div className="space-y-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
              {/* Position selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Page Number Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'top-left', label: 'Top Left' },
                    { id: 'top-center', label: 'Top Center' },
                    { id: 'top-right', label: 'Top Right' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'bottom-center', label: 'Bottom Center' },
                    { id: 'bottom-right', label: 'Bottom Right' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPosition(pos.id as any)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        position === pos.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format & Start */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Number Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="page-x-of-y">Page 1 of N</option>
                    <option value="number">1, 2, 3 (Numbers only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Counting At</label>
                  <input
                    type="number"
                    min="1"
                    value={startPageNumber}
                    onChange={(e) => setStartPageNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleApplyNumbers}
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Numbering pages...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Numbered PDF</span>
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
