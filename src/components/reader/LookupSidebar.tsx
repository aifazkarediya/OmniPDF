/**
 * Plain-English Note:
 * This sidebar appears next to your PDF reader. It gives you instant dictionary definitions,
 * Wikipedia/Google Search links, page thumbnails, and your personal reading notes & highlights.
 */

import React, { useState } from 'react';
import {
  BookMarked,
  Search,
  Highlighter,
  LayoutGrid,
  X,
  Volume2,
  ExternalLink,
  Plus,
  Trash2,
  Download,
  GraduationCap,
  Globe,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { DictionaryDefinition, ReadingNote } from '../../types/pdf';
import {
  speakText,
  getGoogleSearchUrl,
  getGoogleScholarUrl,
  getWikipediaSearchUrl,
} from '../../lib/dictionaryApi';

interface LookupSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'dictionary' | 'search' | 'notes' | 'thumbnails';
  onTabChange: (tab: 'dictionary' | 'search' | 'notes' | 'thumbnails') => void;
  dictionaryData: DictionaryDefinition | null;
  dictionaryLoading: boolean;
  dictionaryError: string | null;
  currentSearchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onLookupWord: (word: string) => void;
  notes: ReadingNote[];
  onAddNote: (note: Omit<ReadingNote, 'id' | 'createdAt'>) => void;
  onDeleteNote: (id: string) => void;
  currentPage: number;
  totalPages: number;
  pageThumbnails?: string[];
  onJumpToPage: (pageNum: number) => void;
}

