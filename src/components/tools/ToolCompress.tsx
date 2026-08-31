/**
 * Plain-English Note:
 * This tool reduces the file size of your PDF while maintaining sharp readability.
 * Useful for emailing large PDF textbooks, homework, or reports.
 */

import React, { useState } from 'react';
import { compressPDF, downloadFile } from '../../lib/pdfOperations';
import { Minimize2, Upload, Download, CheckCircle, Loader2, Zap } from 'lucide-react';

interface ToolCompressProps {
  initialBuffer: ArrayBuffer | null;
  initialFileName?: string;
}

export const ToolCompress: React.FC<ToolCompressProps> = ({ initialBuffer, initialFileName }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(initialBuffer);
  const [fileName, setFileName] = useState<string>(initialFileName || 'document.pdf');
  const [fileSize, setFileSize] = useState<number>(initialBuffer ? initialBuffer.byteLength : 0);
  const [qualityFactor, setQualityFactor] = useState<'low' | 'medium' | 'high'>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(file.size);
      setResultSize(null);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          setPdfBuffer(reader.result as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleCompress = async () => {
    if (!pdfBuffer) return;

    try {
      setIsProcessing(true);
      setStatus('Optimizing and compressing pages...');

      const compressedBytes = await compressPDF(pdfBuffer, qualityFactor);
      setResultSize(compressedBytes.byteLength);

      const outName = `${fileName.replace(/\.pdf$/i, '')}_compressed.pdf`;
      downloadFile(compressedBytes, outName);
      setStatus('PDF compressed successfully!');
    } catch (err: any) {
      alert('Error compressing PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Minimize2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Compress PDF</h3>
            <p className="text-xs text-slate-500">Reduce document file size for easy emailing and fast mobile viewing.</p>
          </div>
        </div>

        {/* Upload Zone */}
        {!pdfBuffer ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Select PDF to Compress</span>
            <span className="text-xs text-slate-400 mt-0.5">Choose a PDF file from your device</span>
            <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-800">{fileName}</p>
                <p className="text-[11px] text-slate-500">Original Size: {formatSize(fileSize)}</p>
              </div>
              <label className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                Change File
                <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
              </label>
            </div>

            {/* Compression Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'high',
                  title: 'Extreme Compress',
                  desc: 'Smallest file size (~70% reduction)',
                  badge: 'Smallest Size',
                },
                {
                  id: 'medium',
                  title: 'Recommended',
                  desc: 'Great balance of quality and size',
                  badge: 'Balanced',
                },
                {
                  id: 'low',
                  title: 'High Quality',
                  desc: 'High clarity with light compression',
                  badge: 'Crisp Text',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setQualityFactor(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    qualityFactor === opt.id
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                    {opt.badge}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{opt.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleCompress}
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compressing Document...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Compress & Download PDF</span>
                </>
              )}
            </button>

            {status && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{status}</span>
                </div>
                {resultSize && (
                  <p className="text-[11px] text-emerald-700 pl-6">
                    File size reduced from {formatSize(fileSize)} to {formatSize(resultSize)} (saved{' '}
                    {Math.max(0, Math.round(((fileSize - resultSize) / fileSize) * 100))}%).
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
