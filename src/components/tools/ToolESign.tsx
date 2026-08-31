/**
 * Plain-English Note:
 * This tool allows you to draw or upload your personal signature, place and resize it
 * onto any page of your PDF document, and export the legally signed PDF file.
 */

import React, { useState, useRef, useEffect } from 'react';
import { eSignPDF, downloadFile } from '../../lib/pdfOperations';
import { pdfjsLib } from '../../lib/pdfWorker';
import { PenTool, Upload, Download, RotateCcw, CheckCircle, Loader2, Sparkles } from 'lucide-react';

interface ToolESignProps {
  initialBuffer: ArrayBuffer | null;
  initialFileName?: string;
}

export const ToolESign: React.FC<ToolESignProps> = ({ initialBuffer, initialFileName }) => {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(initialBuffer);
  const [fileName, setFileName] = useState<string>(initialFileName || 'document.pdf');
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [inkColor, setInkColor] = useState<string>('#0f172a');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Placement state (percentages)
  const [sigPosition, setSigPosition] = useState<{ xPercent: number; yPercent: number; widthPercent: number; heightPercent: number }>({
    xPercent: 60,
    yPercent: 80,
    widthPercent: 25,
    heightPercent: 10,
  });

  const [pagePreviewUrl, setPagePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const pagePreviewContainerRef = useRef<HTMLDivElement>(null);

  // Load PDF info and render preview of current selected page
  useEffect(() => {
    if (!pdfBuffer) return;

    let isMounted = true;
    const renderTargetPage = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer.slice(0)) });
        const doc = await loadingTask.promise;
        if (!isMounted) return;
        setTotalPages(doc.numPages);

        const page = await doc.getPage(selectedPage);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        if (isMounted) {
          setPagePreviewUrl(canvas.toDataURL('image/jpeg', 0.85));
        }
      } catch (err) {
        console.error(err);
      }
    };

    renderTargetPage();

    return () => {
      isMounted = false;
    };
  }, [pdfBuffer, selectedPage]);

  // Drawing Pad Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const drawStroke = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = inkColor;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const handleClearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureDataUrl(null);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSignatureDataUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlaceOnPage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pagePreviewContainerRef.current) return;
    const rect = pagePreviewContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(80, (clickX / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(90, (clickY / rect.height) * 100));

    setSigPosition((prev) => ({
      ...prev,
      xPercent,
      yPercent,
    }));
  };

  const handleApplySignature = async () => {
    if (!pdfBuffer || !signatureDataUrl) {
      alert('Please draw or upload your signature first.');
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('Applying e-signature to document...');

      const signedBytes = await eSignPDF(pdfBuffer, [
        {
          pageNumber: selectedPage,
          xPercent: sigPosition.xPercent,
          yPercent: sigPosition.yPercent,
          widthPercent: sigPosition.widthPercent,
          heightPercent: sigPosition.heightPercent,
          pngDataUrl: signatureDataUrl,
        },
      ]);

      const outName = `${fileName.replace(/\.pdf$/i, '')}_signed.pdf`;
      downloadFile(signedBytes, outName);
      setStatus('E-Sign document downloaded successfully!');
    } catch (err: any) {
      alert('Error signing PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">E-Sign PDF Document</h3>
            <p className="text-xs text-slate-500">Draw or upload your signature and place it anywhere on any page.</p>
          </div>
        </div>

        {/* Upload Zone */}
        {!pdfBuffer ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Select PDF to Sign</span>
            <span className="text-xs text-slate-400 mt-0.5">Choose a PDF file from your device</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
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
              }}
              className="hidden"
            />
          </label>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Signature Drawing Pad */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">1. Draw Your Signature</label>
                  <div className="flex items-center space-x-1">
                    {[
                      { color: '#0f172a', label: 'Black' },
                      { color: '#1d4ed8', label: 'Blue' },
                      { color: '#0369a1', label: 'Navy' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setInkColor(c.color)}
                        style={{ backgroundColor: c.color }}
                        className={`w-4 h-4 rounded-full transition-transform ${
                          inkColor === c.color ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-70'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl bg-slate-50/50 relative overflow-hidden touch-none">
                  <canvas
                    ref={sigCanvasRef}
                    width={380}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={drawStroke}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={drawStroke}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 bg-white cursor-crosshair block"
                  />
                  {!signatureDataUrl && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-medium">
                      Sign here using your mouse or touch
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="flex items-center space-x-1 text-xs text-slate-500 hover:text-red-600 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>

                  <label className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                    Upload Signature Image
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Page Selector & Size Controls */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Select Page to Sign (Page {selectedPage} of {totalPages})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max={totalPages}
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Signature Size ({sigPosition.widthPercent}%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={sigPosition.widthPercent}
                    onChange={(e) =>
                      setSigPosition((prev) => ({
                        ...prev,
                        widthPercent: parseInt(e.target.value, 10),
                        heightPercent: parseInt(e.target.value, 10) * 0.45,
                      }))
                    }
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Page Placement Preview */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                3. Click on the document preview to position your signature:
              </label>

              <div
                ref={pagePreviewContainerRef}
                onClick={handlePlaceOnPage}
                className="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-slate-200 relative overflow-hidden cursor-pointer shadow-xs"
              >
                {pagePreviewUrl ? (
                  <img src={pagePreviewUrl} alt="Page Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    Loading page preview...
                  </div>
                )}

                {signatureDataUrl && (
                  <div
                    style={{
                      left: `${sigPosition.xPercent}%`,
                      top: `${sigPosition.yPercent}%`,
                      width: `${sigPosition.widthPercent}%`,
                      height: `${sigPosition.heightPercent}%`,
                    }}
                    className="absolute border-2 border-dashed border-indigo-600 bg-indigo-50/40 rounded-sm p-1 flex items-center justify-center pointer-events-none transition-all duration-75"
                  >
                    <img src={signatureDataUrl} alt="Signature Placement" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* Submit full width */}
            <div className="md:col-span-2 pt-2">
              <button
                onClick={handleApplySignature}
                disabled={isProcessing || !signatureDataUrl}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing PDF Document...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Save & Download Signed PDF</span>
                  </>
                )}
              </button>

              {status && (
                <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mt-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{status}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