export const LookupSidebar: React.FC<LookupSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  dictionaryData,
  dictionaryLoading,
  dictionaryError,
  currentSearchQuery,
  onSearchQueryChange,
  onLookupWord,
  notes,
  onAddNote,
  onDeleteNote,
  currentPage,
  totalPages,
  pageThumbnails = [],
  onJumpToPage,
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState<'yellow' | 'green' | 'blue' | 'pink'>('yellow');

  if (!isOpen) return null;

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    onAddNote({
      pageNumber: currentPage,
      selectedText: currentSearchQuery || `Page ${currentPage} note`,
      noteText: newNoteText.trim(),
      color: selectedColor,
    });
    setNewNoteText('');
  };

  const handleExportNotes = () => {
    if (notes.length === 0) return;
    const content = notes
      .map(
        (n, i) =>
          `### ${i + 1}. Page ${n.pageNumber}\n**Selected Text**: "${n.selectedText}"\n**Note**: ${n.noteText}\n*Added: ${new Date(n.createdAt).toLocaleString()}*\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([`# Reading Notes & Highlights\n\n${content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdf-reading-notes.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="w-80 sm:w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg z-30 transition-all shrink-0">
      {/* Sidebar Top Nav Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 p-2 bg-gray-50/80">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onTabChange('dictionary')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'dictionary'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Dictionary</span>
          </button>

          <button
            onClick={() => onTabChange('search')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'search'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <button
            onClick={() => onTabChange('notes')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'notes'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Notes ({notes.length})</span>
          </button>

          <button
            onClick={() => onTabChange('thumbnails')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'thumbnails'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Pages</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
          title="Close Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sidebar Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: DICTIONARY LOOKUP */}
        {activeTab === 'dictionary' && (
          <div className="space-y-4">
            {/* Quick Word Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Look up any English word..."
                value={currentSearchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onLookupWord(currentSearchQuery)}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <button
                onClick={() => onLookupWord(currentSearchQuery)}
                disabled={!currentSearchQuery.trim()}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
              >
                Search
              </button>
            </div>

            {dictionaryLoading && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-600">Looking up definition & phonetics...</p>
              </div>
            )}

            {!dictionaryLoading && dictionaryError && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <p className="text-sm text-amber-800">{dictionaryError}</p>
                {currentSearchQuery && (
                  <a
                    href={getGoogleSearchUrl(currentSearchQuery)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    <span>Search &quot;{currentSearchQuery}&quot; on Google</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {!dictionaryLoading && !dictionaryError && !dictionaryData && (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <BookMarked className="w-10 h-10 mx-auto text-gray-300" />
                <p className="text-sm font-semibold text-gray-700">Select any word in the PDF</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Highlight a word or phrase with your mouse to view pronunciation, definitions, and examples instantly.
                </p>
              </div>
            )}

            {!dictionaryLoading && dictionaryData && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Word Header & Pronunciation */}
                <div className="bg-red-50/60 p-4 rounded-xl border border-red-100 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 capitalize">{dictionaryData.word}</h2>
                    {dictionaryData.phonetic && (
                      <p className="text-xs font-mono text-red-600 mt-0.5">{dictionaryData.phonetic}</p>
                    )}
                  </div>
                  <button
                    onClick={() => speakText(dictionaryData.word)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-xs"
                    title="Play pronunciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Meanings */}
                <div className="space-y-4">
                  {dictionaryData.meanings.map((meaning, mIdx) => (
                    <div key={mIdx} className="space-y-2 border-b border-gray-100 pb-3 last:border-0">
                      <div className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-md uppercase tracking-wide">
                        {meaning.partOfSpeech}
                      </div>

                      <div className="space-y-2 pl-2 border-l-2 border-red-400">
                        {meaning.definitions.slice(0, 3).map((def, dIdx) => (
                          <div key={dIdx} className="text-xs space-y-1">
                            <p className="text-gray-800 leading-relaxed font-medium">
                              <span className="text-gray-400 mr-1">{dIdx + 1}.</span>
                              {def.definition}
                            </p>
                            {def.example && (
                              <p className="text-gray-500 italic pl-3 border-l border-gray-200">
                                &ldquo;{def.example}&rdquo;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Synonyms */}
                      {meaning.definitions.some((d) => d.synonyms && d.synonyms.length > 0) && (
                        <div className="pt-1">
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                            Synonyms:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {meaning.definitions
                              .flatMap((d) => d.synonyms || [])
                              .slice(0, 6)
                              .map((syn, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => onLookupWord(syn)}
                                  className="text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-2 py-0.5 rounded-md transition-colors border border-gray-200/60"
                                >
                                  {syn}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Google Search Link from Word */}
                <div className="pt-2">
                  <a
                    href={getGoogleSearchUrl(dictionaryData.word)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center space-x-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors border border-gray-200"
                  >
                    <Search className="w-3.5 h-3.5 text-blue-500" />
                    <span>Search &quot;{dictionaryData.word}&quot; on Google</span>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GOOGLE & WEB SEARCH */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Search Phrase</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentSearchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder="Type any word or concept..."
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Instant Search Launchers
              </p>

              {/* Google Search Card */}
              <a
                href={getGoogleSearchUrl(currentSearchQuery || 'PDF reading companion')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/20 transition-all group shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-700">Google Web Search</h4>
                    <p className="text-[11px] text-gray-500">Search web results, definitions, and articles</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
              </a>

              {/* Google Scholar Card */}
              <a
                href={getGoogleScholarUrl(currentSearchQuery || 'Academic papers and research')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">Google Scholar</h4>
                    <p className="text-[11px] text-gray-500">Citations, scientific papers, and textbooks</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
              </a>

              {/* Wikipedia Card */}
              <a
                href={getWikipediaSearchUrl(currentSearchQuery || 'Encyclopedia')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/20 transition-all group shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-purple-700">Wikipedia</h4>
                    <p className="text-[11px] text-gray-500">Free encyclopedia summaries & background</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
              </a>

              {/* Google Images Card */}
              <a
                href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(currentSearchQuery || 'diagram')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/20 transition-all group shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-700">Google Images</h4>
                    <p className="text-[11px] text-gray-500">Diagrams, visual charts, and illustrations</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-amber-600" />
              </a>
            </div>
          </div>
        )}

        {/* TAB 3: NOTES & HIGHLIGHTS */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {/* Create Note Form */}
            <form onSubmit={handleCreateNote} className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Add Note for Page {currentPage}</span>
                <div className="flex items-center space-x-1">
                  {(['yellow', 'green', 'blue', 'pink'] as const).map((color) => {
                    const colorStyles = {
                      yellow: 'bg-amber-400',
                      green: 'bg-emerald-400',
                      blue: 'bg-blue-400',
                      pink: 'bg-pink-400',
                    };
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-4 h-4 rounded-full ${colorStyles[color]} transition-transform ${
                          selectedColor === color ? 'ring-2 ring-gray-800 scale-110' : 'opacity-70'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {currentSearchQuery && (
                <div className="text-[11px] bg-white p-1.5 rounded-md border border-gray-200 text-gray-600 italic line-clamp-2">
                  &ldquo;{currentSearchQuery}&rdquo;
                </div>
              )}

              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Write your reflection, summary, or thoughts here..."
                rows={2}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />

              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </form>

            {/* Export Notes Button */}
            {notes.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500">Saved Notes ({notes.length})</span>
                <button
                  onClick={handleExportNotes}
                  className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-800 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Notes</span>
                </button>
              </div>
            )}

            {/* Notes List */}
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-400 space-y-1">
                <Highlighter className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs font-medium text-gray-600">No notes yet</p>
                <p className="text-[11px]">Select text or use the form above to add notes while reading.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => {
                  const borderColors = {
                    yellow: 'border-l-amber-400 bg-amber-50/40',
                    green: 'border-l-emerald-400 bg-emerald-50/40',
                    blue: 'border-l-blue-400 bg-blue-50/40',
                    pink: 'border-l-pink-400 bg-pink-50/40',
                  };
                  return (
                    <div
                      key={note.id}
                      className={`p-3 rounded-xl border border-gray-200 border-l-4 ${borderColors[note.color]} space-y-1.5`}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => onJumpToPage(note.pageNumber)}
                          className="text-[11px] font-bold text-red-600 hover:underline"
                        >
                          Page {note.pageNumber}
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="text-gray-400 hover:text-red-600 p-0.5 rounded-sm"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {note.selectedText && (
                        <p className="text-[11px] font-medium text-gray-700 italic border-l-2 border-gray-300 pl-2">
                          &ldquo;{note.selectedText}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-gray-800 whitespace-pre-wrap">{note.noteText}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PAGE THUMBNAILS */}
        {activeTab === 'thumbnails' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500">All Pages ({totalPages})</p>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => onJumpToPage(pageNum)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    currentPage === pageNum
                      ? 'border-red-600 bg-red-50/70 ring-2 ring-red-500/20'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-[3/4] bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-2xs mb-1.5 overflow-hidden">
                    {pageThumbnails[pageNum - 1] ? (
                      <img
                        src={pageThumbnails[pageNum - 1]}
                        alt={`Page ${pageNum}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs font-mono text-gray-400">Page {pageNum}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      currentPage === pageNum ? 'text-red-700' : 'text-gray-600'
                    }`}
                  >
                    Page {pageNum}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
