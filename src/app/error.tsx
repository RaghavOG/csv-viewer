'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled CSVee runtime error:', error);
  }, [error]);

  const handleHardReset = () => {
    try {
      localStorage.clear();
      indexedDB.deleteDatabase('keyval-store');
    } catch (e) {
      // ignore
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-950 text-slate-100 canvas-dot-grid relative overflow-hidden select-none">
      <div className="relative z-10 max-w-lg w-full text-center space-y-6 bg-slate-900/95 border border-rose-500/30 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-rose-950/40">
        {/* Warning Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-2xl font-bold">
          ⚠️
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-100">
            Runtime Kernel Panic in Spreadsheettown
          </h2>
          <p className="text-xs text-rose-300 font-mono mt-1 break-all bg-rose-950/40 p-2 rounded-lg border border-rose-900/50">
            {error.message || 'Unknown catastrophic data anomaly'}
          </p>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Looks like someone fed us a CSV with 1,000,000 unescaped quotes, or the browser ran out of memory. Don&apos;t panic, your local data can be restored or recovered.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30"
          >
            Try Again
          </button>
          <button
            onClick={handleHardReset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-900/40 hover:bg-rose-900/80 border border-rose-700/60 text-rose-200 font-semibold text-xs transition-colors"
          >
            Clear Cache &amp; Reset
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Back to Canvas
          </Link>
        </div>
      </div>
    </div>
  );
}
