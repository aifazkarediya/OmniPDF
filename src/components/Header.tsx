/**
 * Plain-English Note:
 * This is the top navigation bar of the application styled with the Clean Minimalism aesthetic.
 * It lets you switch between Reader (with instant word lookup), PDF Toolkit (12+ tools),
 * and Universal File Converter.
 */

import React from 'react';
import { AppMode } from '../types/pdf';
import { BookOpen, Wrench, FileUp, ShieldCheck, Sparkles, FileText, Upload } from 'lucide-react';

interface HeaderProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onLoadSample: () => void;
  hasActiveDocument: boolean;
  documentName?: string;
  onOpenFileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  onLoadSample,
  hasActiveDocument,
  documentName,
  onOpenFileClick,
}) => {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-40 sticky top-0 shadow-2xs">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-red-600 text-white p-1.5 rounded-md shadow-2xs flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 tracking-tight text-lg">OmniPDF</span>
          <span className="hidden md:inline-block text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 px-2 py-0.5 rounded-md border border-red-100">
            Studio
          </span>
        </div>
      </div>

      {/* Navigation Switcher */}
      <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
        <button
          onClick={() => onModeChange('reader')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all ${
            currentMode === 'reader'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Reader</span>
        </button>

        <button
          onClick={() => onModeChange('tools')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all ${
            currentMode === 'tools'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Toolkit</span>
        </button>

        <button
          onClick={() => onModeChange('convert')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all ${
            currentMode === 'convert'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Converter</span>
        </button>
      </nav>

      {/* Quick Action & Document Indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        {hasActiveDocument && documentName && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md max-w-[170px] truncate border border-gray-200">
            <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{documentName}</span>
          </div>
        )}

        {!hasActiveDocument ? (
          <button
            onClick={onLoadSample}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-md border border-red-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Try Sample PDF</span>
            <span className="sm:hidden">Sample</span>
          </button>
        ) : (
          <button
            onClick={onLoadSample}
            className="hidden md:flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition-colors"
            title="Reload Sample Document"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample</span>
          </button>
        )}

        <div
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md"
          title="All processing happens securely inside your browser."
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-gray-500 font-medium">Browser Native</span>
        </div>
      </div>
    </header>
  );
};
