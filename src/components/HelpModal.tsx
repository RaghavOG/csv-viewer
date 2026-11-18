'use client';

import React from 'react';
import { X, Keyboard, Sparkles, MousePointer, Layers, ArrowUpDown, Search } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Shortcuts & How to Use
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-slate-300">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
              <MousePointer className="w-4 h-4 text-indigo-500" />
              Infinite Canvas Navigation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span>Pan Canvas</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[11px]">Space + Drag</kbd>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span>Zoom In / Out</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[11px]">Mouse Wheel</kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Pasting & Importing
            </h3>
            <ul className="space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Direct Paste:</strong> Hit <kbd className="px-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">Ctrl+V</kbd> anywhere on the canvas to auto-create a new table right under your cursor!
              </li>
              <li>
                <strong>Excel & Google Sheets:</strong> Copy cells directly from Google Sheets or Excel and paste on the plane. It automatically recognizes tabs, commas, semicolons, or pipes.
              </li>
              <li>
                <strong>Drag & Drop:</strong> Drag any <code className="font-mono text-indigo-500">.csv</code>, <code className="font-mono text-indigo-500">.tsv</code>, or <code className="font-mono text-indigo-500">.json</code> file straight from your computer onto the plane.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
              <Layers className="w-4 h-4 text-purple-500" />
              Table Controls & Hover Tooltip
            </h3>
            <ul className="space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Long Text Tooltip:</strong> Hover over any cell with long or truncated text to see the complete unclipped text, character count, and quick copy button!
              </li>
              <li>
                <strong>Inline Editing:</strong> Double click any cell to edit its value live.
              </li>
              <li>
                <strong>Sorting & Filtering:</strong> Click column headers to sort Ascending / Descending. Use the search icon to filter rows instantly.
              </li>
              <li>
                <strong>Quick Chart:</strong> Toggle between Table View and Quick Bar/Line Chart to visualize data trends immediately.
              </li>
              <li>
                <strong>Export:</strong> Download individual tables as CSV, TSV, JSON, or Markdown tables anytime.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
