/**
 * Plain-English Note:
 * This tool gives you a visual grid of all pages in your PDF.
 * You can rotate any page 90/180/270 degrees, delete unwanted pages,
 * or drag/move pages into a new order.
 */

import React, { useState, useEffect } from 'react';
import { reorderRotateDeletePages, downloadFile } from '../../lib/pdfOperations';
import { pdfjsLib } from '../../lib/pdfWorker';
import { RotateCw, Trash2, ArrowLeft, ArrowRight, Download, RefreshCw, Upload, Undo2, Loader2 } from 'lucide-react';

interface ToolOrganizePagesProps {
  initialBuffer: ArrayBuffer | null;
  initialFileName?: string;
}

interface PageItem {
  originalIndex: number;
  rotation: number;
  deleted: boolean;
  thumbnail: string;
}

export const ToolOrganizePages: React.FC<ToolOrganizePagesProps> = ({ initialBuffer, initialFileName }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(initialBuffer);
  const [fileName, setFileName] = useState<string>(initialFileName || 'document.pdf');
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!pdfBuffer) return;

    let isMounted = true;
    const loadThumbnails = async () => {
      setIsLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer.slice(0)) });
        const doc = await loadingTask.promise;
        const items: PageItem[] = [];

        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;

          items.push({
            originalIndex: i - 1,
            rotation: 0,
            deleted: false,
            thumbnail: canvas.toDataURL('image/jpeg', 0.7),
          });
        }

        if (isMounted) {
          setPages(items);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadThumbnails();

    return () => {
      isMounted = false;
    };
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

  const handleRotatePage = (index: number) => {
    setPages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], rotation: (next[index].rotation + 90) % 360 };
      return next;
    });
  };

  const handleToggleDelete = (index: number) => {
    setPages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], deleted: !next[index].deleted };
      return next;
    });
  };

  const handleMovePage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= pages.length) return;
    const next = [...pages];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setPages(next);
  };

  const handleRotateAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })));
  };

  const handleResetAll = () => {
    setPages((prev) =>
      prev
        .map((p) => ({ ...p, rotation: 0, deleted: false }))
        .sort((a, b) => a.originalIndex - b.originalIndex)
    );
  };

  const handleSave = async () => {
    if (!pdfBuffer) return;

    try {
      setIsSaving(true);
      const mods = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
        deleted: p.deleted,
      }));

      const newPdfBytes = await reorderRotateDeletePages(pdfBuffer, mods);
      const outName = `${fileName.replace(/\.pdf$/i, '')}_organized.pdf`;
      downloadFile(newPdfBytes, outName);
    } catch (err: any) {
      alert('Error organizing PDF: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const activeCount = pages.filter((p) => !p.deleted).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Organize, Rotate & Delete Pages</h3>
              <p className="text-xs text-slate-500">Visual drag/move, rotate 90°, and delete unwanted pages.</p>
            </div>
          </div>

          {pdfBuffer && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRotateAll}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                title="Rotate all pages 90° clockwise"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate All</span>
              </button>
              <button
                onClick={handleResetAll}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                title="Reset all changes"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* Upload Zone */}
        {!pdfBuffer ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Select PDF to Organize</span>
            <span className="text-xs text-slate-400 mt-0.5">Choose a PDF file from your computer</span>
            <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
                <p className="text-xs font-medium text-slate-600">Generating page thumbnails...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                  <span>
                    Showing {pages.length} pages ({activeCount} active, {pages.length - activeCount} deleted)
                  </span>
                  <label className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                    Change File
                    <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
                  </label>
                </div>

                {/* Visual Thumbnail Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                  {pages.map((item, idx) => (
                    <div
                      key={idx}
                      className={`relative p-2.5 rounded-xl border transition-all ${
                        item.deleted
                          ? 'border-red-300 bg-red-50/60 opacity-60'
                          : 'border-slate-200 bg-white shadow-2xs hover:border-indigo-400'
                      }`}
                    >
                      {/* Page Label */}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-700">
                          {idx + 1}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            (orig: {item.originalIndex + 1})
                          </span>
                        </span>
                        {item.rotation > 0 && (
                          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1 rounded">
                            {item.rotation}°
                          </span>
                        )}
                      </div>

                      {/* Thumbnail Container */}
                      <div className="aspect-[3/4] bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 mb-2">
                        <img
                          src={item.thumbnail}
                          alt={`Page ${item.originalIndex + 1}`}
                          style={{ transform: `rotate(${item.rotation}deg)` }}
                          className="max-h-full max-w-full object-contain transition-transform duration-200"
                        />
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleMovePage(idx, 'left')}
                            disabled={idx === 0}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 rounded"
                            title="Move left"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMovePage(idx, 'right')}
                            disabled={idx === pages.length - 1}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 rounded"
                            title="Move right"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleRotatePage(idx)}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                            title="Rotate 90°"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleDelete(idx)}
                            className={`p-1 rounded ${
                              item.deleted ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-red-600'
                            }`}
                            title={item.deleted ? 'Restore page' : 'Delete page'}
                          >
                            {item.deleted ? <Undo2 className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || activeCount === 0}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Apply Changes & Download PDF ({activeCount} pages)</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
