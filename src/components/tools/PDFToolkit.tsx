/**
 * Plain-English Note:
 * This is the PDF Toolkit dashboard. It displays cards for all the individual PDF tools
 * (Merge, Split, Rotate/Delete, Watermark, Page Numbers, Compress, E-Sign, OCR, Crop, and Images).
 * Clicking any tool card opens its dedicated workspace.
 */

import React, { useState } from 'react';
import { ToolMerge } from './ToolMerge';
import { ToolSplitExtract } from './ToolSplitExtract';
import { ToolOrganizePages } from './ToolOrganizePages';
import { ToolWatermark } from './ToolWatermark';
import { ToolPageNumbers } from './ToolPageNumbers';
import { ToolCompress } from './ToolCompress';
import { ToolPdfToImages } from './ToolPdfToImages';
import { ToolESign } from './ToolESign';
import { ToolOCR } from './ToolOCR';
import { ToolCrop } from './ToolCrop';
import {
  Layers,
  Scissors,
  RotateCw,
  Minimize2,
  Stamp,
  Hash,
  Image as ImageIcon,
  PenTool,
  ScanText,
  Crop,
  ArrowLeft,
  Wrench,
  Sparkles,
} from 'lucide-react';

interface PDFToolkitProps {
  currentBuffer: ArrayBuffer | null;
  currentFileName?: string;
  onOpenReader: () => void;
}

type ActiveToolKey =
  | 'merge'
  | 'split'
  | 'organize'
  | 'compress'
  | 'watermark'
  | 'page-numbers'
  | 'pdf-to-images'
  | 'esign'
  | 'ocr'
  | 'crop'
  | null;

export const PDFToolkit: React.FC<PDFToolkitProps> = ({
  currentBuffer,
  currentFileName,
  onOpenReader,
}) => {
  const [activeTool, setActiveTool] = useState<ActiveToolKey>(null);

  const toolsList = [
    {
      id: 'merge' as const,
      title: 'Merge PDFs',
      description: 'Combine multiple PDF files into a single unified document.',
      icon: Layers,
      color: 'bg-red-50 text-red-600',
      badge: 'Popular',
    },
    {
      id: 'split' as const,
      title: 'Split & Extract',
      description: 'Extract specific pages or page ranges (e.g. 1-3, 5, 8-10).',
      icon: Scissors,
      color: 'bg-rose-50 text-rose-600',
    },
    {
      id: 'organize' as const,
      title: 'Rotate, Delete & Reorder',
      description: 'Visual grid to rotate 90°, delete pages, or reorder pages.',
      icon: RotateCw,
      color: 'bg-blue-50 text-blue-600',
      badge: 'Interactive',
    },
    {
      id: 'compress' as const,
      title: 'Compress PDF',
      description: 'Reduce file size while keeping text and diagrams crisp.',
      icon: Minimize2,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'esign' as const,
      title: 'E-Sign PDF',
      description: 'Draw or upload your signature and place it onto any page.',
      icon: PenTool,
      color: 'bg-amber-50 text-amber-600',
      badge: 'Essential',
    },
    {
      id: 'ocr' as const,
      title: 'OCR Scanned Text',
      description: 'Recognize and copy text from scanned pages using browser AI.',
      icon: ScanText,
      color: 'bg-purple-50 text-purple-600',
      badge: 'Smart OCR',
    },
    {
      id: 'watermark' as const,
      title: 'Add Watermark',
      description: 'Stamp text or image notice across pages with custom angle & opacity.',
      icon: Stamp,
      color: 'bg-cyan-50 text-cyan-600',
    },
    {
      id: 'page-numbers' as const,
      title: 'Add Page Numbers',
      description: 'Insert header or footer numbers (e.g. "Page 1 of 12").',
      icon: Hash,
      color: 'bg-teal-50 text-teal-600',
    },
    {
      id: 'pdf-to-images' as const,
      title: 'PDF to Images',
      description: 'Convert PDF pages to high-res PNG or JPG files or ZIP archive.',
      icon: ImageIcon,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      id: 'crop' as const,
      title: 'Crop Margins',
      description: 'Trim white margins and borders for optimal mobile and tablet reading.',
      icon: Crop,
      color: 'bg-gray-100 text-gray-700',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* If a tool is active, show back button and tool sub-view */}
      {activeTool ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTool(null)}
              className="flex items-center space-x-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-lg transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All PDF Tools</span>
            </button>

            {currentBuffer && (
              <button
                onClick={onOpenReader}
                className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
              >
                Open in Reader Mode &rarr;
              </button>
            )}
          </div>

          {activeTool === 'merge' && <ToolMerge />}
          {activeTool === 'split' && (
            <ToolSplitExtract initialBuffer={currentBuffer} initialFileName={currentFileName} />
          )}
          {activeTool === 'organize' && (
            <ToolOrganizePages initialBuffer={currentBuffer} initialFileName={currentFileName} />
          )}
          {activeTool === 'compress' && (
            <ToolCompress initialBuffer={currentBuffer} initialFileName={currentFileName} />
          )}
          {activeTool === 'watermark' && (
            <ToolWatermark initialBuffer={currentBuffer} initialFileName={currentFileName} />
          )}
          {activeTool === 'page-numbers' && (
            <ToolPageNumbers initialBuffer={currentBuffer} initialFileName={currentFileName} />
          )}
          {activeTool === 'pdf-to-images' && (
            <ToolPdfToImages initialBuffer={currentBuffer} initialFileName={currentFileName} />
          )}
          {activeTool === 'esign' && (
            <ToolESign initialBuffer={currentBuffer} initialFileName={currentFileName} />
          )}
          {activeTool === 'ocr' && (
            <ToolOCR initialBuffer={currentBuffer} initialFileName={currentFileName} />
          )}
          {activeTool === 'crop' && (
            <ToolCrop initialBuffer={currentBuffer} initialFileName={currentFileName} />
          )}
        </div>
      ) : (
        /* Tools Grid View */
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-red-50 text-red-700 text-xs font-semibold px-3 py-1 rounded-full border border-red-200">
              <Wrench className="w-3.5 h-3.5" />
              <span>100% Client-Side WebAssembly Tools</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Complete PDF Toolkit
            </h2>
            <p className="text-sm text-gray-500">
              Every PDF operation runs privately inside your browser. No files are ever uploaded or stored on servers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {toolsList.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs hover:shadow-md hover:border-red-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tool.color} shadow-2xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {tool.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 px-2 py-0.5 rounded-md border border-red-100">
                          {tool.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tool.description}</p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center text-xs font-semibold text-red-600 group-hover:text-red-700">
                    <span>Use Tool</span>
                    <span className="ml-1 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
