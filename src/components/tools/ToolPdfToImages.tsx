/**
 * Plain-English Note:
 * This tool converts every page of a PDF document into high-resolution image files (PNG or JPG).
 * You can download individual pages or save all pages at once as a single ZIP archive.
 */

import React, { useState } from 'react';
import { convertPDFToImages, createImagesZip, downloadFile } from '../../lib/pdfOperations';
import { Image as ImageIcon, Upload, Download, FileArchive, Loader2 } from 'lucide-react';

interface ToolPdfToImagesProps {
  initialBuffer: ArrayBuffer | null;
  initialFileName?: string;
}

export const ToolPdfToImages: React.FC<ToolPdfToImagesProps> = ({ initialBuffer, initialFileName }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(initialBuffer);
  const [fileName, setFileName] = useState<string>(initialFileName || 'document.pdf');
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [images, setImages] = useState<Array<{ pageNumber: number; blob: Blob; dataUrl: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setImages([]);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          setPdfBuffer(reader.result as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleConvert = async () => {
    if (!pdfBuffer) return;

    try {
      setIsProcessing(true);
      const renderedImages = await convertPDFToImages(pdfBuffer, format, 1.5);
      setImages(renderedImages);
    } catch (err: any) {
      alert('Error converting PDF to images: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (img: { pageNumber: number; blob: Blob }) => {
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const outName = `${fileName.replace(/\.pdf$/i, '')}_page_${img.pageNumber}.${ext}`;
    downloadFile(img.blob, outName, img.blob.type);
  };

  const handleDownloadAllZip = async () => {
    if (images.length === 0) return;
    try {
      setIsZipping(true);
      const zipBlob = await createImagesZip(images, fileName.replace(/\.pdf$/i, ''));
      downloadFile(zipBlob, `${fileName.replace(/\.pdf$/i, '')}_images.zip`, 'application/zip');
    } catch (err: any) {
      alert('Error creating ZIP file: ' + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Convert PDF to Images</h3>
            <p className="text-xs text-slate-500">Extract every page as crisp PNG or JPEG images and download as a ZIP.</p>
          </div>
        </div>

        {/* Upload Zone */}
        {!pdfBuffer ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Select PDF to Convert</span>
            <span className="text-xs text-slate-400 mt-0.5">Choose a PDF file from your device</span>
            <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-800">{fileName}</p>
                <p className="text-[11px] text-slate-500">Ready to export</p>
              </div>
              <label className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                Change File
                <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
              </label>
            </div>

            {/* Format choice */}
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-slate-700">Image Format:</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setFormat('png')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    format === 'png'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  PNG (Crisp Text & Lossless)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('jpeg')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    format === 'jpeg'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  JPG (Compact file size)
                </button>
              </div>
            </div>

            {/* Convert Button */}
            {images.length === 0 ? (
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering pages to high-res images...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>Render Page Images</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">
                    Generated {images.length} Image{images.length > 1 ? 's' : ''}
                  </span>

                  <button
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileArchive className="w-3.5 h-3.5" />}
                    <span>Download All as ZIP</span>
                  </button>
                </div>

                {/* Rendered images grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                  {images.map((img) => (
                    <div key={img.pageNumber} className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                        <img src={img.dataUrl} alt={`Page ${img.pageNumber}`} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Page {img.pageNumber}</span>
                        <button
                          onClick={() => handleDownloadSingle(img)}
                          className="flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md"
                        >
                          <Download className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
