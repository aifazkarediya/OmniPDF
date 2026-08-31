/**
 * Plain-English Note:
 * This is the main PDF Reading Companion. It renders PDF pages with high clarity,
 * creates an interactive text layer on top so you can select any word with your cursor,
 * and instantly triggers the dictionary definition or Google search panel without leaving the app.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { pdfjsLib } from '../../lib/pdfWorker';
import { LookupSidebar } from './LookupSidebar';
import { TextSelectionMenu } from './TextSelectionMenu';
import { DictionaryDefinition, ReadingNote } from '../../types/pdf';
import { lookupWordDefinition } from '../../lib/dictionaryApi';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Coffee,
  PanelRightClose,
  PanelRightOpen,
  Download,
  Upload,
  FileText,
  Search,
  RotateCw,
} from 'lucide-react';
import { downloadFile } from '../../lib/pdfOperations';

interface PDFReaderProps {
  pdfBuffer: ArrayBuffer | null;
  fileName?: string;
  onLoadNewFile: (buffer: ArrayBuffer, name: string) => void;
}

export const PDFReader: React.FC<PDFReaderProps> = ({
  pdfBuffer,
  fileName = 'Document.pdf',
  onLoadNewFile,
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [rotation, setRotation] = useState(0);
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'dictionary' | 'search' | 'notes' | 'thumbnails'>('dictionary');

  // Text selection & lookup state
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [dictionaryData, setDictionaryData] = useState<DictionaryDefinition | null>(null);
  const [dictionaryLoading, setDictionaryLoading] = useState(false);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [notes, setNotes] = useState<ReadingNote[]>(() => {
    try {
      const saved = localStorage.getItem('pdf_reading_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageInput, setPageInput] = useState('1');
  const [dragOver, setDragOver] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pdf_reading_notes', JSON.stringify(notes));
    } catch (e) {
      console.warn(e);
    }
  }, [notes]);

  // Load PDF document from buffer
  useEffect(() => {
    if (!pdfBuffer) {
      setPdfDoc(null);
      setTotalPages(0);
      setThumbnails([]);
      return;
    }

    let isMounted = true;
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(pdfBuffer.slice(0)),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setPageInput('1');

        // Generate quick low-res thumbnails in the background
        generateThumbnails(doc);
      } catch (err) {
        console.error('Error loading PDF document:', err);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfBuffer]);

  // Background thumbnail generation
  const generateThumbnails = async (doc: any) => {
    const thumbs: string[] = [];
    const count = Math.min(doc.numPages, 30);
    for (let i = 1; i <= count; i++) {
      try {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push(canvas.toDataURL('image/jpeg', 0.6));
      } catch (e) {
        thumbs.push('');
      }
    }
    setThumbnails(thumbs);
  };

  // Render current page & text layer
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale, rotation });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Theme-specific canvas background
      if (theme === 'sepia') {
        context.fillStyle = '#fbf0d9';
      } else if (theme === 'dark') {
        context.fillStyle = '#1e293b';
      } else {
        context.fillStyle = '#ffffff';
      }
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;

      // Render Text Layer on top for selection
      const textContent = await page.getTextContent();
      const textLayerDiv = textLayerRef.current;
      textLayerDiv.innerHTML = '';
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.height = `${viewport.height}px`;

      // Use pdfjsLib.renderTextLayer if available
      if (pdfjsLib.renderTextLayer) {
        pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport,
          textDivs: [],
        });
      }
    } catch (error: any) {
      if (error?.name !== 'RenderingCancelledException') {
        console.error('Page render error:', error);
      }
    }
  }, [pdfDoc, currentPage, scale, rotation, theme]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Handle selection on text layer
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionPosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      setSelectedText(text);
      setCurrentSearchQuery(text);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({
        x: rect.left + rect.width / 2 - 100,
        y: rect.top - 10,
      });
    }
  };

  // Trigger Dictionary Lookup
  const handleLookup = async (wordToLookup: string) => {
    if (!wordToLookup.trim()) return;
    setIsSidebarOpen(true);
    setSidebarTab('dictionary');
    setCurrentSearchQuery(wordToLookup);
    setDictionaryLoading(true);
    setDictionaryError(null);
    setSelectionPosition(null);

    const res = await lookupWordDefinition(wordToLookup);
    setDictionaryLoading(false);
    if (res.success && res.data) {
      setDictionaryData(res.data);
    } else {
      setDictionaryData(null);
      setDictionaryError(res.error || 'Definition not found.');
    }
  };

  // Trigger Google Search
  const handleSearchGoogle = (query: string) => {
    setIsSidebarOpen(true);
    setSidebarTab('search');
    setCurrentSearchQuery(query);
    setSelectionPosition(null);
  };

  // Add Note
  const handleAddNoteFromSelection = (text: string) => {
    setIsSidebarOpen(true);
    setSidebarTab('notes');
    setCurrentSearchQuery(text);
    setSelectionPosition(null);
  };

  const handleCreateNote = (noteData: Omit<ReadingNote, 'id' | 'createdAt'>) => {
    const newNote: ReadingNote = {
      ...noteData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      setPageInput(String(currentPage - 1));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      setPageInput(String(currentPage + 1));
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(pageInput, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        setCurrentPage(pageNum);
      } else {
        setPageInput(String(currentPage));
      }
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(2.5, s + 0.2));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.2));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // File Upload Handlers
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          onLoadNewFile(reader.result, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          onLoadNewFile(reader.result, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const themeStyles = {
    light: 'bg-[#F3F4F6]',
    sepia: 'bg-[#f4ebd0] text-[#433422]',
    dark: 'bg-gray-900 text-gray-100',
  };

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col h-full w-full overflow-hidden ${themeStyles[theme]} select-none`}
    >
      {/* Top Reading Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between z-20 shadow-2xs">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || !pdfDoc}
            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40 text-gray-700 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <span>Page</span>
            <input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              disabled={!pdfDoc}
              className="w-12 text-center py-1 px-1.5 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-red-500 font-semibold"
            />
            <span>of {totalPages || 1}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || !pdfDoc}
            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40 text-gray-700 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Zoom & Rotate Controls */}
        <div className="hidden sm:flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
          <button
            onClick={handleZoomOut}
            disabled={!pdfDoc}
            className="p-1 rounded-md hover:bg-gray-200 text-gray-700 disabled:opacity-40 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-gray-700 min-w-[48px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={!pdfDoc}
            className="p-1 rounded-md hover:bg-gray-200 text-gray-700 disabled:opacity-40 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-gray-200 mx-0.5" />

          <button
            onClick={handleRotate}
            disabled={!pdfDoc}
            className="p-1 rounded-md hover:bg-gray-200 text-gray-700 disabled:opacity-40 transition-colors"
            title="Rotate Page"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Theme, Download & Sidebar Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Themes */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-white shadow-2xs text-red-600' : 'text-gray-500'}`}
              title="Light theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`p-1.5 rounded-md transition-colors ${theme === 'sepia' ? 'bg-amber-100 text-amber-800 shadow-2xs' : 'text-gray-500'}`}
              title="Sepia book theme"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-gray-800 text-red-400 shadow-2xs' : 'text-gray-500'}`}
              title="Dark theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          <label className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors" title="Open PDF">
            <Upload className="w-4 h-4" />
            <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
          </label>

          {pdfBuffer && (
            <button
              onClick={() => downloadFile(new Uint8Array(pdfBuffer), fileName)}
              className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-md border transition-colors ${
              isSidebarOpen
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
            title={isSidebarOpen ? 'Hide Sidebar' : 'Show Lookup Sidebar'}
          >
            {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Page Canvas Stage */}
        <div
          onMouseUp={handleMouseUp}
          className="flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center relative"
        >
          {!pdfDoc ? (
            /* Empty State / Upload Prompt */
            <div className="max-w-md w-full my-auto text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-2xs border border-red-100">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Open a PDF to Start Reading</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Drag and drop your PDF textbook or paper here, or select a file from your device.
                </p>
              </div>

              <div className="flex items-center justify-center pt-2">
                <label className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs transition-colors inline-flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Browse PDF File</span>
                  <input type="file" accept="application/pdf" onChange={handleFileInput} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            /* Rendered PDF Page with Selectable Text Overlay */
            <div className="relative shadow-xl rounded-sm transition-transform duration-100 bg-white border border-gray-300 select-text">
              <canvas ref={canvasRef} className="block rounded-sm" />
              <div
                ref={textLayerRef}
                className="pdf-text-layer absolute top-0 left-0 overflow-hidden leading-none select-text pointer-events-auto"
                style={{
                  transformOrigin: 'top left',
                }}
              />
            </div>
          )}
        </div>

        {/* Floating Quick Action Selection Tooltip */}
        {selectionPosition && selectedText && (
          <TextSelectionMenu
            position={selectionPosition}
            selectedText={selectedText}
            onDefine={handleLookup}
            onSearchGoogle={handleSearchGoogle}
            onAddNote={handleAddNoteFromSelection}
            onClose={() => setSelectionPosition(null)}
          />
        )}

        {/* Instant Lookup & Companion Sidebar */}
        <LookupSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          dictionaryData={dictionaryData}
          dictionaryLoading={dictionaryLoading}
          dictionaryError={dictionaryError}
          currentSearchQuery={currentSearchQuery}
          onSearchQueryChange={setCurrentSearchQuery}
          onLookupWord={handleLookup}
          notes={notes}
          onAddNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
          currentPage={currentPage}
          totalPages={totalPages}
          pageThumbnails={thumbnails}
          onJumpToPage={(p) => {
            setCurrentPage(p);
            setPageInput(String(p));
          }}
        />
      </div>
    </div>
  );
};
