/**
 * Plain-English Note:
 * This tool allows you to trim white borders and margins from every page of your PDF
 * to make text larger and easier to read on mobile and tablets.
 */

import React, { useState } from 'react';
import { cropPDF, downloadFile } from '../../lib/pdfOperations';
import { Crop, Upload, Download, CheckCircle, Loader2 } from 'lucide-react';

interface ToolCropProps {
  initialBuffer: ArrayBuffer | null;
  initialFileName?: string;
}

export const ToolCrop: React.FC<ToolCropProps> = ({ initialBuffer, initialFileName }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(initialBuffer);
  const [fileName, setFileName] = useState<string>(initialFileName || 'document.pdf');
  const [margins, setMargins] = useState({ top: 30, bottom: 30, left: 30, right: 30 });
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

  const handleCrop = async () => {
    if (!pdfBuffer) return;

    try {
      setIsProcessing(true);
      setStatus('Cropping page margins...');

      const croppedBytes = await cropPDF(pdfBuffer, margins);
      const outName = `${fileName.replace(/\.pdf$/i, '')}_cropped.pdf`;
      downloadFile(croppedBytes, outName);
      setStatus('PDF cropped and downloaded successfully!');
    } catch (err: any) {
      alert('Error cropping PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Crop className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Crop PDF Margins</h3>
            <p className="text-xs text-slate-500">Trim unwanted outer margins and white space across all pages.</p>
          </div>
        </div>

        {/* Upload Zone */}
        {!pdfBuffer ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Select PDF to Crop</span>
            <span className="text-xs text-slate-400 mt-0.5">Choose a PDF file from your device</span>
            <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-800">{fileName}</p>
                <p className="text-[11px] text-slate-500">Ready to trim</p>
              </div>
              <label className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                Change File
                <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
              </label>
            </div>

            {/* Margin Sliders */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Top Trim ({margins.top} pt)
                </label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={margins.top}
                  onChange={(e) => setMargins((m) => ({ ...m, top: parseInt(e.target.value, 10) }))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bottom Trim ({margins.bottom} pt)
                </label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={margins.bottom}
                  onChange={(e) => setMargins((m) => ({ ...m, bottom: parseInt(e.target.value, 10) }))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Left Trim ({margins.left} pt)
                </label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={margins.left}
                  onChange={(e) => setMargins((m) => ({ ...m, left: parseInt(e.target.value, 10) }))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Right Trim ({margins.right} pt)
                </label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={margins.right}
                  onChange={(e) => setMargins((m) => ({ ...m, right: parseInt(e.target.value, 10) }))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleCrop}
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Trimming margins...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Crop & Download PDF</span>
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
