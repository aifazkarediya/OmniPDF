/**
 * Plain-English Note:
 * This tool allows you to stamp a text watermark (e.g. "CONFIDENTIAL", "DRAFT")
 * or an image logo across every page of your PDF with custom opacity, rotation, and size.
 */

import React, { useState } from 'react';
import { addWatermarkToPDF, downloadFile } from '../../lib/pdfOperations';
import { Stamp, Upload, Download, CheckCircle, Loader2 } from 'lucide-react';

interface ToolWatermarkProps {
  initialBuffer: ArrayBuffer | null;
  initialFileName?: string;
}

export const ToolWatermark: React.FC<ToolWatermarkProps> = ({ initialBuffer, initialFileName }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(initialBuffer);
  const [fileName, setFileName] = useState<string>(initialFileName || 'document.pdf');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.25);
  const [fontSize, setFontSize] = useState(48);
  const [angle, setAngle] = useState(45);
  const [colorHex, setColorHex] = useState('#94a3b8');
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

  const handleApplyWatermark = async () => {
    if (!pdfBuffer) return;

    try {
      setIsProcessing(true);
      setStatus('Applying watermark to all pages...');

      const resultBytes = await addWatermarkToPDF(pdfBuffer, {
        text: watermarkText,
        opacity,
        size: fontSize,
        angle,
        colorHex,
      });

      const outName = `${fileName.replace(/\.pdf$/i, '')}_watermarked.pdf`;
      downloadFile(resultBytes, outName);
      setStatus('Watermark applied successfully!');
    } catch (err: any) {
      alert('Error applying watermark: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Stamp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Add Watermark</h3>
            <p className="text-xs text-slate-500">Stamp confidential notices, drafts, or custom text onto your PDF.</p>
          </div>
        </div>

        {/* Upload Zone */}
        {!pdfBuffer ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Select PDF to Watermark</span>
            <span className="text-xs text-slate-400 mt-0.5">Choose a PDF file from your computer</span>
            <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-800">{fileName}</p>
                <p className="text-[11px] text-slate-500">Ready to watermark</p>
              </div>
              <label className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                Change File
                <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
              </label>
            </div>

            {/* Watermark Configuration */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'DO NOT COPY', 'PRIVATE'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWatermarkText(preset)}
                    className="text-[11px] bg-slate-200/80 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 px-2 py-0.5 rounded-md transition-colors font-medium"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Opacity ({Math.round(opacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Rotation ({angle}°)
                  </label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    value={angle}
                    onChange={(e) => setAngle(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Font Size ({fontSize}pt)
                  </label>
                  <input
                    type="range"
                    min="24"
                    max="96"
                    step="4"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleApplyWatermark}
              disabled={isProcessing || !watermarkText.trim()}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Applying Watermark...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Watermarked PDF</span>
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
