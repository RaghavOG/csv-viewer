'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface CellTooltipProps {
  content: string;
  columnName: string;
  x: number;
  y: number;
  onClose?: () => void;
}

export const CellTooltip: React.FC<CellTooltipProps> = ({ content, columnName, x, y }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isUrl = /^https?:\/\//i.test(content);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content);

  // Keep tooltip on screen
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

  const left = Math.min(Math.max(16, x + 12), screenW - 360);
  const top = Math.min(Math.max(16, y + 16), screenH - 240);

  return (
    <div
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 max-w-sm w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/80 p-3 pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[190px]">
          {columnName}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {content.length} chars
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Copy full text"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-emerald-500 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap break-words leading-relaxed select-text p-1.5 bg-slate-50 dark:bg-slate-950/60 rounded-md border border-slate-100 dark:border-slate-800/80">
        {content}
      </div>

      {(isUrl || isEmail) && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          {isUrl && (
            <a
              href={content}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              <span>Open Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {isEmail && (
            <a
              href={`mailto:${content}`}
              className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              <span>Send Email</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
