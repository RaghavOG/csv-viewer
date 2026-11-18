'use client';

import React from 'react';
import {
  Plus,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize,
  Moon,
  Sun,
  HelpCircle,
  Sparkles,
  GitCompare,
  FileSpreadsheet,
} from 'lucide-react';

interface ToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitAll: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenPasteModal: () => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddSample: () => void;
  onOpenDiffModal: () => void;
  onOpenHelp: () => void;
  totalTables: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitAll,
  theme,
  onToggleTheme,
  onOpenPasteModal,
  onUploadFile,
  onAddSample,
  onOpenDiffModal,
  onOpenHelp,
  totalTables,
}) => {
  return (
    <>
      {/* Top Floating App Bar */}
      <header className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Logo and Brand */}
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800/80 select-none">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                PlaneCSV
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                infinite
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {totalTables} table{totalTables === 1 ? '' : 's'} on plane
            </p>
          </div>
        </div>

        {/* Center Canvas Action Bar (Excalidraw floating bar style) */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-slate-200/90 dark:border-slate-800/90">
          {/* Paste CSV / New Table */}
          <button
            onClick={onOpenPasteModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Paste CSV or Tabular Data (or press Ctrl+V directly on canvas)"
          >
            <Plus className="w-4 h-4" />
            <span>Paste CSV</span>
          </button>

          {/* Upload File */}
          <label
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            title="Upload CSV / TSV / JSON file"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
            <input
              type="file"
              accept=".csv,.tsv,.txt,.json"
              onChange={onUploadFile}
              className="hidden"
            />
          </label>

          {/* Add Sample */}
          <button
            onClick={onAddSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
            title="Add sample dataset to plane"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Add Sample</span>
          </button>

          {/* Compare Tables */}
          {totalTables >= 2 && (
            <button
              onClick={onOpenDiffModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
              title="Compare schema & differences between 2 tables"
            >
              <GitCompare className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden sm:inline">Compare</span>
            </button>
          )}
        </div>

        {/* Right Controls: Theme + Help */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Shortcuts Help */}
          <button
            onClick={onOpenHelp}
            className="p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Shortcuts & Tips"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Bottom-Right Zoom & Viewport Widget (Excalidraw style) */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1 p-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl border border-slate-200/80 dark:border-slate-800/80 select-none">
        <button
          onClick={onZoomOut}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Zoom Out (Ctrl -)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onResetZoom}
          className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Zoom In (Ctrl +)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

        <button
          onClick={onFitAll}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Zoom to Fit All Tables"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom-Left Canvas Hint Banner */}
      <div className="fixed bottom-4 left-4 z-40 pointer-events-none hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/70 dark:border-slate-800/70 text-[11px] text-slate-500 dark:text-slate-400 select-none">
        <span>💡 Paste directly with <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300">Ctrl+V</kbd> anywhere</span>
        <span>•</span>
        <span>Pan: <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300">Space + Drag</kbd></span>
      </div>
    </>
  );
};
