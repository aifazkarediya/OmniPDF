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

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PDFReader } from './components/reader/PDFReader';
import { PDFToolkit } from './components/tools/PDFToolkit';
import { FileConverter } from './components/converter/FileConverter';
import { createSamplePDF } from './lib/sampleDoc';
import { AppMode } from './types/pdf';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('reader');
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [documentName, setDocumentName] = useState<string>('Document.pdf');

  // Load sample document automatically on initial mount so user has something to read and test right away
  useEffect(() => {
    const initSample = async () => {
      try {
        const sample = await createSamplePDF();
        setPdfBuffer(sample.buffer);
        setDocumentName(sample.fileName);
      } catch (err) {
        console.error('Error loading initial sample:', err);
      }
    };

    initSample();
  }, []);

  const handleLoadSample = async () => {
    try {
      const sample = await createSamplePDF();
      setPdfBuffer(sample.buffer);
      setDocumentName(sample.fileName);
      setCurrentMode('reader');
    } catch (err) {
      console.error(err);
    }
  };

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
        onLoadSample={handleLoadSample}
        hasActiveDocument={!!pdfBuffer}
        documentName={documentName}
      />

      {/* Main Content Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentMode === 'reader' && (
          <PDFReader
            pdfBuffer={pdfBuffer}
            fileName={documentName}
            onLoadNewFile={handleLoadNewFile}
            onOpenSample={handleLoadSample}
          />
        )}

        {currentMode === 'tools' && (
          <div className="flex-1 overflow-y-auto bg-[#F3F4F6]">
            <PDFToolkit
              currentBuffer={pdfBuffer}
              currentFileName={documentName}
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
          <span className="truncate max-w-[250px]">{documentName}</span>
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
