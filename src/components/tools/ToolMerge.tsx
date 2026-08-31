/**
 * Plain-English Note:
 * This tool merges multiple PDF documents into a single unified PDF file.
 * You can drag to reorder the files, remove any file, and download the combined result.
 */

import React, { useState } from 'react';
import { mergePDFs, downloadFile } from '../../lib/pdfOperations';
import { Layers, Upload, Trash2, ArrowUp, ArrowDown, Download, CheckCircle, Loader2 } from 'lucide-react';

export const ToolMerge: React.FC = () => {
  const [files, setFiles] = useState<Array<{ name: string; buffer: ArrayBuffer; size: number }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList: File[] = Array.from(e.target.files);

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          setFiles((prev) => [...prev, { name: file.name, buffer: reader.result as ArrayBuffer, size: file.size }]);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIndex];
    newFiles[targetIndex] = temp;
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please add at least 2 PDF files to merge.');
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('Combining documents...');
      const buffers = files.map((f) => f.buffer);
      const mergedBytes = await mergePDFs(buffers);

      downloadFile(mergedBytes, 'merged_document.pdf');
      setStatus('Merged successfully!');
    } catch (err: any) {
      alert('Error merging PDFs: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Merge PDF Files</h3>
            <p className="text-xs text-slate-500">Combine multiple PDF documents into a single file in your desired order.</p>
          </div>
        </div>

        {/* Upload Zone */}
        <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
          <Upload className="w-8 h-8 text-indigo-500 mb-2" />
          <span className="text-sm font-semibold text-slate-800">Click or drag PDF files here</span>
          <span className="text-xs text-slate-400 mt-0.5">Select two or more PDFs to combine</span>
          <input type="file" accept="application/pdf" multiple onChange={handleFileInput} className="hidden" />
        </label>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 px-1">
              <span>Files to Merge ({files.length})</span>
              <button onClick={() => setFiles([])} className="text-red-500 hover:text-red-700">
                Clear all
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-md"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === files.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-md"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {files.length > 0 && (
          <div className="pt-2">
            <button
              onClick={handleMerge}
              disabled={isProcessing || files.length < 2}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Merging PDFs...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Merge and Download ({files.length} files)</span>
                </>
              )}
            </button>
          </div>
        )}

        {status && !isProcessing && (
          <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{status}</span>
          </div>
        )}
      </div>
    </div>
  );
};
