/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plain-English Note:
 * This is the main application component. It manages which view is active
 * (Reader, PDF Tools, or File Converter) and holds the currently loaded PDF document
 * in memory so you can easily read, look up words, or apply tools without re-uploading.
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { PDFReader } from './components/reader/PDFReader';
import { PDFToolkit } from './components/tools/PDFToolkit';
import { FileConverter } from './components/converter/FileConverter';
import { AppMode } from './types/pdf';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('reader');
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [documentName, setDocumentName] = useState<string>('');

  const handleLoadNewFile = (buffer: ArrayBuffer, name: string) => {
    setPdfBuffer(buffer);
    setDocumentName(name);
  };

  const handleOpenConvertedInReader = (buffer: ArrayBuffer, name: string) => {
    setPdfBuffer(buffer);
    setDocumentName(name);
    setCurrentMode('reader');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F3F4F6] text-gray-800 font-sans overflow-hidden">
      {/* Top Application Header */}
      <Header
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        hasActiveDocument={!!pdfBuffer}
        documentName={documentName}
      />

      {/* Main Content Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentMode === 'reader' && (
          <PDFReader
            pdfBuffer={pdfBuffer}
            fileName={documentName || 'Document.pdf'}
            onLoadNewFile={handleLoadNewFile}
          />
        )}

        {currentMode === 'tools' && (
          <div className="flex-1 overflow-y-auto bg-[#F3F4F6]">
            <PDFToolkit
              currentBuffer={pdfBuffer}
              currentFileName={documentName || 'Document.pdf'}
              onOpenReader={() => setCurrentMode('reader')}
            />
          </div>
        )}

        {currentMode === 'convert' && (
          <div className="flex-1 overflow-y-auto bg-[#F3F4F6]">
            <FileConverter onOpenInReader={handleOpenConvertedInReader} />
          </div>
        )}
      </main>

      {/* Clean Minimalism Status Bar */}
      <footer className="h-7 bg-white border-t border-gray-200 flex items-center justify-between px-4 text-[11px] text-gray-500 font-medium shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ready</span>
          </div>
          <span className="text-gray-300">|</span>
          <span className="truncate max-w-[250px]">{documentName || 'No document loaded'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Client-side WebAssembly Engine</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">Zero Server Uploads</span>
        </div>
      </footer>
    </div>
  );
}
