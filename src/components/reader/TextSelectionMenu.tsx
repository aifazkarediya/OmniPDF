/**
 * Plain-English Note:
 * This is the floating menu that appears right where you select text on a PDF page.
 * It lets you instantly trigger a dictionary definition, Google search, text-to-speech audio,
 * or add a highlight note without having to leave what you are reading.
 */

import React from 'react';
import { BookMarked, Search, Volume2, Highlighter, Copy, Check } from 'lucide-react';
import { speakText } from '../../lib/dictionaryApi';

interface TextSelectionMenuProps {
  position: { x: number; y: number };
  selectedText: string;
  onDefine: (text: string) => void;
  onSearchGoogle: (text: string) => void;
  onAddNote: (text: string) => void;
  onClose: () => void;
}

export const TextSelectionMenu: React.FC<TextSelectionMenuProps> = ({
  position,
  selectedText,
  onDefine,
  onSearchGoogle,
  onAddNote,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    speakText(selectedText);
  };

  return (
    <div
      style={{
        left: `${Math.max(10, Math.min(window.innerWidth - 320, position.x))}px`,
        top: `${Math.max(60, position.y - 50)}px`,
      }}
      className="fixed z-50 flex items-center bg-gray-900 text-white px-2 py-1.5 rounded-lg shadow-xl border border-gray-700 animate-in fade-in zoom-in-95 duration-150 space-x-1"
    >
      <button
        onClick={() => onDefine(selectedText)}
        className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors shadow-xs"
        title="Look up definition, phonetics & synonyms"
      >
        <BookMarked className="w-3.5 h-3.5" />
        <span>Define</span>
      </button>

      <button
        onClick={() => onSearchGoogle(selectedText)}
        className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-md transition-colors"
        title="Search on Google & Google Scholar"
      >
        <Search className="w-3.5 h-3.5 text-blue-400" />
        <span>Google</span>
      </button>

      <button
        onClick={handleSpeak}
        className="p-1.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded-md transition-colors"
        title="Listen to pronunciation"
      >
        <Volume2 className="w-4 h-4 text-emerald-400" />
      </button>

      <button
        onClick={() => onAddNote(selectedText)}
        className="p-1.5 hover:bg-gray-800 text-gray-300 hover:text-amber-300 rounded-md transition-colors"
        title="Highlight & Add Note"
      >
        <Highlighter className="w-4 h-4 text-amber-400" />
      </button>

      <button
        onClick={handleCopy}
        className="p-1.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded-md transition-colors"
        title="Copy text"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
};
